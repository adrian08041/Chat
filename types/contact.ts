import type { Tag } from "./tag";

export interface Contact {
  id: string;
  workspaceId: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  source: string | null;
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

export interface NotaInterna {
  id: string;
  autor: string;
  data: string;
  conteudo: string;
}
