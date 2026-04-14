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
  contactId: string;
  direction: MessageDirection;
  type: MessageType;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  status: MessageStatus;
  whatsappMessageId: string | null;
  sentByUserId: string | null;
  createdAt: string;
}
