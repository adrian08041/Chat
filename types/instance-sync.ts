// Contrato compartilhado entre service e hook — zero drift entre backend e
// client. Estado interno adicional (ex.: flag `cancelled`) fica no service.

import type { ContactScope } from "@/lib/uazapi";

export type SyncJobStatus = "running" | "done" | "error" | "cancelled";

// Fase do job. UI usa pra trocar o texto do progress.
// `chats` = /chat/find (conversas existentes).
// `address_book` = /contacts/list (agenda do aparelho).
export type SyncPhase = "chats" | "address_book";

export interface SyncJob {
  id: string;
  workspaceId: string;
  instanceId: string;
  status: SyncJobStatus;
  phase: SyncPhase;
  // Agregados (chats + agenda) — usados pelo progress bar e toasts simples.
  fetched: number;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  // Granulares por fase — usados pelo toast final pra agrupar a contagem.
  chatsImported: number;
  chatsUpdated: number;
  addressBookImported: number;
  addressBookUpdated: number;
  // status=done + warning != null significa "completou com aviso" (ex.: fase 2
  // falhou após fase 1 ok). Separado de errorMessage (que vai junto de error).
  warning: string | null;
  contactScope: ContactScope;
  startedAt: number;
  finishedAt: number | null;
  errorMessage: string | null;
}
