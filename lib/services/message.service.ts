// Message service — passos 10 + 11 do Backend Plan.
// Inbound: idempotência via Message.uazapiMessageId @unique (catch P2002 = webhook reentregue).
// Outbound: Message.id vira trackId no UazApi; webhook pode chegar antes do send
// responder, por isso updateMessageStatusByReference faz fallback por trackId.
// Grupo é ignorado (log) no MVP — SAC 1:1 não comporta grupo ainda.

import type {
  Instance,
  Message,
  MessageStatus,
  MessageType,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { upsertContactFromInbound } from "@/lib/services/contact.service";
import {
  appendEvent,
  findOrCreateActiveConversation,
  getActiveConversationForOutbound,
} from "@/lib/services/conversation.service";
import {
  getUazApiClient,
  UazApiError,
  type SendMediaParams,
  type SendTextParams,
  type UazApiClient,
  type UazApiMediaType,
} from "@/lib/uazapi";
import type {
  NormalizedMessage,
  WhatsAppMessageStatus,
} from "@/lib/whatsapp/types";

export type PersistInboundResult =
  | { outcome: "created"; message: Message }
  | { outcome: "duplicate"; message: Message }
  | { outcome: "ignored"; reason: string };

// Ordem: SENDING < SENT < DELIVERED < READ. FAILED é terminal.
const STATUS_ORDER: Record<MessageStatus, number> = {
  SENDING: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
  FAILED: 4,
};

function mapInboundDefaultStatus(
  fromMe: boolean,
  normalized: WhatsAppMessageStatus,
): MessageStatus {
  // Inbound (customer → app): chegou aqui = DELIVERED pelo nosso lado.
  if (!fromMe) return "DELIVERED";
  // Outbound fromMe=true (cliente respondeu do próprio celular, fora do sistema):
  // se o payload informou SENT/DELIVERED/READ/FAILED, respeitar; senão cai em SENT.
  if (
    normalized === "SENT" ||
    normalized === "DELIVERED" ||
    normalized === "READ" ||
    normalized === "FAILED"
  ) {
    return normalized;
  }
  return "SENT";
}

export async function persistInboundMessage(params: {
  instance: Instance;
  normalized: NormalizedMessage;
}): Promise<PersistInboundResult> {
  const { instance, normalized } = params;

  if (normalized.isGroup) {
    return { outcome: "ignored", reason: "grupo ignorado no MVP" };
  }
  if (!normalized.chatId) {
    return { outcome: "ignored", reason: "chatId ausente" };
  }

  const contact = await upsertContactFromInbound({
    workspaceId: instance.workspaceId,
    phone: normalized.chatId,
    fallbackName: normalized.senderName,
  });

  const conversation = await findOrCreateActiveConversation({
    workspaceId: instance.workspaceId,
    contactId: contact.id,
    instanceId: instance.id,
  });

  const direction = normalized.fromMe ? "OUTBOUND" : "INBOUND";
  const status = mapInboundDefaultStatus(normalized.fromMe, normalized.status);

  try {
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: conversation.id,
          direction,
          type: normalized.type,
          content: normalized.content,
          mediaUrl: normalized.mediaUrl,
          mediaMimeType: normalized.mediaMimeType,
          mediaFileName: normalized.mediaFileName,
          status,
          uazapiMessageId: normalized.externalId,
          uazapiTrackId: normalized.trackId,
          senderName: normalized.senderName,
          replyToId: normalized.replyToId,
          raw: normalized.raw as Prisma.InputJsonValue,
          createdAt: normalized.timestamp,
        },
      });
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: normalized.timestamp,
          ...(direction === "INBOUND" && {
            unreadCount: { increment: 1 },
          }),
        },
      });
      await appendEvent(tx, {
        conversationId: conversation.id,
        type: direction === "INBOUND" ? "MESSAGE_RECEIVED" : "MESSAGE_SENT",
        payload: { messageId: created.id, externalId: normalized.externalId },
      });
      return created;
    });
    return { outcome: "created", message };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const dup = await prisma.message.findUnique({
        where: { uazapiMessageId: normalized.externalId },
      });
      if (dup) return { outcome: "duplicate", message: dup };
    }
    throw error;
  }
}

