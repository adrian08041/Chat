import type { Contact } from "./contact";
import type { WhatsAppInstance } from "./instance";
import type { User } from "./user";
import type { Tag } from "./tag";

export type ConversationStatus =
  | "UNASSIGNED"
  | "OPEN"
  | "WAITING_CUSTOMER"
  | "RESOLVED"
  | "REOPENED";

export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  instanceId: string;
  assignedUserId: string | null;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  createdAt: string;
  resolvedAt: string | null;
  contact?: Contact;
  instance?: WhatsAppInstance;
  assignedUser?: User;
  tags?: Tag[];
}
