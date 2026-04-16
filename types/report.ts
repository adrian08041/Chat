export interface DashboardOverview {
  openConversations: number;
  unassignedConversations: number;
  todayConversations: number;
  todayMessages: number;
  avgFirstResponseTime: number | null;
  resolvedToday: number;
}

export interface ConversationsByInstance {
  instanceId: string;
  instanceName: string;
  instanceColor: string;
  count: number;
}

export interface ConversationsByAgent {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  openCount: number;
  resolvedCount: number;
  avgResponseTime: number | null;
}

export interface KpiCardData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  trendIsPositive: boolean;
  icon: "conversations" | "clock" | "check" | "user-plus";
}

export type ReportKpiIcon = "conversations" | "clock" | "check" | "star";

export interface ReportKpiCardData {
  label: string;
  value: string;
  valueSuffix?: string;
  change: string;
  trend: "up" | "down";
  trendIsPositive: boolean;
  icon: ReportKpiIcon;
}

export interface ConversasPorNumeroPoint {
  id: string;
  name: string;
  conversas: number;
  color: string;
}

export interface MessageVolumePoint {
  date: string;
  recebidas: number;
  enviadas: number;
}

export interface ConversasPorStatusPoint {
  id: string;
  name: string;
  value: number;
  color: string;
}

export interface TopPerformerData {
  nome: string;
  conversas: number;
  tempoMedio: string;
  taxaResolucao: number;
}

export interface VendedorData {
  nome: string;
  atendimentos: number;
  tempoMedio: string;
  conversoes: number;
  taxa: number;
}

export interface ChartDataPoint {
  date: string;
  conversas: number;
}
