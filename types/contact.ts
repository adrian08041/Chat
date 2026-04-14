import type { Tag } from "./tag";

export interface Contact {
  id: string;
  workspaceId: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  notes: string | null;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}
