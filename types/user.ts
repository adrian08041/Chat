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

export type TeamMemberStatus = "ACTIVE" | "PENDING" | "INACTIVE";

export interface TeamMember {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  memberStatus: TeamMemberStatus;
  avatarUrl: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
}
