import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { ApiError } from "./api-utils";
import { prisma } from "./prisma";

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

  // JWT tem 30d — um usuário soft-deleted continuaria autenticado até expirar.
  // Lookup rápido (PK-indexed) invalida a sessão imediatamente. Custo: 1 query/request.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletedAt: true },
  });
  if (!user || user.deletedAt) {
    throw new ApiError("Sessão inválida", 401);
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
