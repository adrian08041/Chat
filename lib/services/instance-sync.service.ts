// Instance sync service — importa contatos a partir do /chat/find da UazApi.
// Job state in-memory (Map por workspaceId:instanceId) com idempotência: se já
// existe job rodando pra mesma instance, retorna o existente em vez de iniciar
// outro. Limitação: state perdido em restart do processo e não compartilhado
// entre múltiplos workers — vale só pra single-instance do Node.

import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { upsertContactFromInbound } from "@/lib/services/contact.service";
import { getUazApiClient } from "@/lib/uazapi";
import { stripJidSuffix } from "@/lib/whatsapp/normalize";
import type { SyncJob } from "@/types/instance-sync";

export type { SyncJob, SyncJobStatus } from "@/types/instance-sync";

const PAGE_SIZE = 200;
const SORT = "-wa_lastMsgTimestamp";
// Jobs terminais (done/error/cancelled) ficam no Map por TTL_MS pra que o
// client busque o estado final, depois somem pra não vazar memória.
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
}): Promise<{ job: SyncJob; alreadyRunning: boolean }> {
  const key = jobKey(params.workspaceId, params.instanceId);
  const existing = jobs.get(key);
  if (existing && existing.status === "running") {
    return { job: toPublicJob(existing), alreadyRunning: true };
  }

  // Reserva o slot ANTES do primeiro await pra fechar a janela de race entre
  // dois requests concorrentes na mesma instance. JS single-threaded garante
  // que o Map.set acontece sem interleave com outro Map.get desta função.
  const job: InternalSyncJob = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    instanceId: params.instanceId,
    status: "running",
    fetched: 0,
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
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
  creds: { subdomain: string; token: string },
): Promise<void> {
  const client = getUazApiClient();
  const key = jobKey(job.workspaceId, job.instanceId);
  try {
    let offset = 0;
    while (true) {
      if (job.cancelled) break;

      const result = await client.listChats(creds, {
        limit: PAGE_SIZE,
        offset,
        sort: SORT,
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
            job.imported++;
          } else {
            job.updated++;
          }
        } catch (err) {
          console.error(
            `[instance-sync] upsert falhou phone=${phone}`,
            err,
          );
          job.skipped++;
        }
      }

      job.fetched += result.chats.length;

      const reachedEnd = result.chats.length < PAGE_SIZE;
      const reachedTotal =
        result.pagination.totalRecords > 0 &&
        job.fetched >= result.pagination.totalRecords;
      if (reachedEnd || reachedTotal) break;
      offset += PAGE_SIZE;
    }

    job.status = job.cancelled ? "cancelled" : "done";
    job.finishedAt = Date.now();
    console.info(
      `[instance-sync] ${job.status} workspace=${job.workspaceId} instance=${job.instanceId} imported=${job.imported} updated=${job.updated} skipped=${job.skipped}`,
    );
  } catch (err) {
    job.status = "error";
    job.errorMessage = err instanceof Error ? err.message : String(err);
    job.finishedAt = Date.now();
    console.error(
      `[instance-sync] FAIL workspace=${job.workspaceId} instance=${job.instanceId}`,
      err,
    );
  } finally {
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
