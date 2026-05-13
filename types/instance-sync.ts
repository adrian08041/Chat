// Contrato compartilhado entre service e hook — zero drift entre backend e
// client. Estado interno adicional (ex.: flag `cancelled`) fica no service.

export type SyncJobStatus = "running" | "done" | "error" | "cancelled";

export interface SyncJob {
  id: string;
  workspaceId: string;
  instanceId: string;
  status: SyncJobStatus;
  fetched: number;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  startedAt: number;
  finishedAt: number | null;
  errorMessage: string | null;
}
