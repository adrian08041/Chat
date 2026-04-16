export type InstanceStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR";

export interface WhatsAppInstance {
  id: string;
  workspaceId: string;
  name: string;
  phone: string | null;
  evolutionInstanceName: string;
  color: string;
  status: InstanceStatus;
  qrCode: string | null;
  defaultAssignedUserId: string | null;
  createdAt: string;
}

export interface NumberCardData {
  instance: WhatsAppInstance;
  activeConversations: number;
  assignedAgents: { id: string; name: string }[];
}
