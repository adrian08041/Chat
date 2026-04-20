// Tag service — passo 15 do Backend Plan (PRD 5.9).
// CRUD de tags canônicas do workspace + aplicação em conversas.
// Paleta fechada (8 cores). Nome único por workspace (case-insensitive via lower).
// Delete cascateia pivots (ConversationTag/ContactTag).

import type { Tag } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/realtime";

export const TAG_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#0EA5E9",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export type TagDTO = {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

function toTagDTO(tag: Tag): TagDTO {
  return {
    id: tag.id,
    workspaceId: tag.workspaceId,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}

function assertValidColor(color: string): void {
  if (!(TAG_COLORS as readonly string[]).includes(color)) {
    throw new ApiError("Cor inválida", 422);
  }
}

export async function listTags(workspaceId: string): Promise<TagDTO[]> {
  const tags = await prisma.tag.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });
  return tags.map(toTagDTO);
}

export type CreateTagInput = {
  workspaceId: string;
  name: string;
  color: string;
};

export async function createTag(input: CreateTagInput): Promise<TagDTO> {
  const name = input.name.trim();
  if (!name) {
    throw new ApiError("Nome obrigatório", 422);
  }
  assertValidColor(input.color);

  try {
    const tag = await prisma.tag.create({
      data: {
        workspaceId: input.workspaceId,
        name,
        color: input.color,
      },
    });
    return toTagDTO(tag);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("Já existe uma tag com esse nome", 409);
    }
    throw error;
  }
}

export type UpdateTagInput = {
  workspaceId: string;
  tagId: string;
  name?: string;
  color?: string;
};

export async function updateTag(input: UpdateTagInput): Promise<TagDTO> {
  const existing = await prisma.tag.findFirst({
    where: { id: input.tagId, workspaceId: input.workspaceId },
  });
  if (!existing) {
    throw new ApiError("Tag não encontrada", 404);
  }

  if (input.color !== undefined) {
    assertValidColor(input.color);
  }
  const name = input.name?.trim();
  if (name !== undefined && !name) {
    throw new ApiError("Nome não pode ficar vazio", 422);
  }

  try {
    const updated = await prisma.tag.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(input.color !== undefined && { color: input.color }),
      },
    });
    return toTagDTO(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("Já existe uma tag com esse nome", 409);
    }
    throw error;
  }
}

export async function deleteTag(params: {
  workspaceId: string;
  tagId: string;
}): Promise<void> {
  const existing = await prisma.tag.findFirst({
    where: { id: params.tagId, workspaceId: params.workspaceId },
    select: { id: true },
  });
  if (!existing) {
    throw new ApiError("Tag não encontrada", 404);
  }
  await prisma.tag.delete({ where: { id: existing.id } });
}

// ----------------------------------------------------------------------------
// Aplicação em conversa
// ----------------------------------------------------------------------------

export async function setConversationTags(params: {
  workspaceId: string;
  conversationId: string;
  actorId: string;
  tagIds: string[];
}): Promise<TagDTO[]> {
  const { tags, assignedUserId } = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.findFirst({
      where: {
        id: params.conversationId,
        workspaceId: params.workspaceId,
      },
      select: { id: true, assignedUserId: true },
    });
    if (!conv) {
      throw new ApiError("Conversa não encontrada", 404);
    }

    const uniqueIds = [...new Set(params.tagIds)];
    if (uniqueIds.length > 0) {
      const valid = await tx.tag.findMany({
        where: {
          id: { in: uniqueIds },
          workspaceId: params.workspaceId,
        },
        select: { id: true },
      });
      if (valid.length !== uniqueIds.length) {
        throw new ApiError("Alguma tag informada não pertence ao workspace", 422);
      }
    }

    const current = await tx.conversationTag.findMany({
      where: { conversationId: params.conversationId },
      select: { tagId: true },
    });
    const currentIds = new Set(current.map((r) => r.tagId));
    const nextIds = new Set(uniqueIds);

    const toAdd = uniqueIds.filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

    if (toRemove.length > 0) {
      await tx.conversationTag.deleteMany({
        where: {
          conversationId: params.conversationId,
          tagId: { in: toRemove },
        },
      });
    }
    if (toAdd.length > 0) {
      await tx.conversationTag.createMany({
        data: toAdd.map((tagId) => ({
          conversationId: params.conversationId,
          tagId,
        })),
      });
    }

    const eventRows = [
      ...toAdd.map((tagId) => ({
        conversationId: params.conversationId,
        type: "TAGGED" as const,
        actorId: params.actorId,
        payload: { tagId } as Prisma.InputJsonValue,
      })),
      ...toRemove.map((tagId) => ({
        conversationId: params.conversationId,
        type: "UNTAGGED" as const,
        actorId: params.actorId,
        payload: { tagId } as Prisma.InputJsonValue,
      })),
    ];
    if (eventRows.length > 0) {
      await tx.conversationEvent.createMany({ data: eventRows });
    }

    const rows = await tx.conversationTag.findMany({
      where: { conversationId: params.conversationId },
      include: { tag: true },
      orderBy: { tag: { name: "asc" } },
    });
    return {
      tags: rows.map((r) => toTagDTO(r.tag)),
      assignedUserId: conv.assignedUserId,
    };
  });

  publish(params.workspaceId, {
    type: "conversation:updated",
    conversationId: params.conversationId,
    visibility: { assignedUserId },
  });

  return tags;
}
