import type { UserRole } from "@prisma/client";

export const INSTANCE_COLORS = [
  { name: "Esmeralda", value: "#075E54" },
  { name: "Teal", value: "#128C7E" },
  { name: "Sage", value: "#607E6B" },
  { name: "Azul", value: "#2563EB" },
  { name: "Roxo", value: "#7C3AED" },
  { name: "Âmbar", value: "#D97706" },
  { name: "Rosa", value: "#DB2777" },
  { name: "Vermelho", value: "#DC2626" },
] as const;

export const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  UNASSIGNED: "Não atribuída",
  OPEN: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  RESOLVED: "Resolvida",
  REOPENED: "Reaberta",
};

export const CONVERSATION_STATUS_COLORS: Record<string, string> = {
  UNASSIGNED: "bg-neutral-400/20 text-neutral-600",
  OPEN: "bg-primary-50 text-primary-600",
  WAITING_CUSTOMER: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-green-50 text-green-700",
  REOPENED: "bg-secondary-50 text-secondary-600",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  AGENT: "Atendente",
};

export const APP_NAME = "WhatsApp Platform";

export const QUICK_REPLY_CATEGORIES = [
  { key: "boas-vindas", label: "Boas-vindas", color: "#3B82F6" },
  { key: "vendas", label: "Vendas", color: "#10B981" },
  { key: "suporte", label: "Suporte", color: "#F59E0B" },
] as const;
