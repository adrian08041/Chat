import type { Tag } from "./tag";

export interface Contact {
  id: string;
  workspaceId: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  source: string | null;
  notes: string | null;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactAssignedUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ContactListItem {
  id: string;
  workspaceId: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  source: string | null;
  notes: string | null;
  assignedUserId: string | null;
  assignedUser: ContactAssignedUser | null;
  tags: Pick<Tag, "id" | "name" | "color">[];
  conversasCount: number;
  ultimoContato: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsPage {
  items: ContactListItem[];
  nextCursor: string | null;
}

export interface ContactConversationItem {
  id: string;
  instanceId: string;
  instanceName: string;
  instanceColor: string;
  assignedUserName: string | null;
  status: "UNASSIGNED" | "OPEN" | "WAITING_CUSTOMER" | "RESOLVED" | "REOPENED";
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessage: {
    content: string | null;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string;
  } | null;
  messagesCount: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ContactNoteItem {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ContactProfile {
  contact: ContactListItem;
  conversations: ContactConversationItem[];
  notes: ContactNoteItem[];
}
