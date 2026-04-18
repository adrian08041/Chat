import type { Contact } from "./contact";
import type { WhatsAppInstance } from "./instance";
import type { MessageDirection } from "./message";

export type ConversationStatus =
  | "UNASSIGNED"
  | "OPEN"
  | "WAITING_CUSTOMER"
  | "RESOLVED"
  | "REOPENED";

// Preview da última mensagem — gerado no backend via include + take: 1.
export interface ConversationLastMessage {
  content: string | null;
  direction: MessageDirection;
  createdAt: string;
}

// Contact reduzido que vem junto da listagem (campos usados na UI da lista).
export interface ConversationContactPreview {
  id: string;
  name: string | null;
  phone: string;
  avatarUrl: string | null;
}

// Instance reduzida (badge colorido + nome do número).
export interface ConversationInstancePreview {
  id: string;
  name: string;
  color: string;
}

// Shape retornado por GET /api/conversations.
export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  instanceId: string;
  assignedUserId: string | null;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  contact: ConversationContactPreview;
  instance: ConversationInstancePreview;
  lastMessage: ConversationLastMessage | null;
}

// Shape retornado por GET /api/conversations/[id] — inclui contact/instance completos.
export interface ConversationDetail extends Conversation {
  contactFull: Contact;
  instanceFull: WhatsAppInstance;
}
