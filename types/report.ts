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
