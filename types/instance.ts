// Alinhado ao `InstancePublic` (lib/services/instance.service.ts) —
// mesmos campos expostos pela API (uazapiToken/webhookSecret ficam no servidor).

export type InstanceStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "CONNECTING"
  | "ERROR";

export interface WhatsAppInstance {
  id: string;
  workspaceId: string;
  name: string;
  phone: string | null;
  color: string;
  status: InstanceStatus;
  uazapiSubdomain: string;
  uazapiInstanceId: string;
  msgDelayMin: number;
  msgDelayMax: number;
  proxyUrl: string | null;
  lastConnectedAt: string | null;
  lastHealthCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectInstanceResult {
  status: InstanceStatus;
  qrCode: string | null;
  pairingCode: string | null;
}
