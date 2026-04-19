// QuickReply service — passo 15 do Backend Plan (PRD 5.10).
// Shortcut único por workspace (lower + kebab no create/update).
// Placeholders via {{var}} preservados literalmente; quem renderiza é frontend
// (lib/highlight-variables.tsx). RBAC: GET todos, CRUD só manager.

import type { QuickReply } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export type QuickReplyDTO = {
  id: string;
  workspaceId: string;
  shortcut: string;
  title: string;
  category: string | null;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
};

function toDTO(qr: QuickReply): QuickReplyDTO {
  return {
    id: qr.id,
    workspaceId: qr.workspaceId,
    shortcut: qr.shortcut,
    title: qr.title,
    category: qr.category,
    content: qr.content,
    mediaUrl: qr.mediaUrl,
    mediaType: qr.mediaType,
    createdAt: qr.createdAt.toISOString(),
  };
}

export function normalizeShortcut(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ListQuickRepliesInput = {
  workspaceId: string;
  search?: string;
  category?: string;
};

export async function listQuickReplies(
  input: ListQuickRepliesInput,
): Promise<QuickReplyDTO[]> {
  const where: Prisma.QuickReplyWhereInput = { workspaceId: input.workspaceId };
  if (input.category) where.category = input.category;

  const search = input.search?.trim();
  if (search) {
    where.OR = [
      { shortcut: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.quickReply.findMany({
    where,
    orderBy: [{ category: "asc" }, { shortcut: "asc" }],
  });
  return rows.map(toDTO);
}

export type CreateQuickReplyInput = {
  workspaceId: string;
  shortcut: string;
  title: string;
  content: string;
  category?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
};

export async function createQuickReply(
  input: CreateQuickReplyInput,
): Promise<QuickReplyDTO> {
  const shortcut = normalizeShortcut(input.shortcut);
  if (!shortcut) {
    throw new ApiError("Atalho inválido", 422);
  }
  const title = input.title.trim();
  if (!title) {
    throw new ApiError("Título obrigatório", 422);
  }
  const content = input.content.trim();
  if (!content) {
    throw new ApiError("Conteúdo obrigatório", 422);
  }

  try {
    const created = await prisma.quickReply.create({
      data: {
        workspaceId: input.workspaceId,
        shortcut,
        title,
        content,
        category: input.category?.trim() || null,
        mediaUrl: input.mediaUrl ?? null,
        mediaType: input.mediaType ?? null,
      },
    });
    return toDTO(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("Já existe uma resposta com esse atalho", 409);
    }
    throw error;
  }
}

export type UpdateQuickReplyInput = {
  workspaceId: string;
  id: string;
  shortcut?: string;
  title?: string;
  content?: string;
  category?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
};

export async function updateQuickReply(
  input: UpdateQuickReplyInput,
): Promise<QuickReplyDTO> {
  const existing = await prisma.quickReply.findFirst({
    where: { id: input.id, workspaceId: input.workspaceId },
  });
  if (!existing) {
    throw new ApiError("Resposta não encontrada", 404);
  }

  const data: Prisma.QuickReplyUpdateInput = {};

  if (input.shortcut !== undefined) {
    const shortcut = normalizeShortcut(input.shortcut);
    if (!shortcut) {
      throw new ApiError("Atalho inválido", 422);
    }
    data.shortcut = shortcut;
  }
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      throw new ApiError("Título não pode ficar vazio", 422);
    }
    data.title = title;
  }
  if (input.content !== undefined) {
    const content = input.content.trim();
    if (!content) {
      throw new ApiError("Conteúdo não pode ficar vazio", 422);
    }
    data.content = content;
  }
  if (input.category !== undefined) {
    data.category = input.category?.trim() || null;
  }
  if (input.mediaUrl !== undefined) {
    data.mediaUrl = input.mediaUrl;
  }
  if (input.mediaType !== undefined) {
    data.mediaType = input.mediaType;
  }

  try {
    const updated = await prisma.quickReply.update({
      where: { id: existing.id },
      data,
    });
    return toDTO(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("Já existe uma resposta com esse atalho", 409);
    }
    throw error;
  }
}

export async function deleteQuickReply(params: {
  workspaceId: string;
  id: string;
}): Promise<void> {
  const existing = await prisma.quickReply.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
    select: { id: true },
  });
  if (!existing) {
    throw new ApiError("Resposta não encontrada", 404);
  }
  await prisma.quickReply.delete({ where: { id: existing.id } });
}
