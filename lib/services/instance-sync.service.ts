// Instance sync service — importa contatos a partir do /chat/find da UazApi.
// Job state in-memory (Map por workspaceId:instanceId) com idempotência: se já
// existe job rodando pra mesma instance, retorna o existente em vez de iniciar
// outro. Limitação: state perdido em restart do processo e não compartilhado
// entre múltiplos workers — vale só pra single-instance do Node.

import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { upsertContactFromInbound } from "@/lib/services/contact.service";
import {
  type ContactScope,
  getUazApiClient,
  type UazApiClient,
  type UazApiInstanceCredentials,
} from "@/lib/uazapi";
import { stripJidSuffix } from "@/lib/whatsapp/normalize";
import type { SyncJob } from "@/types/instance-sync";

export type { SyncJob, SyncJobStatus } from "@/types/instance-sync";

const PAGE_SIZE_CHATS = 200;
const PAGE_SIZE_CONTACTS = 500;
const SORT_CHATS = "-wa_lastMsgTimestamp";
// Jobs terminais ficam no Map por TTL_MS pra que o client busque o estado
// final, depois somem pra não vazar memória.
const TTL_MS = 10 * 60 * 1000;

// Estado interno acrescenta a flag `cancelled` (sinal entre cancelSyncContacts
// e o loop de runJob). Não vaza pro contrato público — funções exportadas
// devolvem `SyncJob` (de types/instance-sync.ts) via toPublicJob.
interface InternalSyncJob extends SyncJob {
  cancelled: boolean;
}

function toPublicJob(job: InternalSyncJob): SyncJob {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cancelled, ...publicJob } = job;
  return publicJob;
}

const jobs = new Map<string, InternalSyncJob>();

function jobKey(workspaceId: string, instanceId: string): string {
  return `${workspaceId}:${instanceId}`;
}

export async function startSyncContacts(params: {
  workspaceId: string;
  instanceId: string;
  contactScope?: ContactScope;
}): Promise<{ job: SyncJob; alreadyRunning: boolean }> {
  const key = jobKey(params.workspaceId, params.instanceId);
  const existing = jobs.get(key);
  if (existing && existing.status === "running") {
    // Não troca scope no meio do caminho — retorna o em curso.
    return { job: toPublicJob(existing), alreadyRunning: true };
  }

  const contactScope: ContactScope = params.contactScope ?? "address_book";

  // Reserva o slot ANTES do primeiro await pra fechar a janela de race entre
  // dois requests concorrentes na mesma instance.
  const job: InternalSyncJob = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    instanceId: params.instanceId,
    status: "running",
    phase: "chats",
    fetched: 0,
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    chatsImported: 0,
    chatsUpdated: 0,
    addressBookImported: 0,
    addressBookUpdated: 0,
    warning: null,
    contactScope,
    startedAt: Date.now(),
    finishedAt: null,
    errorMessage: null,
    cancelled: false,
  };
  jobs.set(key, job);

  let creds: { subdomain: string; token: string };
  try {
    const instance = await prisma.instance.findFirst({
      where: {
        id: params.instanceId,
        workspaceId: params.workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        uazapiSubdomain: true,
        uazapiToken: true,
      },
    });
    if (!instance) {
      throw new ApiError("Número não encontrado", 404);
    }
    if (instance.status !== "CONNECTED") {
      throw new ApiError(
        "Número precisa estar conectado para importar contatos",
        409,
      );
    }
    creds = { subdomain: instance.uazapiSubdomain, token: instance.uazapiToken };
  } catch (err) {
    jobs.delete(key);
    throw err;
  }

  // Dispara processamento sem await — caller recebe job com status running.
  void runJob(job, creds);

  return { job: toPublicJob(job), alreadyRunning: false };
}

export function getSyncStatus(params: {
  workspaceId: string;
  instanceId: string;
}): SyncJob | null {
  const job = jobs.get(jobKey(params.workspaceId, params.instanceId));
  return job ? toPublicJob(job) : null;
}

// Marca o job como cancelado. O loop de runJob lê a flag entre páginas e
// entre upserts, então cancel efetiva ao terminar a iteração corrente (até
// uma página + 1 upsert pendente). Idempotente: cancel em job não-running é no-op.
export function cancelSyncContacts(params: {
  workspaceId: string;
  instanceId: string;
}): { cancelled: boolean } {
  const job = jobs.get(jobKey(params.workspaceId, params.instanceId));
  if (!job || job.status !== "running") return { cancelled: false };
  job.cancelled = true;
  return { cancelled: true };
}

