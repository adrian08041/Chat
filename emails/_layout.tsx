import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={brandStyle}>Adrilo</Text>
          </Section>
          <Section style={cardStyle}>{children}</Section>
          <Hr style={hrStyle} />
          <Section>
            <Text style={footerStyle}>
              Enviado por Adrilo · Plataforma de atendimento WhatsApp
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#F5F5F4",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif",
  margin: 0,
  padding: "32px 0",
};

const containerStyle = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "0 16px",
};

const headerStyle = {
  paddingBottom: "8px",
};

const brandStyle = {
  color: "#075E54",
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: 0,
};

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "32px",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
};

const hrStyle = {
  borderColor: "#E7E5E4",
  margin: "24px 0 16px",
};

const footerStyle = {
  color: "#78716C",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
  textAlign: "center" as const,
};

export const emailStyles = {
  heading: {
    color: "#0C0A09",
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "30px",
    margin: "0 0 16px",
    letterSpacing: "-0.01em",
  },
  paragraph: {
    color: "#292524",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: "#075E54",
    borderRadius: "8px",
    color: "#FFFFFF",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
  },
  fallbackLabel: {
    color: "#78716C",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "24px 0 4px",
  },
  fallbackLink: {
    color: "#075E54",
    fontSize: "13px",
    lineHeight: "20px",
    wordBreak: "break-all" as const,
  },
  muted: {
    color: "#78716C",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "16px 0 0",
  },
};
