import { randomBytes } from "node:crypto";
import { ApiError } from "@/lib/api-utils";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";

const RESET_EXPIRATION_MINUTES = 30;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function buildResetUrl(token: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/esqueci-senha/${token}`;
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Solicita reset de senha. Enumeration-safe: nunca revela se o email existe.
 * Se o usuário existir, invalida tokens pendentes anteriores e gera um novo.
 */
export async function requestPasswordReset(emailInput: string): Promise<void> {
  const email = emailInput.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, deletedAt: true },
  });

  if (!user || user.deletedAt) return;

  const token = generateToken();
  const expiresAt = minutesFromNow(RESET_EXPIRATION_MINUTES);

  await prisma.$transaction([
    prisma.passwordReset.deleteMany({
      where: { userId: user.id, usedAt: null },
    }),
    prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    }),
  ]);

  const result = await sendPasswordResetEmail({
    to: user.email,
    userName: user.name,
    resetUrl: buildResetUrl(token),
    expiresInMinutes: RESET_EXPIRATION_MINUTES,
  });

  if (!result.success) {
    console.error(
      `[password-reset] email falhou para ${user.email}: ${result.error}`,
    );
  }
}

export type ResetTokenMetadata = {
  email: string;
  userName: string;
  expiresAt: Date;
};

export async function verifyResetToken(
  token: string,
): Promise<ResetTokenMetadata> {
  const record = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: { select: { email: true, name: true, deletedAt: true } } },
  });

  if (!record) {
    throw new ApiError("Link de redefinição inválido", 404);
  }
  if (record.usedAt) {
    throw new ApiError("Este link já foi usado", 410);
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new ApiError("Este link expirou", 410);
  }
  if (record.user.deletedAt) {
    throw new ApiError("Conta indisponível", 410);
  }

  return {
    email: record.user.email,
    userName: record.user.name,
    expiresAt: record.expiresAt,
  };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const record = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: { select: { id: true, deletedAt: true } } },
  });

  if (!record) {
    throw new ApiError("Link de redefinição inválido", 404);
  }
  if (record.usedAt) {
    throw new ApiError("Este link já foi usado", 410);
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new ApiError("Este link expirou", 410);
  }
  if (record.user.deletedAt) {
    throw new ApiError("Conta indisponível", 410);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.user.id },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordReset.deleteMany({
      where: { userId: record.user.id, id: { not: record.id }, usedAt: null },
    }),
  ]);
}
