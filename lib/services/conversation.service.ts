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
  Instance,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

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
