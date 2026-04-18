// Normalização defensiva de payload UazApi → NormalizedEvent.
// Absorve variações documentadas em Backend Plan §10.2:
// - timestamp em ms vs s
// - texto em 3+ locais (text, message.conversation, message.extendedTextMessage.text)
// - mediaUrl em até 5 locais (mediaUrl, url, image.url, video.url, document.url)
// Sempre preserva `raw` para Message.raw (Json) — retrocompatibilidade.

import type {
  NormalizedConnectionUpdate,
  NormalizedEvent,
  NormalizedMessage,
  NormalizedMessageStatusUpdate,
  NormalizedPresenceUpdate,
  WhatsAppConnectionStatus,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  WhatsAppPresence,
} from "./types";

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(source: unknown, ...keys: string[]): string | null {
  if (!isObject(source)) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function pickBoolean(source: unknown, ...keys: string[]): boolean | null {
  if (!isObject(source)) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

function path(source: unknown, ...keys: string[]): unknown {
  let current: unknown = source;
  for (const key of keys) {
    if (!isObject(current)) return undefined;
    current = current[key];
  }
  return current;
}

// Timestamp pode vir em segundos (WhatsApp) ou milissegundos (alguns wrappers).
// Heurística: valor < 1e12 é segundos.
function parseTimestamp(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value < 1e12 ? value * 1000 : value);
  }
  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber > 0) {
      return new Date(asNumber < 1e12 ? asNumber * 1000 : asNumber);
    }
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return new Date();
}

function extractText(message: unknown): string | null {
  return (
    pickString(message, "text", "body", "caption", "content") ??
    pickString(path(message, "message"), "conversation", "text") ??
    pickString(
      path(message, "message", "extendedTextMessage"),
      "text",
      "conversation",
    ) ??
    pickString(path(message, "message", "imageMessage"), "caption") ??
    pickString(path(message, "message", "videoMessage"), "caption") ??
    pickString(path(message, "message", "documentMessage"), "caption") ??
    null
  );
}

function extractMediaUrl(message: unknown): string | null {
  return (
    pickString(message, "mediaUrl", "fileUrl", "url") ??
    pickString(path(message, "message", "imageMessage"), "url", "directPath") ??
    pickString(path(message, "message", "videoMessage"), "url", "directPath") ??
    pickString(path(message, "message", "audioMessage"), "url", "directPath") ??
    pickString(
      path(message, "message", "documentMessage"),
      "url",
      "directPath",
    ) ??
    pickString(
      path(message, "message", "stickerMessage"),
      "url",
      "directPath",
    ) ??
    null
  );
}

function extractMediaMimeType(message: unknown): string | null {
  return (
    pickString(message, "mimetype", "mimeType") ??
    pickString(path(message, "message", "imageMessage"), "mimetype") ??
    pickString(path(message, "message", "videoMessage"), "mimetype") ??
    pickString(path(message, "message", "audioMessage"), "mimetype") ??
    pickString(path(message, "message", "documentMessage"), "mimetype") ??
    null
  );
}

function extractMediaFileName(message: unknown): string | null {
  return (
    pickString(message, "fileName", "filename") ??
    pickString(path(message, "message", "documentMessage"), "fileName") ??
    null
  );
}

function extractMessageType(message: unknown): WhatsAppMessageType {
  const explicit = pickString(message, "messageType", "type");
  if (explicit) {
    const normalized = explicit.toLowerCase();
    if (normalized.includes("text") || normalized === "conversation") return "TEXT";
    if (normalized.includes("image")) return "IMAGE";
    if (normalized.includes("video")) return "VIDEO";
    if (
      normalized.includes("audio") ||
      normalized === "ptt" ||
      normalized === "myaudio"
    )
      return "AUDIO";
    if (normalized.includes("document")) return "DOCUMENT";
    if (normalized.includes("sticker")) return "STICKER";
    if (normalized.includes("location")) return "LOCATION";
    if (normalized.includes("contact") || normalized.includes("vcard"))
      return "CONTACT";
  }

  // Fallback por presença de sub-objeto em `message.*`.
  const inner = path(message, "message");
  if (isObject(inner)) {
    if ("imageMessage" in inner) return "IMAGE";
    if ("videoMessage" in inner) return "VIDEO";
    if ("audioMessage" in inner) return "AUDIO";
    if ("documentMessage" in inner) return "DOCUMENT";
    if ("stickerMessage" in inner) return "STICKER";
    if ("locationMessage" in inner) return "LOCATION";
    if ("contactMessage" in inner || "contactsArrayMessage" in inner)
      return "CONTACT";
    if ("conversation" in inner || "extendedTextMessage" in inner) return "TEXT";
  }

  if (extractText(message)) return "TEXT";
  return "UNKNOWN";
}

