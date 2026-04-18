import { render } from "@react-email/render";
import type { UserRole } from "@prisma/client";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { InviteEmail } from "@/emails/invite";
import { PasswordResetEmail } from "@/emails/password-reset";
import { USER_ROLE_LABELS } from "./constants";

const DEFAULT_FROM = "Adrilo <onboarding@resend.dev>";

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
};

type SendEmailResult =
  | { success: true; id: string | null }
  | { success: false; error: string };

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

function getFrom(): string {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM;
}

async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getClient();

  if (!client) {
    const text = await render(input.react, { plainText: true });
    console.warn(
      `[email] RESEND_API_KEY ausente — email não enviado.\n` +
        `  to:      ${input.to}\n` +
        `  subject: ${input.subject}\n` +
        `  ---\n${text}\n  ---`,
    );
    return { success: true, id: null };
  }

  const { data, error } = await client.emails.send({
    from: getFrom(),
    to: input.to,
    subject: input.subject,
    react: input.react,
  });

  if (error) {
    console.error("[email] falha ao enviar:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id ?? null };
}

export type SendInviteEmailInput = {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: UserRole;
  inviteUrl: string;
  expiresInDays: number;
};

export function sendInviteEmail(
  input: SendInviteEmailInput,
): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: `${input.inviterName} te convidou para ${input.workspaceName}`,
    react: (
      <InviteEmail
        inviterName={input.inviterName}
        workspaceName={input.workspaceName}
        roleLabel={USER_ROLE_LABELS[input.role]}
        inviteUrl={input.inviteUrl}
        expiresInDays={input.expiresInDays}
      />
    ),
  });
}

export type SendPasswordResetEmailInput = {
  to: string;
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: "Redefinição de senha — Adrilo",
    react: (
      <PasswordResetEmail
        userName={input.userName}
        resetUrl={input.resetUrl}
        expiresInMinutes={input.expiresInMinutes}
      />
    ),
  });
}
