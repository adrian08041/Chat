import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./_layout";

export type InviteEmailProps = {
  inviterName: string;
  workspaceName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresInDays: number;
};

export function InviteEmail({
  inviterName,
  workspaceName,
  roleLabel,
  inviteUrl,
  expiresInDays,
}: InviteEmailProps) {
  return (
    <EmailLayout
      preview={`${inviterName} te convidou para ${workspaceName} no Adrilo`}
    >
      <Text style={emailStyles.heading}>Você foi convidado para o Adrilo</Text>
      <Text style={emailStyles.paragraph}>
        <strong>{inviterName}</strong> te convidou para participar de{" "}
        <strong>{workspaceName}</strong> como <strong>{roleLabel}</strong>.
      </Text>
      <Text style={emailStyles.paragraph}>
        Clique no botão abaixo para aceitar o convite e criar sua conta.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={inviteUrl} style={emailStyles.button}>
          Aceitar convite
        </Button>
      </Section>
      <Text style={emailStyles.fallbackLabel}>
        Ou copie e cole o link no navegador:
      </Text>
      <Link href={inviteUrl} style={emailStyles.fallbackLink}>
        {inviteUrl}
      </Link>
      <Text style={emailStyles.muted}>
        Este convite expira em {expiresInDays}{" "}
        {expiresInDays === 1 ? "dia" : "dias"}. Se você não esperava receber
        este email, pode ignorá-lo.
      </Text>
    </EmailLayout>
  );
}

InviteEmail.PreviewProps = {
  inviterName: "Adrian",
  workspaceName: "Adrilo Demo",
  roleLabel: "Atendente",
  inviteUrl: "http://localhost:3000/convite/abc123token",
  expiresInDays: 7,
} satisfies InviteEmailProps;

export default InviteEmail;
