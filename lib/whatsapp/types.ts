// Contrato provider-agnostic do WhatsApp. Stub e UazApi (futuros clients)
// implementam o mesmo formato; callers consomem só isto.
// Ver Backend Plan §10.2 — normalização defensiva.

export type WhatsAppEventKind =
  | "messages"
  | "messages_update"
  | "connection"
  | "presence"
  | "chats";

export type WhatsAppMessageType =
  | "TEXT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "DOCUMENT"
  | "STICKER"
  | "LOCATION"
  | "CONTACT"
  | "UNKNOWN";

export type WhatsAppMessageDirection = "INBOUND" | "OUTBOUND";

export type WhatsAppMessageStatus =
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

// Estados da conexão da instância (lowercase casa com UazApi).
// Mapeamento pro enum Prisma InstanceStatus fica no service.
export type WhatsAppConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected";

export type WhatsAppPresence =
  | "available"
  | "unavailable"
  | "composing"
  | "recording"
  | "paused";

export interface NormalizedMessage {
  externalId: string;
  trackId: string | null;
  chatId: string;
  fromPhone: string;
  toPhone: string | null;
  fromMe: boolean;
  direction: WhatsAppMessageDirection;
  type: WhatsAppMessageType;
  content: string | null;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  mediaFileName: string | null;
  status: WhatsAppMessageStatus;
  timestamp: Date;
  senderName: string | null;
  isGroup: boolean;
  replyToId: string | null;
  raw: unknown;
}

export interface NormalizedMessageStatusUpdate {
  externalId: string;
  // UazApi ecoa `track_id` do /send/* em webhooks — fallback quando o envio
  // ainda não conseguiu persistir o externalId no nosso banco.
  trackId: string | null;
  status: WhatsAppMessageStatus;
  timestamp: Date;
  raw: unknown;
}

export interface NormalizedConnectionUpdate {
  instanceExternalId: string;
  status: WhatsAppConnectionStatus;
  phone: string | null;
  timestamp: Date;
  raw: unknown;
}

export interface NormalizedPresenceUpdate {
  chatId: string;
  presence: WhatsAppPresence;
  timestamp: Date;
  raw: unknown;
}

// Discriminated union: webhook.service.ts faz switch no `kind`.
// `unknown` preserva payloads não suportados sem dropar raw.
export type NormalizedEvent =
  | { kind: "messages"; message: NormalizedMessage }
  | { kind: "messages_update"; update: NormalizedMessageStatusUpdate }
  | { kind: "connection"; update: NormalizedConnectionUpdate }
  | { kind: "presence"; update: NormalizedPresenceUpdate }
  | { kind: "unknown"; raw: unknown };
