// Conversation service — passos 10 + 11 do Backend Plan.
// `findOrCreateActive`: busca a última conversa de (contact, instance). Se
// RESOLVED, REOPENA (status → REOPENED + event REOPENED). Se não existe,
// cria UNASSIGNED + event OPENED.
// `getActiveConversationForOutbound`: lookup pra envio — deve existir, pertencer
// ao workspace, não estar soft-deleted; auto-reabre se RESOLVED.
// Timeline append-only em ConversationEvent (§10.3).

import type {
  Contact,
  Conversation,
  ConversationEvent,
  ConversationEventType,
  ConversationStatus,
  Instance,
  Message,
  Tag,
  User,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { toPublicInstance, type InstancePublic } from "./instance.service";
import type { TagDTO } from "./tag.service";

type PrismaClientOrTx = Prisma.TransactionClient | typeof prisma;

export async function appendEvent(
  client: PrismaClientOrTx,
  params: {
    conversationId: string;
    type: ConversationEventType;
    actorId?: string | null;
    payload?: Prisma.InputJsonValue;
  },
): Promise<ConversationEvent> {
  return client.conversationEvent.create({
    data: {
      conversationId: params.conversationId,
      type: params.type,
      actorId: params.actorId ?? null,
      payload: params.payload,
    },
  });
}

export async function findOrCreateActiveConversation(params: {
  workspaceId: string;
  contactId: string;
  instanceId: string;
}): Promise<Conversation> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.conversation.findFirst({
      where: {
        workspaceId: params.workspaceId,
        contactId: params.contactId,
        instanceId: params.instanceId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (latest && latest.status !== "RESOLVED") {
      return latest;
    }

    if (latest && latest.status === "RESOLVED") {
      const reopened = await tx.conversation.update({
        where: { id: latest.id },
        data: { status: "REOPENED", resolvedAt: null },
      });
      await appendEvent(tx, {
        conversationId: reopened.id,
        type: "REOPENED",
      });
      return reopened;
    }

    const created = await tx.conversation.create({
      data: {
        workspaceId: params.workspaceId,
        contactId: params.contactId,
        instanceId: params.instanceId,
      },
    });
    await appendEvent(tx, { conversationId: created.id, type: "OPENED" });
    return created;
  });
}

export type ConversationWithDeps = {
  conversation: Conversation;
  contact: Contact;
  instance: Instance;
};

// Carrega conversa + deps pra envio outbound. Falha se:
// - conversa não existe ou é de outro workspace
// - instance deletada
// Auto-reopen de RESOLVED pra manter simetria com inbound.
export async function getActiveConversationForOutbound(params: {
  workspaceId: string;
  conversationId: string;
}): Promise<ConversationWithDeps> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      workspaceId: params.workspaceId,
    },
    include: { contact: true, instance: true },
  });

  if (!conversation) {
    throw new ApiError("Conversa não encontrada", 404);
  }
  if (conversation.instance.deletedAt) {
    throw new ApiError("Instância da conversa foi removida", 409);
  }

  let current = conversation;
  if (current.status === "RESOLVED") {
    const reopened = await prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.update({
        where: { id: current.id },
        data: { status: "REOPENED", resolvedAt: null },
        include: { contact: true, instance: true },
      });
      await appendEvent(tx, {
        conversationId: updated.id,
        type: "REOPENED",
      });
      return updated;
    });
    current = reopened;
  }

  const { contact, instance, ...conv } = current;
  return { conversation: conv, contact, instance };
}

// ============================================================================
// Listagem + detalhe + mark-as-read — passo 13.3 do Backend Plan.
// ============================================================================

export type ConversationListItemDTO = {
  id: string;
  workspaceId: string;
  contactId: string;
  instanceId: string;
  assignedUserId: string | null;
  assignedUser: { id: string; name: string } | null;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  contact: {
    id: string;
    name: string | null;
    phone: string;
    avatarUrl: string | null;
  };
  instance: {
    id: string;
    name: string;
    color: string;
  };
  lastMessage: {
    content: string | null;
    direction: Message["direction"];
    createdAt: string;
  } | null;
};

function toConversationListItem(
  row: Conversation & {
    contact: Pick<Contact, "id" | "name" | "phone" | "avatarUrl">;
    instance: Pick<Instance, "id" | "name" | "color">;
    assignedUser: Pick<User, "id" | "name"> | null;
    messages: Pick<Message, "content" | "direction" | "createdAt">[];
  },
): ConversationListItemDTO {
  const last = row.messages[0] ?? null;
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    contactId: row.contactId,
    instanceId: row.instanceId,
    assignedUserId: row.assignedUserId,
    assignedUser: row.assignedUser
      ? { id: row.assignedUser.id, name: row.assignedUser.name }
      : null,
    status: row.status,
    unreadCount: row.unreadCount,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    contact: {
      id: row.contact.id,
      name: row.contact.name,
      phone: row.contact.phone,
      avatarUrl: row.contact.avatarUrl,
    },
    instance: {
      id: row.instance.id,
      name: row.instance.name,
      color: row.instance.color,
    },
    lastMessage: last
      ? {
          content: last.content,
          direction: last.direction,
          createdAt: last.createdAt.toISOString(),
        }
      : null,
  };
}