async function runJob(
  job: InternalSyncJob,
  creds: UazApiInstanceCredentials,
): Promise<void> {
  const client = getUazApiClient();
  const key = jobKey(job.workspaceId, job.instanceId);
  try {
    // FASE 1 — /chat/find. Falha aqui vira `error`.
    job.phase = "chats";
    await runChatsPhase(job, creds, client);
    if (job.cancelled) {
      job.status = "cancelled";
      console.info(
        `[instance-sync] cancelled (phase 1) workspace=${job.workspaceId} instance=${job.instanceId} imported=${job.imported} updated=${job.updated} skipped=${job.skipped}`,
      );
      return;
    }

    // FASE 2 — /contacts/list. Falha aqui vira `done + warning`,
    // preservando o resultado da fase 1.
    job.phase = "address_book";
    try {
      await runAddressBookPhase(job, creds, client);
    } catch (phase2Err) {
      const msg =
        phase2Err instanceof Error ? phase2Err.message : String(phase2Err);
      job.warning = `Falhei ao importar agenda: ${msg}`;
      console.warn(
        `[instance-sync] phase2 failed (degraded done) workspace=${job.workspaceId} instance=${job.instanceId}`,
        phase2Err,
      );
    }

    job.status = job.cancelled ? "cancelled" : "done";
    console.info(
      `[instance-sync] ${job.status} workspace=${job.workspaceId} instance=${job.instanceId} chats=${job.chatsImported}+${job.chatsUpdated} address_book=${job.addressBookImported}+${job.addressBookUpdated} skipped=${job.skipped}${job.warning ? ` warning="${job.warning}"` : ""}`,
    );
  } catch (err) {
    job.status = "error";
    job.errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[instance-sync] FAIL workspace=${job.workspaceId} instance=${job.instanceId}`,
      err,
    );
  } finally {
    job.finishedAt = Date.now();
    // TTL: remove o job do Map depois do client ter tempo de buscar o estado
    // final. Guard por job.id evita apagar uma execução posterior que tenha
    // sobrescrito a entrada na mesma chave workspace:instance.
    const timer = setTimeout(() => {
      const current = jobs.get(key);
      if (current?.id === job.id) jobs.delete(key);
    }, TTL_MS);
    timer.unref?.();
  }
}

async function runChatsPhase(
  job: InternalSyncJob,
  creds: UazApiInstanceCredentials,
  client: UazApiClient,
): Promise<void> {
  let offset = 0;
  while (true) {
    if (job.cancelled) break;

    const result = await client.listChats(creds, {
      limit: PAGE_SIZE_CHATS,
      offset,
      sort: SORT_CHATS,
    });

    if (result.pagination.totalRecords > 0) {
      job.total = result.pagination.totalRecords;
    }

    for (const chat of result.chats) {
      if (job.cancelled) break;
      if (chat.wa_isGroup) {
        job.skipped++;
        continue;
      }
      const phone = chat.phone ?? stripJidSuffix(chat.wa_chatid);
      if (!phone) {
        job.skipped++;
        continue;
      }
      const fallbackName =
        chat.wa_contactName ?? chat.wa_name ?? chat.name ?? null;
      const avatarUrl = chat.image ?? null;

      try {
        const { created } = await upsertContactFromInbound({
          workspaceId: job.workspaceId,
          phone,
          fallbackName,
          avatarUrl,
        });
        if (created) {
          job.chatsImported++;
        } else {
          job.chatsUpdated++;
        }
        recomputeAggregates(job);
      } catch (err) {
        console.error(
          `[instance-sync] upsert (chats) falhou phone=${phone}`,
          err,
        );
        job.skipped++;
      }
    }

    job.fetched += result.chats.length;

    const reachedEnd = result.chats.length < PAGE_SIZE_CHATS;
    const reachedTotal =
      result.pagination.totalRecords > 0 &&
      job.fetched >= result.pagination.totalRecords;
    if (reachedEnd || reachedTotal) break;
    offset += PAGE_SIZE_CHATS;
  }
}

async function runAddressBookPhase(
  job: InternalSyncJob,
  creds: UazApiInstanceCredentials,
  client: UazApiClient,
): Promise<void> {
  // Snapshot do total da fase 1, antes de qualquer write em job.total na fase 2.
  const chatsTotalSnapshot = job.total;
  let offset = 0;

  while (true) {
    if (job.cancelled) break;

    const result = await client.listContacts(creds, {
      limit: PAGE_SIZE_CONTACTS,
      offset,
      contactScope: job.contactScope,
    });

    if (result.pagination.totalRecords > 0) {
      job.total = chatsTotalSnapshot + result.pagination.totalRecords;
    }

    for (const contact of result.contacts) {
      if (job.cancelled) break;

      // Grupo (`@g.us`) não vira contato.
      if (contact.jid.endsWith("@g.us")) {
        job.skipped++;
        continue;
      }

      const phone = stripJidSuffix(contact.jid);
      if (!phone) {
        job.skipped++;
        continue;
      }

      const fallbackName =
        contact.contact_name ?? contact.contact_FirstName ?? null;

      try {
        const { created } = await upsertContactFromInbound({
          workspaceId: job.workspaceId,
          phone,
          fallbackName,
          avatarUrl: null, // /contacts/list não retorna foto.
        });
        if (created) {
          job.addressBookImported++;
        } else {
          job.addressBookUpdated++;
        }
        recomputeAggregates(job);
      } catch (err) {
        console.error(
          `[instance-sync] upsert (address_book) falhou phone=${phone}`,
          err,
        );
        job.skipped++;
      }
    }

    job.fetched += result.contacts.length;

    const reachedEnd = result.contacts.length < PAGE_SIZE_CONTACTS;
    const reachedTotal =
      result.pagination.totalRecords > 0 &&
      job.fetched >= chatsTotalSnapshot + result.pagination.totalRecords;
    if (reachedEnd || reachedTotal) break;
    offset += PAGE_SIZE_CONTACTS;
  }
}

function recomputeAggregates(job: InternalSyncJob): void {
  job.imported = job.chatsImported + job.addressBookImported;
  job.updated = job.chatsUpdated + job.addressBookUpdated;
}
