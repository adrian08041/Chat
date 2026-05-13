// Contact service — passo 10 do Backend Plan + CRUD do CRM (PR #1 contatos).
// Upsert por webhook e CRUD manual compartilham o mesmo normalizador de phone
// pra garantir que o @@unique(workspaceId, phone) case entre os dois caminhos.

import type { Contact } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// ============================================================================
// Tipos públicos
// ============================================================================

export type ContactTagDTO = {
  id: string;
  name: string;
  color: string;
};

export type ContactAssignedUserDTO = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type ContactListItemDTO = {
  id: string;
  workspaceId: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  source: string | null;
  notes: string | null;
  assignedUserId: string | null;
  assignedUser: ContactAssignedUserDTO | null;
  tags: ContactTagDTO[];
  conversasCount: number;
  ultimoContato: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListContactsPage = {
  items: ContactListItemDTO[];
  nextCursor: string | null;
};

// ============================================================================
// Helpers
// ============================================================================

// Phone canônico: só dígitos, sem @suffix. Mesma regra usada no webhook.
export function normalizeContactPhone(raw: string): string {
  const atStripped = raw.includes("@") ? raw.slice(0, raw.indexOf("@")) : raw;
  return atStripped.replace(/\D/g, "");
}

type ContactWithRelations = Prisma.ContactGetPayload<{
  include: {
    assignedUser: { select: { id: true; name: true; avatarUrl: true } };
    tags: { include: { tag: true } };
  };
}>;

function toListItemDTO(
  contact: ContactWithRelations,
  aggregate: { count: number; lastMessageAt: Date | null } | undefined,
): ContactListItemDTO {
  return {
    id: contact.id,
    workspaceId: contact.workspaceId,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    avatarUrl: contact.avatarUrl,
    source: contact.source,
    notes: contact.notes,
    assignedUserId: contact.assignedUserId,
    assignedUser: contact.assignedUser
      ? {
          id: contact.assignedUser.id,
          name: contact.assignedUser.name,
          avatarUrl: contact.assignedUser.avatarUrl,
        }
      : null,
    tags: contact.tags.map((ct) => ({
      id: ct.tag.id,
      name: ct.tag.name,
      color: ct.tag.color,
    })),
    conversasCount: aggregate?.count ?? 0,
    ultimoContato: aggregate?.lastMessageAt?.toISOString() ?? null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

async function aggregateConversationsByContact(
  workspaceId: string,
  contactIds: string[],
): Promise<Map<string, { count: number; lastMessageAt: Date | null }>> {
  if (contactIds.length === 0) return new Map();
  const grouped = await prisma.conversation.groupBy({
    by: ["contactId"],
    where: { workspaceId, contactId: { in: contactIds } },
    _count: { _all: true },
    _max: { lastMessageAt: true },
  });
  return new Map(
    grouped.map((g) => [
      g.contactId,
      { count: g._count._all, lastMessageAt: g._max.lastMessageAt },
    ]),
  );
}

// ============================================================================
// Upsert do webhook (mantido) — normaliza phone antes de comparar/gravar.
// ============================================================================

export async function upsertContactFromInbound(params: {
  workspaceId: string;
  phone: string;
  fallbackName: string | null;
  // avatarUrl sempre sobrescreve quando informado — uazapi é fonte da verdade
  // da foto de perfil. fallbackName segue regra só-se-vazio (preserva edição manual).
  avatarUrl?: string | null;
}): Promise<{ contact: Contact; created: boolean }> {
  const phone = normalizeContactPhone(params.phone);
  if (!phone) throw new Error("upsertContactFromInbound requer phone não-vazio");

  const fallbackName = params.fallbackName?.trim() || null;
  const avatarUrl = params.avatarUrl?.trim() || null;

  const existing = await prisma.contact.findUnique({
    where: { workspaceId_phone: { workspaceId: params.workspaceId, phone } },
  });

  if (!existing) {
    const created = await prisma.contact.create({
      data: {
        workspaceId: params.workspaceId,
        phone,
        name: fallbackName,
        avatarUrl,
      },
    });
    return { contact: created, created: true };
  }

  const updates: Prisma.ContactUpdateInput = {};
  if (!existing.name && fallbackName) updates.name = fallbackName;
  if (avatarUrl !== null) updates.avatarUrl = avatarUrl;

  if (Object.keys(updates).length === 0) {
    return { contact: existing, created: false };
  }
  const updated = await prisma.contact.update({
    where: { id: existing.id },
    data: updates,
  });
  return { contact: updated, created: false };
}

// ============================================================================
// List (paginada com cursor)
// ============================================================================

export type ContactSavedFilter = "saved" | "unsaved";

export type ListContactsInput = {
  workspaceId: string;
  search?: string;
  tagId?: string;
  // "saved" = tem nome preenchido; "unsaved" = só telefone (importado do uazapi
  // ou webhook). Sem o filtro = todos.
  savedFilter?: ContactSavedFilter;
  cursor?: string;
  limit?: number;
};

export async function listContacts(
  input: ListContactsInput,
): Promise<ListContactsPage> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const where: Prisma.ContactWhereInput = { workspaceId: input.workspaceId };

  const search = input.search?.trim();
  if (search) {
    const phoneDigits = normalizeContactPhone(search);
    const or: Prisma.ContactWhereInput[] = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
    if (phoneDigits) {
      or.push({ phone: { contains: phoneDigits } });
    }
    where.OR = or;
  }

  if (input.tagId) {
    where.tags = { some: { tagId: input.tagId } };
  }

  if (input.savedFilter === "saved") {
    where.name = { not: null };
  } else if (input.savedFilter === "unsaved") {
    where.name = null;
  }

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      assignedUser: { select: { id: true, name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
  });

  const hasNext = contacts.length > limit;
  const page = hasNext ? contacts.slice(0, limit) : contacts;

  const aggregates = await aggregateConversationsByContact(
    input.workspaceId,
    page.map((c) => c.id),
  );

  return {
    items: page.map((c) => toListItemDTO(c, aggregates.get(c.id))),
    nextCursor: hasNext ? page[page.length - 1].id : null,
  };
}

// ============================================================================
// Get
// ============================================================================

export async function getContact(params: {
  workspaceId: string;
  id: string;
}): Promise<ContactListItemDTO> {
  const contact = await prisma.contact.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
    include: {
      assignedUser: { select: { id: true, name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!contact) throw new ApiError("Contato não encontrado", 404);

  const aggregates = await aggregateConversationsByContact(
    params.workspaceId,
    [contact.id],
  );
  return toListItemDTO(contact, aggregates.get(contact.id));
}

// ============================================================================
// Create
// ============================================================================

export type CreateContactInput = {
  workspaceId: string;
  name: string;
  phone: string;
  email?: string | null;
  assignedUserId?: string | null;
  tagIds?: string[];
  source?: string | null;
  notes?: string | null;
};

export async function createContact(
  input: CreateContactInput,
): Promise<ContactListItemDTO> {
  const name = input.name.trim();
  if (!name) throw new ApiError("Nome obrigatório", 422);

  const phone = normalizeContactPhone(input.phone);
  if (!phone) throw new ApiError("Telefone inválido", 422);

  const email = input.email?.trim() || null;
  const source = input.source?.trim() || null;
  const notes = input.notes?.trim() || null;
  const tagIds = input.tagIds ?? [];

  // Valida FK de responsável e tags ANTES de inserir pra dar erro semântico
  // (senão Prisma P2003 vira 500 genérico).
  if (input.assignedUserId) {
    const user = await prisma.user.findFirst({
      where: {
        id: input.assignedUserId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!user) throw new ApiError("Responsável inválido", 422);
  }
  if (tagIds.length > 0) {
    const found = await prisma.tag.count({
      where: { id: { in: tagIds }, workspaceId: input.workspaceId },
    });
    if (found !== tagIds.length) throw new ApiError("Tag inválida", 422);
  }

  try {
    const created = await prisma.contact.create({
      data: {
        workspaceId: input.workspaceId,
        name,
        phone,
        email,
        source,
        notes,
        assignedUserId: input.assignedUserId ?? null,
        tags: tagIds.length > 0
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        assignedUser: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });
    return toListItemDTO(created, undefined);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("Já existe um contato com esse telefone", 409, {
        code: "phone_exists",
      });
    }
    throw error;
  }
}

// ============================================================================
// Update
// ============================================================================

export type UpdateContactInput = {
  workspaceId: string;
  id: string;
  name?: string;
  phone?: string;
  email?: string | null;
  assignedUserId?: string | null;
  tagIds?: string[];
  source?: string | null;
  notes?: string | null;
};

export async function updateContact(
  input: UpdateContactInput,
): Promise<ContactListItemDTO> {
  const existing = await prisma.contact.findFirst({
    where: { id: input.id, workspaceId: input.workspaceId },
    select: { id: true },
  });
  if (!existing) throw new ApiError("Contato não encontrado", 404);

  const data: Prisma.ContactUpdateInput = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new ApiError("Nome não pode ficar vazio", 422);
    data.name = name;
  }
  if (input.phone !== undefined) {
    const phone = normalizeContactPhone(input.phone);
    if (!phone) throw new ApiError("Telefone inválido", 422);
    data.phone = phone;
  }
  if (input.email !== undefined) {
    data.email = input.email?.trim() || null;
  }
  if (input.source !== undefined) {
    data.source = input.source?.trim() || null;
  }
  if (input.notes !== undefined) {
    data.notes = input.notes?.trim() || null;
  }
  if (input.assignedUserId !== undefined) {
    if (input.assignedUserId) {
      const user = await prisma.user.findFirst({
        where: {
          id: input.assignedUserId,
          workspaceId: input.workspaceId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!user) throw new ApiError("Responsável inválido", 422);
      data.assignedUser = { connect: { id: input.assignedUserId } };
    } else {
      data.assignedUser = { disconnect: true };
    }
  }

  // Transação: update campos + reconciliação de tags (delete missing / add new).
  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      try {
        await tx.contact.update({ where: { id: existing.id }, data });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ApiError("Já existe um contato com esse telefone", 409, {
            code: "phone_exists",
          });
        }
        throw error;
      }
    }

    if (input.tagIds !== undefined) {
      const desired = new Set(input.tagIds);
      if (desired.size > 0) {
        const found = await tx.tag.count({
          where: { id: { in: [...desired] }, workspaceId: input.workspaceId },
        });
        if (found !== desired.size) throw new ApiError("Tag inválida", 422);
      }
      const current = await tx.contactTag.findMany({
        where: { contactId: existing.id },
        select: { tagId: true },
      });
      const currentIds = new Set(current.map((c) => c.tagId));
      const toRemove = [...currentIds].filter((id) => !desired.has(id));
      const toAdd = [...desired].filter((id) => !currentIds.has(id));
      if (toRemove.length > 0) {
        await tx.contactTag.deleteMany({
          where: { contactId: existing.id, tagId: { in: toRemove } },
        });
      }
      if (toAdd.length > 0) {
        await tx.contactTag.createMany({
          data: toAdd.map((tagId) => ({ contactId: existing.id, tagId })),
        });
      }
    }

    return tx.contact.findUniqueOrThrow({
      where: { id: existing.id },
      include: {
        assignedUser: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });
  });

  const aggregates = await aggregateConversationsByContact(input.workspaceId, [
    result.id,
  ]);
  return toListItemDTO(result, aggregates.get(result.id));
}

// ============================================================================
// Delete — bloqueia se houver conversas
// ============================================================================

export async function deleteContact(params: {
  workspaceId: string;
  id: string;
}): Promise<void> {
  const existing = await prisma.contact.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
    select: { id: true },
  });
  if (!existing) throw new ApiError("Contato não encontrado", 404);

  const conversasCount = await prisma.conversation.count({
    where: { workspaceId: params.workspaceId, contactId: existing.id },
  });
  if (conversasCount > 0) {
    throw new ApiError(
      "Este contato possui conversas e não pode ser excluído",
      409,
      { code: "has_conversations" },
    );
  }

  // ContactTag tem onDelete: Cascade no schema — some junto.
  await prisma.contact.delete({ where: { id: existing.id } });
}

// ============================================================================
// Profile — contato + timeline de conversas + notas agregadas
// ============================================================================

export type ContactProfileConversationDTO = {
  id: string;
  instanceId: string;
  instanceName: string;
  instanceColor: string;
  assignedUserName: string | null;
  status: "UNASSIGNED" | "OPEN" | "WAITING_CUSTOMER" | "RESOLVED" | "REOPENED";
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessage: {
    content: string | null;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string;
  } | null;
  messagesCount: number;
  createdAt: string;
  resolvedAt: string | null;
};

export type ContactProfileNoteDTO = {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};

export type ContactProfileDTO = {
  contact: ContactListItemDTO;
  conversations: ContactProfileConversationDTO[];
  notes: ContactProfileNoteDTO[];
};

export async function getContactProfile(params: {
  workspaceId: string;
  id: string;
}): Promise<ContactProfileDTO> {
  const contact = await getContact(params);

  const conversations = await prisma.conversation.findMany({
    where: { workspaceId: params.workspaceId, contactId: params.id },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      instance: { select: { id: true, name: true, color: true } },
      assignedUser: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, direction: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const conversationIds = conversations.map((c) => c.id);

  const notes = conversationIds.length > 0
    ? await prisma.conversationNote.findMany({
        where: { conversationId: { in: conversationIds } },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { user: { select: { id: true, name: true } } },
      })
    : [];

  return {
    contact,
    conversations: conversations.map((c) => ({
      id: c.id,
      instanceId: c.instanceId,
      instanceName: c.instance.name,
      instanceColor: c.instance.color,
      assignedUserName: c.assignedUser?.name ?? null,
      status: c.status,
      unreadCount: c.unreadCount,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content,
            direction: c.messages[0].direction,
            createdAt: c.messages[0].createdAt.toISOString(),
          }
        : null,
      messagesCount: c._count.messages,
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
    })),
    notes: notes.map((n) => ({
      id: n.id,
      conversationId: n.conversationId,
      userId: n.userId,
      userName: n.user.name,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}