export type ListConversationsInput = {
  workspaceId: string;
  status?: ConversationStatus;
  assignedUserId?: string | null;
  instanceId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
};

export type ConversationListResult = {
  items: ConversationListItemDTO[];
  nextCursor: string | null;
};

export async function listConversations(
  input: ListConversationsInput,
): Promise<ConversationListResult> {
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);

  const where: Prisma.ConversationWhereInput = {
    workspaceId: input.workspaceId,
  };

  if (input.status) where.status = input.status;
  if (input.instanceId) where.instanceId = input.instanceId;
  // assignedUserId: string = filtro por user; null explícito = UNASSIGNED na prática,
  // mas já há filtro por status.UNASSIGNED. Aqui só aplicamos se string não-vazia.
  if (input.assignedUserId) where.assignedUserId = input.assignedUserId;

  const trimmedSearch = input.search?.trim();
  if (trimmedSearch) {
    where.contact = {
      OR: [
        { name: { contains: trimmedSearch, mode: "insensitive" } },
        { phone: { contains: trimmedSearch, mode: "insensitive" } },
      ],
    };
  }

  const rows = await prisma.conversation.findMany({
    where,
    include: {
      contact: {
        select: { id: true, name: true, phone: true, avatarUrl: true },
      },
      instance: { select: { id: true, name: true, color: true } },
      assignedUser: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, direction: true, createdAt: true },
      },
    },
    // Prisma permite múltiplos orderBy; o segundo atua como tiebreaker estável
    // pro cursor. Nulls last pra conversas sem mensagem ainda.
    orderBy: [
      { lastMessageAt: { sort: "desc", nulls: "last" } },
      { id: "desc" },
    ],
    take: limit + 1,
    ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: trimmed.map(toConversationListItem),
    nextCursor: hasMore ? trimmed[trimmed.length - 1].id : null,
  };
}

export type ConversationDetailDTO = ConversationListItemDTO & {
  contactFull: {
    id: string;
    workspaceId: string;
    name: string | null;
    phone: string;
    email: string | null;
    avatarUrl: string | null;
    source: string | null;
    assignedUserId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  instanceFull: InstancePublic;
  tags: TagDTO[];
};

function tagRowToDTO(tag: Tag): TagDTO {
  return {
    id: tag.id,
    workspaceId: tag.workspaceId,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}

export async function getConversationById(params: {
  workspaceId: string;
  conversationId: string;
}): Promise<ConversationDetailDTO> {
  const row = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      workspaceId: params.workspaceId,
    },
    include: {
      contact: true,
      instance: true,
      assignedUser: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, direction: true, createdAt: true },
      },
      tags: {
        include: { tag: true },
        orderBy: { tag: { name: "asc" } },
      },
    },
  });

  if (!row) {
    throw new ApiError("Conversa não encontrada", 404);
  }

  const base = toConversationListItem(row);
  return {
    ...base,
    contactFull: {
      id: row.contact.id,
      workspaceId: row.contact.workspaceId,
      name: row.contact.name,
      phone: row.contact.phone,
      email: row.contact.email,
      avatarUrl: row.contact.avatarUrl,
      source: row.contact.source,
      assignedUserId: row.contact.assignedUserId,
      createdAt: row.contact.createdAt.toISOString(),
      updatedAt: row.contact.updatedAt.toISOString(),
    },
    instanceFull: toPublicInstance(row.instance),
    tags: row.tags.map((r) => tagRowToDTO(r.tag)),
  };
}

export async function markConversationRead(params: {
  workspaceId: string;
  conversationId: string;
}): Promise<{ unreadCount: 0 }> {
  const existing = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      workspaceId: params.workspaceId,
    },
    select: { id: true, unreadCount: true },
  });

  if (!existing) {
    throw new ApiError("Conversa não encontrada", 404);
  }

  if (existing.unreadCount === 0) {
    return { unreadCount: 0 };
  }

  await prisma.conversation.update({
    where: { id: existing.id },
    data: { unreadCount: 0 },
  });
  return { unreadCount: 0 };
}

// ============================================================================
// Assign / transfer / resolve / reopen — passo 16 do Backend Plan.
// ============================================================================

