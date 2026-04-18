// Webhook service — passos 9 + 10.
// Entry: handleWebhookEvent(secret, rawBody). Lookup Instance, normaliza,
// dispatcha. messages/messages_update agora persistem via message.service.
// presence segue ephemeral (real-time é passo 12).

import type { Instance, InstanceStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { findInstanceByWebhookSecret } from "@/lib/services/instance.service";
import {
  persistInboundMessage,
  updateMessageStatusByReference,
} from "@/lib/services/message.service";
import { normalizeEvent } from "@/lib/whatsapp/normalize";
import type {
  NormalizedConnectionUpdate,
  NormalizedEvent,
  NormalizedMessage,
  NormalizedMessageStatusUpdate,
  NormalizedPresenceUpdate,
  WhatsAppConnectionStatus,
} from "@/lib/whatsapp/types";

export type WebhookResult = {
  accepted: boolean;
  kind: NormalizedEvent["kind"];
  note?: string;
};

function mapConnectionStatus(status: WhatsAppConnectionStatus): InstanceStatus {
  switch (status) {
    case "connected":
      return "CONNECTED";
    case "connecting":
      return "CONNECTING";
    case "disconnected":
      return "DISCONNECTED";
  }
}

async function handleConnection(
  instance: Instance,
  update: NormalizedConnectionUpdate,
): Promise<string | undefined> {
  // Defesa: se o webhook declarou um `instanceId` e não bate com o que temos
  // pra este secret, algo está mal-configurado no painel UazApi. Não atualiza.
  if (
    update.instanceExternalId &&
    update.instanceExternalId !== instance.uazapiInstanceId
  ) {
    console.warn(
      `[webhook] connection rejeitada — instanceExternalId=${update.instanceExternalId} ` +
        `não bate com Instance.uazapiInstanceId=${instance.uazapiInstanceId} ` +
        `(secret=${instance.id})`,
    );
    return "instanceExternalId divergente";
  }

  const status = mapConnectionStatus(update.status);
  await prisma.instance.update({
    where: { id: instance.id },
    data: {
      status,
      phone: update.phone ?? instance.phone,
      lastHealthCheckAt: new Date(),
      ...(status === "CONNECTED" &&
        !instance.lastConnectedAt && { lastConnectedAt: new Date() }),
    },
  });
  return undefined;
}

async function handleMessage(
  instance: Instance,
  message: NormalizedMessage,
): Promise<string> {
  const result = await persistInboundMessage({ instance, normalized: message });
  switch (result.outcome) {
    case "created":
      return `message ${result.message.id} (${message.type})`;
    case "duplicate":
      return `duplicate — ${result.message.id}`;
    case "ignored":
      return `ignorado: ${result.reason}`;
  }
}

async function handleStatusUpdate(
  update: NormalizedMessageStatusUpdate,
): Promise<string> {
  const message = await updateMessageStatusByReference({
    externalId: update.externalId,
    trackId: update.trackId,
    newStatus: update.status,
  });
  if (!message) return `externalId ${update.externalId} não encontrado`;
  return `${message.id} → ${message.status}`;
}

function handlePresence(
  instance: Instance,
  update: NormalizedPresenceUpdate,
): void {
  // Presence é ephemeral — não persiste; real-time é passo 12.
  console.info(
    `[webhook] presence instance=${instance.id} chat=${update.chatId} ` +
      `presence=${update.presence}`,
  );
}

export async function handleWebhookEvent(
  secret: string,
  rawBody: unknown,
): Promise<WebhookResult> {
  const instance = await findInstanceByWebhookSecret(secret);
  if (!instance || instance.deletedAt) {
    throw new ApiError("Webhook secret desconhecido", 404);
  }

  const event = normalizeEvent(rawBody);

  switch (event.kind) {
    case "connection": {
      const note = await handleConnection(instance, event.update);
      return { accepted: true, kind: event.kind, note };
    }
    case "messages": {
      const note = await handleMessage(instance, event.message);
      return { accepted: true, kind: event.kind, note };
    }
    case "messages_update": {
      const note = await handleStatusUpdate(event.update);
      return { accepted: true, kind: event.kind, note };
    }
    case "presence":
      handlePresence(instance, event.update);
      return { accepted: true, kind: event.kind };
    case "unknown":
      console.warn(
        `[webhook] evento desconhecido instance=${instance.id}:`,
        typeof rawBody === "object" && rawBody !== null
          ? "event" in rawBody
            ? (rawBody as { event: unknown }).event
            : "(sem campo event)"
          : typeof rawBody,
      );
      return { accepted: true, kind: event.kind, note: "evento ignorado" };
  }
}
