export type UserRole = "ADMIN" | "SUPERVISOR" | "AGENT";

export type UserStatus = "ONLINE" | "OFFLINE" | "AWAY";

export interface User {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: string;
}