async function loadConversationForMutation(
  tx: PrismaClientOrTx,
  params: { workspaceId: string; conversationId: string },
): Promise<Conversation> {
  const existing = await tx.conversation.findFirst({
    where: {
      id: params.conversationId,
      workspaceId: params.workspaceId,
    },
  });
  if (!existing) {
    throw new ApiError("Conversa não encontrada", 404);
  }
  return existing;
}

async function assertAssigneeBelongsToWorkspace(
  tx: PrismaClientOrTx,
  params: { workspaceId: string; userId: string },
): Promise<void> {
  const user = await tx.user.findFirst({
    where: {
      id: params.userId,
      workspaceId: params.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!user) {
    throw new ApiError("Atendente inválido", 409);
  }
}

export type AssignConversationInput = {
  workspaceId: string;
  conversationId: string;
  actorId: string;
  newAssigneeId: string | null;
};

export async function assignConversation(
  input: AssignConversationInput,
): Promise<ConversationDetailDTO> {
  await prisma.$transaction(async (tx) => {
    const current = await loadConversationForMutation(tx, input);

    if (current.assignedUserId === input.newAssigneeId) {
      return;
    }

    if (input.newAssigneeId) {
      await assertAssigneeBelongsToWorkspace(tx, {
        workspaceId: input.workspaceId,
        userId: input.newAssigneeId,
      });
    }

    // Status rule: UNASSIGNED quando sem assignee; OPEN quando passa a ter
    // (exceto se já está RESOLVED — nesse caso mantém RESOLVED pra não ressuscitar
    // sem passar por reopen explícito).
    let nextStatus: ConversationStatus = current.status;
    if (input.newAssigneeId === null) {
      nextStatus = "UNASSIGNED";
    } else if (current.status === "UNASSIGNED") {
      nextStatus = "OPEN";
    }

    await tx.conversation.update({
      where: { id: current.id },
      data: {
        assignedUserId: input.newAssigneeId,
        status: nextStatus,
      },
    });

    const eventType: ConversationEventType =
      current.assignedUserId && input.newAssigneeId
        ? "TRANSFERRED"
        : "ASSIGNED";
    await appendEvent(tx, {
      conversationId: current.id,
      type: eventType,
      actorId: input.actorId,
      payload: {
        fromUserId: current.assignedUserId,
        toUserId: input.newAssigneeId,
      },
    });
  });

  return getConversationById({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
  });
}

// Idempotente — se a conversa já tem assignee, não faz nada.
// Usado no outbound: AGENT (ou qualquer role) que envia em UNASSIGNED vira assignee.
export async function autoAssignIfUnassigned(
  tx: PrismaClientOrTx,
  params: { conversationId: string; userId: string },
): Promise<void> {
  const current = await tx.conversation.findUnique({
    where: { id: params.conversationId },
    select: { assignedUserId: true, status: true },
  });
  if (!current || current.assignedUserId) return;

  await tx.conversation.update({
    where: { id: params.conversationId },
    data: {
      assignedUserId: params.userId,
      // Se estava UNASSIGNED, promove pra OPEN. Outros status (RESOLVED/REOPENED)
      // já são tratados antes via getActiveConversationForOutbound.
      ...(current.status === "UNASSIGNED" && { status: "OPEN" }),
    },
  });
  await appendEvent(tx, {
    conversationId: params.conversationId,
    type: "ASSIGNED",
    actorId: params.userId,
    payload: { fromUserId: null, toUserId: params.userId, auto: true },
  });
}

export type ResolveConversationInput = {
  workspaceId: string;
  conversationId: string;
  actorId: string;
};

export async function resolveConversation(
  input: ResolveConversationInput,
): Promise<ConversationDetailDTO> {
  await prisma.$transaction(async (tx) => {
    const current = await loadConversationForMutation(tx, input);
    if (current.status === "RESOLVED") {
      throw new ApiError("Conversa já está resolvida", 409);
    }
    await tx.conversation.update({
      where: { id: current.id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    await appendEvent(tx, {
      conversationId: current.id,
      type: "RESOLVED",
      actorId: input.actorId,
    });
  });

  return getConversationById({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
  });
}

export type ReopenConversationInput = ResolveConversationInput;

export async function reopenConversation(
  input: ReopenConversationInput,
): Promise<ConversationDetailDTO> {
  await prisma.$transaction(async (tx) => {
    const current = await loadConversationForMutation(tx, input);
    if (current.status !== "RESOLVED") {
      throw new ApiError("Apenas conversas resolvidas podem ser reabertas", 409);
    }
    await tx.conversation.update({
      where: { id: current.id },
      data: { status: "REOPENED", resolvedAt: null },
    });
    await appendEvent(tx, {
      conversationId: current.id,
      type: "REOPENED",
      actorId: input.actorId,
    });
  });

  return getConversationById({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
  });
}
