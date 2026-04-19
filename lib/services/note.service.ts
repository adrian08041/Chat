// Conversation notes — passo 15 do Backend Plan (PRD 5.7).
// Notas internas visíveis só pra equipe. RBAC: AGENT só acessa conversas
// atribuídas a ele; manager (ADMIN/SUPERVISOR) vê tudo do workspace.
// Cada create registra ConversationEvent NOTE_ADDED na timeline.
// Delete: autor ou manager.

import type { ConversationNote, User } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { appendEvent } from "./conversation.service";

export type NoteDTO = {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};

function toNoteDTO(
  note: ConversationNote & { user: Pick<User, "id" | "name"> },
): NoteDTO {
  return {
    id: note.id,
    conversationId: note.conversationId,
    userId: note.userId,
    userName: note.user.name,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
  };
}

async function assertConversationAccess(params: {
  workspaceId: string;
  conversationId: string;
  actorId: string;
  isManager: boolean;
}): Promise<void> {
  const conv = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      workspaceId: params.workspaceId,
    },
    select: { assignedUserId: true },
  });
  if (!conv) {
    throw new ApiError("Conversa não encontrada", 404);
  }
  if (!params.isManager && conv.assignedUserId !== params.actorId) {
    throw new ApiError("Acesso negado a essa conversa", 403);
  }
}

export async function listConversationNotes(params: {
  workspaceId: string;
  conversationId: string;
  actorId: string;
  isManager: boolean;
}): Promise<NoteDTO[]> {
  await assertConversationAccess(params);
  const notes = await prisma.conversationNote.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return notes.map(toNoteDTO);
}

export type CreateNoteInput = {
  workspaceId: string;
  conversationId: string;
  userId: string;
  isManager: boolean;
  content: string;
};

export async function createConversationNote(
  input: CreateNoteInput,
): Promise<NoteDTO> {
  const content = input.content.trim();
  if (!content) {
    throw new ApiError("Nota não pode ficar vazia", 422);
  }

  // Access check + create + event na mesma tx fecha a corrida contra
  // transferência concorrente da conversa entre o check e o create.
  const note = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.findFirst({
      where: {
        id: input.conversationId,
        workspaceId: input.workspaceId,
      },
      select: { assignedUserId: true },
    });
    if (!conv) {
      throw new ApiError("Conversa não encontrada", 404);
    }
    if (!input.isManager && conv.assignedUserId !== input.userId) {
      throw new ApiError("Acesso negado a essa conversa", 403);
    }

    const created = await tx.conversationNote.create({
      data: {
        conversationId: input.conversationId,
        userId: input.userId,
        content,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    await appendEvent(tx, {
      conversationId: input.conversationId,
      type: "NOTE_ADDED",
      actorId: input.userId,
      payload: { noteId: created.id },
    });
    return created;
  });

  return toNoteDTO(note);
}

export async function deleteConversationNote(params: {
  workspaceId: string;
  noteId: string;
  actorId: string;
  isManager: boolean;
}): Promise<void> {
  const note = await prisma.conversationNote.findFirst({
    where: { id: params.noteId },
    include: { conversation: { select: { workspaceId: true } } },
  });
  if (!note || note.conversation.workspaceId !== params.workspaceId) {
    throw new ApiError("Nota não encontrada", 404);
  }
  if (!params.isManager && note.userId !== params.actorId) {
    throw new ApiError("Você só pode apagar suas próprias notas", 403);
  }
  await prisma.conversationNote.delete({ where: { id: params.noteId } });
}
