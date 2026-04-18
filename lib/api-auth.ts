import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { ApiError } from "./api-utils";

export type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: UserRole;
    workspaceId: string;
  };
};

export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("Não autenticado", 401);
  }
  return session as AuthenticatedSession;
}

export function requireRole(
  session: AuthenticatedSession,
  ...roles: UserRole[]
): void {
  if (!roles.includes(session.user.role)) {
    throw new ApiError("Acesso negado", 403);
  }
}
