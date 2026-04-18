// Team service — passo 13 do Backend Plan (substituir mocks).
// Lista unificada User-ativo + Invite-PENDING no shape TeamMember (usado pela UI).
// Guards: não remova self, não deixe o workspace sem admin (transação
// re-checa pós-mutação pra fechar corrida contra updates concorrentes).

import type { Invite, User, UserRole } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// Espelha types/user.ts do frontend pra evitar mapeamento duplo na rota.
export type TeamMemberStatus = "ACTIVE" | "PENDING" | "INACTIVE";

export type TeamMemberDTO = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  memberStatus: TeamMemberStatus;
  avatarUrl: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
};

function toTeamMemberDTO(user: User): TeamMemberDTO {
  return {
    id: user.id,
    workspaceId: user.workspaceId,
    name: user.name,
    email: user.email,
    role: user.role,
    memberStatus: "ACTIVE",
    avatarUrl: user.avatarUrl,
    joinedAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

function toInviteMemberDTO(invite: Invite): TeamMemberDTO {
  return {
    // Prefixa pra não colidir com User.id no frontend.
    id: `invite:${invite.id}`,
    workspaceId: invite.workspaceId,
    name: "Convite pendente",
    email: invite.email,
    role: invite.role,
    memberStatus: "PENDING",
    avatarUrl: null,
    joinedAt: invite.createdAt.toISOString(),
    lastActiveAt: null,
  };
}

export async function listTeamMembers(
  workspaceId: string,
): Promise<TeamMemberDTO[]> {
  const [users, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where: {
        workspaceId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return [...users.map(toTeamMemberDTO), ...pendingInvites.map(toInviteMemberDTO)];
}

export type UpdateTeamMemberInput = {
  name?: string;
  role?: UserRole;
};

export async function updateTeamMember(params: {
  workspaceId: string;
  userId: string;
  requesterId: string;
  patch: UpdateTeamMemberInput;
}): Promise<TeamMemberDTO> {
  // Tudo na mesma transação: lookup → update → re-check invariant (admin ≥ 1).
  // O re-check pós-update fecha a corrida contra demotions concorrentes —
  // count+update separados poderiam deixar o workspace sem admin.
  return prisma.$transaction(async (tx) => {
    const target = await tx.user.findFirst({
      where: {
        id: params.userId,
        workspaceId: params.workspaceId,
        deletedAt: null,
      },
    });
    if (!target) {
      throw new ApiError("Membro não encontrado", 404);
    }

    const updated = await tx.user.update({
      where: { id: target.id },
      data: {
        ...(params.patch.name !== undefined && { name: params.patch.name }),
        ...(params.patch.role !== undefined && { role: params.patch.role }),
      },
    });

    // Invariant: após qualquer update que possa remover admin, precisa sobrar ≥ 1.
    const demotedAdmin = target.role === "ADMIN" && updated.role !== "ADMIN";
    if (demotedAdmin) {
      const remainingAdmins = await tx.user.count({
        where: {
          workspaceId: params.workspaceId,
          role: "ADMIN",
          deletedAt: null,
        },
      });
      if (remainingAdmins < 1) {
        throw new ApiError(
          "Não é possível rebaixar o último administrador ativo",
          409,
        );
      }
    }

    return toTeamMemberDTO(updated);
  });
}

export async function removeTeamMember(params: {
  workspaceId: string;
  userId: string;
  requesterId: string;
}): Promise<void> {
  // Self-check fora da tx — fail-fast, evita DB round-trip.
  if (params.userId === params.requesterId) {
    throw new ApiError("Você não pode remover a si mesmo", 409);
  }

  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findFirst({
      where: {
        id: params.userId,
        workspaceId: params.workspaceId,
        deletedAt: null,
      },
    });
    if (!target) {
      throw new ApiError("Membro não encontrado", 404);
    }

    await tx.user.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
    });

    if (target.role === "ADMIN") {
      const remainingAdmins = await tx.user.count({
        where: {
          workspaceId: params.workspaceId,
          role: "ADMIN",
          deletedAt: null,
        },
      });
      if (remainingAdmins < 1) {
        throw new ApiError(
          "Não é possível remover o último administrador ativo",
          409,
        );
      }
    }
  });
}
