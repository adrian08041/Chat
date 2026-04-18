import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./_layout";

export type PasswordResetEmailProps = {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function PasswordResetEmail({
  userName,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Redefinição de senha do Adrilo">
      <Text style={emailStyles.heading}>Redefinição de senha</Text>
      <Text style={emailStyles.paragraph}>Olá, {userName}.</Text>
      <Text style={emailStyles.paragraph}>
        Recebemos um pedido para redefinir a senha da sua conta no Adrilo.
        Clique no botão abaixo para escolher uma nova senha.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={resetUrl} style={emailStyles.button}>
          Redefinir senha
        </Button>
      </Section>
      <Text style={emailStyles.fallbackLabel}>
        Ou copie e cole o link no navegador:
      </Text>
      <Link href={resetUrl} style={emailStyles.fallbackLink}>
        {resetUrl}
      </Link>
      <Text style={emailStyles.muted}>
        Este link expira em {expiresInMinutes} minutos. Se você não pediu esta
        redefinição, ignore este email — sua senha continua a mesma.
      </Text>
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  userName: "Adrian",
  resetUrl: "http://localhost:3000/esqueci-senha/abc123token",
  expiresInMinutes: 30,
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