function normalizeMessageStatus(value: unknown): WhatsAppMessageStatus {
  if (typeof value !== "string") return "SENT";
  const normalized = value.toLowerCase();
  if (normalized.includes("read") || normalized === "played") return "READ";
  if (normalized.includes("deliver")) return "DELIVERED";
  if (normalized.includes("fail") || normalized === "error") return "FAILED";
  if (normalized.includes("pending") || normalized === "sending")
    return "SENDING";
  return "SENT";
}

function normalizeConnectionStatus(value: unknown): WhatsAppConnectionStatus {
  if (typeof value !== "string") return "disconnected";
  const normalized = value.toLowerCase();
  // Ordem importa: "disconnected".includes("connected") === true. Checar desconectado primeiro.
  if (normalized.startsWith("disconnect") || normalized === "close")
    return "disconnected";
  if (normalized === "connecting" || normalized === "qr") return "connecting";
  if (normalized === "connected" || normalized === "open") return "connected";
  return "disconnected";
}

function normalizePresence(value: unknown): WhatsAppPresence {
  if (typeof value !== "string") return "available";
  const normalized = value.toLowerCase();
  if (normalized.includes("composing") || normalized === "typing")
    return "composing";
  if (normalized.includes("recording")) return "recording";
  if (normalized.includes("paused")) return "paused";
  if (normalized.includes("unavailable") || normalized === "offline")
    return "unavailable";
  return "available";
}

// Normaliza JID/phone: "5511999999999@s.whatsapp.net" → "5511999999999".
function stripJidSuffix(value: string | null): string | null {
  if (!value) return null;
  const at = value.indexOf("@");
  return at >= 0 ? value.slice(0, at) : value;
}

function isGroupChat(chatId: string | null): boolean {
  return chatId?.includes("@g.us") ?? false;
}

function hasMessageId(candidate: unknown): boolean {
  if (!isObject(candidate)) return false;
  if (
    pickString(candidate, "id", "messageId", "uazapiMessageId") ??
    pickString(path(candidate, "key"), "id")
  ) {
    return true;
  }
  return false;
}

function extractMessage(raw: unknown): unknown {
  // Primeiro envelope com `id` vence: UazApi pode aninhar em `data`, em
  // `data.message`, em `message`, ou na raiz. `data.message` no estilo
  // Baileys é o conteúdo (conversation/imageMessage), sem id — skip.
  const candidates = [
    path(raw, "data"),
    path(raw, "data", "message"),
    path(raw, "message"),
    raw,
  ];
  for (const candidate of candidates) {
    if (hasMessageId(candidate)) return candidate;
  }
  return path(raw, "data") ?? raw;
}

