export type MessageDirection = "INBOUND" | "OUTBOUND";

export type MessageType = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";

export type MessageStatus =
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  type: MessageType;
  content: string | null;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  mediaFileName: string | null;
  status: MessageStatus;
  uazapiMessageId: string | null;
  uazapiTrackId: string | null;
  sentByUserId: string | null;
  createdAt: string;
}
