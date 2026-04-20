// Shapes compartilhados entre lib/services/report.service.ts (server) e
// lib/hooks/use-reports.ts (client). Zero deps de Prisma — tipos puros TS.
// Servem de contrato público das rotas /api/reports/*.

export type DashboardRange = "today" | "7d" | "30d";

// ── /dashboard (17.1) ──

export type DashboardKpiKey =
  | "openedConversations"
  | "avgResponseTime"
  | "atendimentos"
  | "newLeads";

export type DashboardKpi = {
  key: DashboardKpiKey;
  value: number | null;
  // % vs período anterior equivalente. null = sem baseline (prev=0 e current>0)
  // ou métrica sem trend (ex: avgResponseTime no MVP).
  changePercent: number | null;
};

export type DashboardChartPoint = {
  date: string; // ISO yyyy-mm-dd
  count: number;
};

export type AgentPerformance = {
  userId: string;
  userName: string;
  atendimentos: number;
  conversoes: number;
  taxa: number; // %
  tempoMedio: string | null;
};

export type DashboardOverview = {
  kpis: DashboardKpi[];
  conversationsPerDay: DashboardChartPoint[];
  agents: AgentPerformance[];
};

// ── /relatorios (17.2) ──

export type ReportKpiKey =
  | "totalConversations"
  | "avgResponseTime"
  | "resolutionRate"
  | "satisfaction";

export type ReportKpiUnit = "count" | "percent" | "duration" | "rating";

export type ReportKpi = {
  key: ReportKpiKey;
  value: number | null;
  unit: ReportKpiUnit;
  changePercent: number | null;
};

export type ConversationsByInstancePoint = {
  instanceId: string;
  instanceName: string;
  instanceColor: string;
  conversations: number;
};

export type MessageVolumePoint = {
  date: string; // yyyy-mm-dd
  received: number;
  sent: number;
};

export type ConversationsByStatusBucket = "open" | "resolved" | "unassigned";

export type ConversationsByStatusPoint = {
  bucket: ConversationsByStatusBucket;
  count: number;
};

export type TopPerformer = {
  userId: string;
  userName: string;
  conversations: number;
  resolutionRate: number;
  avgResponseTime: string | null;
};

export type ReportStats = {
  kpis: ReportKpi[];
  conversationsByInstance: ConversationsByInstancePoint[];
  messageVolume: MessageVolumePoint[];
  conversationsByStatus: ConversationsByStatusPoint[];
  topPerformers: TopPerformer[];
};