// Atualiza status por messageId (preferido) ou trackId (fallback p/ webhooks
// que chegam antes do /send/* responder). Status é monotônico; FAILED é terminal.
export async function updateMessageStatusByReference(params: {
  externalId: string;
  trackId: string | null;
  newStatus: WhatsAppMessageStatus;
}): Promise<Message | null> {
  let existing = await prisma.message.findUnique({
    where: { uazapiMessageId: params.externalId },
  });

  if (!existing && params.trackId) {
    existing = await prisma.message.findFirst({
      where: { uazapiTrackId: params.trackId },
    });
    // Amarra uazapiMessageId agora (primeiro webhook que a gente recebeu).
    if (existing && !existing.uazapiMessageId) {
      existing = await prisma.message.update({
        where: { id: existing.id },
        data: { uazapiMessageId: params.externalId },
      });
    }
  }

  if (!existing) return null;

  const currentRank = STATUS_ORDER[existing.status];
  const nextRank = STATUS_ORDER[params.newStatus];
  if (params.newStatus !== "FAILED" && nextRank <= currentRank) {
    return existing;
  }

  return prisma.message.update({
    where: { id: existing.id },
    data: { status: params.newStatus },
  });
}

// Compat: antigo nome, usado no smoke/webhook. Chama a versão nova sem trackId.
export async function updateMessageStatusByExternalId(params: {
  externalId: string;
  newStatus: WhatsAppMessageStatus;
}): Promise<Message | null> {
  return updateMessageStatusByReference({
    externalId: params.externalId,
    trackId: null,
    newStatus: params.newStatus,
  });
}

export async function findMessageByExternalId(
  externalId: string,
): Promise<Message | null> {
  return prisma.message.findUnique({ where: { uazapiMessageId: externalId } });
}

// ============================================================================
// Outbound — passo 11.
// ============================================================================

export type SendMessageInput =
  | {
      type: "TEXT";
      content: string;
      replyToMessageId?: string;
    }
  | {
      type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
      mediaUrl: string;
      caption?: string;
      mediaFileName?: string;
      mediaMimeType?: string;
      replyToMessageId?: string;
    };

const MESSAGE_TYPE_TO_UAZAPI_MEDIA: Partial<
  Record<MessageType, UazApiMediaType>
> = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  DOCUMENT: "document",
};

async function resolveReplyId(
  replyToMessageId: string | undefined,
  conversationId: string,
): Promise<string | null> {
  if (!replyToMessageId) return null;
  const target = await prisma.message.findFirst({
    where: { id: replyToMessageId, conversationId },
    select: { uazapiMessageId: true },
  });
  return target?.uazapiMessageId ?? null;
}

