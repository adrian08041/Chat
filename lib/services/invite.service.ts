import { randomBytes } from "node:crypto";
import type { Invite, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { sendInviteEmail } from "@/lib/email";
import { hashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";

const INVITE_EXPIRATION_DAYS = 7;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function buildInviteUrl(token: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/convite/${token}`;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export type CreateInviteInput = {
  workspaceId: string;
  invitedById: string;
  email: string;
  role: UserRole;
};

export async function createInvite(input: CreateInviteInput): Promise<Invite> {
  const email = input.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  });
  if (existingUser && !existingUser.deletedAt) {
    throw new ApiError("Já existe um usuário com esse email", 409);
  }

  const existingPending = await prisma.invite.findFirst({
    where: {
      workspaceId: input.workspaceId,
      email,
      status: "PENDING",
    },
  });

  const token = generateToken();
  const expiresAt = daysFromNow(INVITE_EXPIRATION_DAYS);

  const invite = existingPending
    ? await prisma.invite.update({
        where: { id: existingPending.id },
        data: {
          token,
          expiresAt,
          role: input.role,
          invitedById: input.invitedById,
        },
      })
    : await prisma.invite.create({
        data: {
          workspaceId: input.workspaceId,
          invitedById: input.invitedById,
          email,
          role: input.role,
          token,
          expiresAt,
        },
      });

  const [inviter, workspace] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: input.invitedById },
      select: { name: true },
    }),
    prisma.workspace.findUniqueOrThrow({
      where: { id: input.workspaceId },
      select: { name: true },
    }),
  ]);

  const emailResult = await sendInviteEmail({
    to: email,
    inviterName: inviter.name,
    workspaceName: workspace.name,
    role: input.role,
    inviteUrl: buildInviteUrl(token),
    expiresInDays: INVITE_EXPIRATION_DAYS,
  });

  if (!emailResult.success) {
    console.error(
      `[invite] email falhou para ${email} (invite ${invite.id}): ${emailResult.error}`,
    );
  }

  return invite;
}

export type InviteMetadata = {
  email: string;
  role: UserRole;
  inviterName: string;
  workspaceName: string;
  expiresAt: Date;
};

export async function getInviteByToken(token: string): Promise<InviteMetadata> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      invitedBy: { select: { name: true } },
      workspace: { select: { name: true } },
    },
  });

  if (!invite) {
    throw new ApiError("Convite não encontrado", 404);
  }
  if (invite.status === "ACCEPTED" || invite.acceptedAt) {
    throw new ApiError("Este convite já foi aceito", 410);
  }
  if (invite.status === "REVOKED" || invite.revokedAt) {
    throw new ApiError("Este convite foi revogado", 410);
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    if (invite.status !== "EXPIRED") {
      await prisma.invite
        .update({ where: { id: invite.id }, data: { status: "EXPIRED" } })
        .catch(() => {});
    }
    throw new ApiError("Este convite expirou", 410);
  }

  return {
    email: invite.email,
    role: invite.role,
    inviterName: invite.invitedBy.name,
    workspaceName: invite.workspace.name,
    expiresAt: invite.expiresAt,
  };
}

export type AcceptInviteInput = {
  token: string;
  name: string;
  password: string;
};

export type AcceptInviteResult = {
  email: string;
  userId: string;
};

export async function acceptInvite(
  input: AcceptInviteInput,
): Promise<AcceptInviteResult> {
  const invite = await prisma.invite.findUnique({
    where: { token: input.token },
  });

  if (!invite) {
    throw new ApiError("Convite não encontrado", 404);
  }
  if (invite.status === "ACCEPTED" || invite.acceptedAt) {
    throw new ApiError("Este convite já foi aceito", 410);
  }
  if (invite.status === "REVOKED" || invite.revokedAt) {
    throw new ApiError("Este convite foi revogado", 410);
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw new ApiError("Este convite expirou", 410);
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          workspaceId: invite.workspaceId,
          email: invite.email,
          name: input.name.trim(),
          passwordHash,
          role: invite.role,
        },
        select: { id: true, email: true },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      return created;
    });
    return { email: user.email, userId: user.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("Já existe um usuário com esse email", 409);
    }
    throw error;
  }
}