export function normalizeMessage(raw: unknown): NormalizedMessage | null {
  const message = extractMessage(raw);
  if (!isObject(message)) return null;

  const externalId =
    pickString(message, "id", "messageId", "uazapiMessageId") ??
    pickString(path(message, "key"), "id");
  if (!externalId) return null;

  const fromMe = pickBoolean(message, "fromMe") ?? false;
  const chatRaw =
    pickString(message, "chatId", "chatid", "chat", "remoteJid", "to") ??
    pickString(path(message, "key"), "remoteJid");
  const fromRaw = pickString(message, "from", "sender") ?? chatRaw;
  const toRaw = pickString(message, "to", "recipient") ?? chatRaw;

  const chatId = stripJidSuffix(chatRaw) ?? "";
  const fromPhone = stripJidSuffix(fromRaw) ?? chatId;
  const toPhone = stripJidSuffix(toRaw);

  const trackId = pickString(message, "trackId", "track_id", "uazapiTrackId");

  return {
    externalId,
    trackId,
    chatId,
    fromPhone,
    toPhone,
    fromMe,
    direction: fromMe ? "OUTBOUND" : "INBOUND",
    type: extractMessageType(message),
    content: extractText(message),
    mediaUrl: extractMediaUrl(message),
    mediaMimeType: extractMediaMimeType(message),
    mediaFileName: extractMediaFileName(message),
    status: normalizeMessageStatus(pickString(message, "status", "ack")),
    timestamp: parseTimestamp(
      (message as Json).timestamp ??
        (message as Json).messageTimestamp ??
        (message as Json).t,
    ),
    senderName: pickString(message, "senderName", "pushName", "notifyName"),
    isGroup: isGroupChat(chatRaw),
    replyToId:
      pickString(message, "replyId", "quotedMessageId", "stanzaId") ??
      pickString(path(message, "contextInfo"), "stanzaId"),
    raw,
  };
}

export function normalizeStatusUpdate(
  raw: unknown,
): NormalizedMessageStatusUpdate | null {
  const body = path(raw, "data") ?? raw;
  if (!isObject(body)) return null;

  const externalId =
    pickString(body, "id", "messageId", "uazapiMessageId") ??
    pickString(path(body, "key"), "id");
  if (!externalId) return null;

  return {
    externalId,
    trackId: pickString(body, "track_id", "trackId", "uazapiTrackId"),
    status: normalizeMessageStatus(pickString(body, "status", "ack")),
    timestamp: parseTimestamp(
      (body as Json).timestamp ?? (body as Json).t,
    ),
    raw,
  };
}

export function normalizeConnectionUpdate(
  raw: unknown,
): NormalizedConnectionUpdate | null {
  const body = path(raw, "data") ?? raw;
  if (!isObject(body)) return null;

  const instanceExternalId =
    pickString(body, "instanceId", "id") ??
    pickString(path(raw, "instance"), "id", "instanceId");
  if (!instanceExternalId) return null;

  return {
    instanceExternalId,
    status: normalizeConnectionStatus(
      pickString(body, "status", "state", "connection"),
    ),
    phone:
      stripJidSuffix(pickString(body, "phone", "wid", "owner")) ??
      stripJidSuffix(pickString(path(raw, "instance"), "phone", "wid")),
    timestamp: parseTimestamp((body as Json).timestamp ?? (body as Json).t),
    raw,
  };
}

export function normalizePresenceUpdate(
  raw: unknown,
): NormalizedPresenceUpdate | null {
  const body = path(raw, "data") ?? raw;
  if (!isObject(body)) return null;

  const chatRaw = pickString(body, "chatId", "chat", "remoteJid", "from");
  const chatId = stripJidSuffix(chatRaw);
  if (!chatId) return null;

  return {
    chatId,
    presence: normalizePresence(
      pickString(body, "presence", "status", "state"),
    ),
    timestamp: parseTimestamp((body as Json).timestamp ?? (body as Json).t),
    raw,
  };
}

export function normalizeEvent(raw: unknown): NormalizedEvent {
  // UazApi usa `EventType` (PascalCase). Mantemos `event`/`type` pra compat
  // com wrappers alternativos e com o shape que usávamos nos testes.
  const kind = pickString(raw, "EventType", "event", "type")?.toLowerCase();

  if (kind === "messages" || kind === "message") {
    const message = normalizeMessage(raw);
    if (message) return { kind: "messages", message };
  }

  if (kind === "messages_update" || kind === "message_update") {
    const update = normalizeStatusUpdate(raw);
    if (update) return { kind: "messages_update", update };
  }

  if (kind === "connection") {
    const update = normalizeConnectionUpdate(raw);
    if (update) return { kind: "connection", update };
  }

  if (kind === "presence") {
    const update = normalizePresenceUpdate(raw);
    if (update) return { kind: "presence", update };
  }

  return { kind: "unknown", raw };
}