export async function sendMessage(params: {
  workspaceId: string;
  userId: string;
  conversationId: string;
  input: SendMessageInput;
  // Injeção opcional — default usa factory. Testes passam fake aqui sem
  // depender de setUazApiClient (gotcha do tsx com path aliases).
  client?: UazApiClient;
}): Promise<Message> {
  const { conversation, contact, instance } = await getActiveConversationForOutbound({
    workspaceId: params.workspaceId,
    conversationId: params.conversationId,
  });

  // Cria Message SENDING primeiro; Message.id vira trackId.
  const draft = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUTBOUND",
      type: params.input.type,
      content:
        params.input.type === "TEXT"
          ? params.input.content
          : (params.input.caption ?? null),
      mediaUrl:
        params.input.type === "TEXT" ? null : params.input.mediaUrl,
      mediaMimeType:
        params.input.type === "TEXT"
          ? null
          : (params.input.mediaMimeType ?? null),
      mediaFileName:
        params.input.type === "TEXT"
          ? null
          : (params.input.mediaFileName ?? null),
      status: "SENDING",
      sentByUserId: params.userId,
      replyToId: params.input.replyToMessageId ?? null,
    },
  });

  const trackId = draft.id;
  const replyId = await resolveReplyId(
    params.input.replyToMessageId,
    conversation.id,
  );

  try {
    const client = params.client ?? getUazApiClient();
    let sendResult;

    if (params.input.type === "TEXT") {
      const body: SendTextParams = {
        to: contact.phone,
        text: params.input.content,
        trackId,
        async: true,
      };
      if (replyId) body.replyId = replyId;
      sendResult = await client.sendText(
        { subdomain: instance.uazapiSubdomain, token: instance.uazapiToken },
        body,
      );
    } else {
      const uazapiType = MESSAGE_TYPE_TO_UAZAPI_MEDIA[params.input.type];
      if (!uazapiType) {
        throw new ApiError(`Tipo ${params.input.type} não suportado`, 400);
      }
      const body: SendMediaParams = {
        to: contact.phone,
        type: uazapiType,
        file: params.input.mediaUrl,
        trackId,
        async: true,
      };
      if (params.input.caption) body.caption = params.input.caption;
      if (params.input.mediaFileName) body.fileName = params.input.mediaFileName;
      if (params.input.mediaMimeType) body.mimeType = params.input.mediaMimeType;
      if (replyId) body.replyId = replyId;
      sendResult = await client.sendMedia(
        { subdomain: instance.uazapiSubdomain, token: instance.uazapiToken },
        body,
      );
    }

    // UazApi enfileirou (async=true, queued=true) → deixa SENDING; webhook
    // messages_update vai promover. Se não enfileirou (sync), bumpa SENT.
    const finalStatus: MessageStatus = sendResult.queued ? "SENDING" : "SENT";

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.message.update({
        where: { id: draft.id },
        data: {
          uazapiMessageId: sendResult.messageId,
          uazapiTrackId: trackId,
          status: finalStatus,
        },
      });
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: row.createdAt },
      });
      await appendEvent(tx, {
        conversationId: conversation.id,
        type: "MESSAGE_SENT",
        actorId: params.userId,
        payload: {
          messageId: row.id,
          externalId: sendResult.messageId,
        },
      });
      return row;
    });

    return updated;
  } catch (error) {
    await prisma.message
      .update({ where: { id: draft.id }, data: { status: "FAILED" } })
      .catch(() => undefined);

    // Duck-type pra sobreviver ao instanceof cross-módulo (gotcha tsx/Jest).
    if (
      error instanceof UazApiError ||
      (typeof error === "object" &&
        error !== null &&
        (error as { name?: unknown }).name === "UazApiError")
    ) {
      const message =
        (error as { message?: string }).message ?? "Envio falhou";
      const body = (error as { body?: unknown }).body;
      throw new ApiError(`Envio falhou: ${message}`, 502, body);
    }
    throw error;
  }
}

export type ListMessagesInput = {
  workspaceId: string;
  conversationId: string;
  cursor?: string;
  limit?: number;
};

export type MessageListResult = {
  items: Message[];
  nextCursor: string | null;
};

export async function listMessages(
  input: ListMessagesInput,
): Promise<MessageListResult> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const conversation = await prisma.conversation.findFirst({
    where: { id: input.conversationId, workspaceId: input.workspaceId },
    select: { id: true },
  });
  if (!conversation) {
    throw new ApiError("Conversa não encontrada", 404);
  }

  const items = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(input.cursor && {
      cursor: { id: input.cursor },
      skip: 1,
    }),
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, limit) : items;
  return {
    items: trimmed,
    nextCursor: hasMore ? trimmed[trimmed.length - 1].id : null,
  };
}
