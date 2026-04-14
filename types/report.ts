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
