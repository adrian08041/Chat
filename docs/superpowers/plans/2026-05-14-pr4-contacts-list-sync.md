# PR #4 — Sync via `/contacts/list` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estender o sync de contatos com uma segunda fase usando `POST /contacts/list` da UazApi, cobrindo contatos da agenda do aparelho que nunca conversaram com a instância.

**Architecture:** O job atual é refatorado em duas fases sequenciais dentro do mesmo `runJob`: fase 1 mantém o comportamento atual (`/chat/find`), fase 2 paginar `/contacts/list` com `contactScope` configurável. Falha na fase 2 após fase 1 OK termina como `done + warning`. UI ganha um toggle no ConfirmDialog e o texto do progress muda por fase.

**Tech Stack:** Next.js 16, TypeScript, Prisma, React Query, zod, sonner, shadcn/Base UI, UazApi.

**Spec:** [`docs/superpowers/specs/2026-05-14-pr4-contacts-list-sync-design.md`](../specs/2026-05-14-pr4-contacts-list-sync-design.md)

**Convenção de verificação (todas as tasks):** o projeto **não tem framework de testes**. Cada task encerra com `npx tsc --noEmit` + `npm run lint` limpos antes do commit. Verificação funcional manual fica concentrada na Task 8 no fim.

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `lib/uazapi.ts` | Modify | Adicionar tipo `ContactScope`, interfaces `ListContactsParams` / `UazApiAddressBookContact` / `ListContactsResult`, e método `listContacts` no contrato `UazApiClient`. |
| `lib/uazapi/http.ts` | Modify | Implementar `listContacts` no `HttpUazApiClient` (POST `/contacts/list`). Adicionar mapper `toUazApiAddressBookContact`. |
| `types/instance-sync.ts` | Modify | Estender `SyncJob` com `phase`, contadores granulares (`chatsImported`/`chatsUpdated`/`addressBookImported`/`addressBookUpdated`), `warning` e `contactScope`. Adicionar `SyncPhase`. |
| `lib/services/instance-sync.service.ts` | Modify | Refatorar `runJob` em `runChatsPhase` + `runAddressBookPhase` orquestrados sequencialmente. Adicionar `contactScope` ao `startSyncContacts`. Renomear `PAGE_SIZE` para `PAGE_SIZE_CHATS`, adicionar `PAGE_SIZE_CONTACTS`. |
| `app/api/instances/[id]/sync-contacts/route.ts` | Modify | `POST` aceita body opcional `{ contactScope?: "address_book" \| "all" }` validado com zod. |
| `lib/hooks/use-instances.ts` | Modify | `useStartSyncContacts` aceita `{ instanceId, contactScope }`. Reexportar tipo `ContactScope`. |
| `components/numbers/numbers-content.tsx` | Modify | `SyncContactsRow` ganha state de scope, toggle no ConfirmDialog, texto por fase, toast final agregado com warning. |

**Por que não dividi service em arquivos:** `runChatsPhase` e `runAddressBookPhase` compartilham state mutável do `InternalSyncJob` e estão acoplados ao `runJob` orquestrador. Manter no mesmo arquivo evita acoplamento por exportar internals.

---

## Task 1: Estender contrato UazApi com `listContacts`

**Files:**
- Modify: `lib/uazapi.ts`

**Contexto pro implementador:** o arquivo `lib/uazapi.ts` define o contrato provider-agnostic do cliente UazApi. Já existem padrões similares (`listChats`, `checkNumbers`, `UazApiChat`). Os novos tipos seguem o mesmo estilo.

- [ ] **Step 1: Adicionar tipos e estender interface `UazApiClient`**

Em `lib/uazapi.ts`, após a interface `UazApiNumberCheck` (linha ~143), adicionar:

```ts
// /contacts/list — agenda do aparelho paginada.
// Diferente de /chat/find: traz contatos sem conversa (lead salvo no celular).
export type ContactScope = "address_book" | "outside_address_book" | "all";

export interface ListContactsParams {
  limit: number;   // <= 1000
  offset: number;
  contactScope: ContactScope;
}

// Os nomes dos campos refletem o schema documentado da UazApi
// (`contact_name`, `contact_FirstName`). Se houver divergência de casing/nome
// no response real, mapear no HTTP client em vez de propagar pro contrato.
export interface UazApiAddressBookContact {
  jid: string;
  contact_name: string | null;
  contact_FirstName: string | null;
}

export interface ListContactsResult {
  contacts: UazApiAddressBookContact[];
  pagination: {
    totalRecords: number;
    limit: number;
    offset: number;
  };
  totalDeviceContacts: number;
}
```

Dentro da interface `UazApiClient`, na seção "Chats" (após `listChats`), acrescentar:

```ts
  // Agenda do aparelho (complementar a listChats — traz contatos sem conversa)
  listContacts(
    creds: UazApiInstanceCredentials,
    params: ListContactsParams,
  ): Promise<ListContactsResult>;
```

- [ ] **Step 2: Verificar tsc**

Run: `npx tsc --noEmit`

Expected: PASS (sem erros). O método ainda não está implementado no `HttpUazApiClient`, então deve haver um erro de tipo lá. **Esperado falhar em `lib/uazapi/http.ts` com erro tipo "Class 'HttpUazApiClient' incorrectly implements interface 'UazApiClient'. Property 'listContacts' is missing"**.

- [ ] **Step 3: Anotar o erro esperado e seguir pra Task 2**

Não commitar ainda — Task 2 resolve o erro de implementação.

---

## Task 2: Implementar `listContacts` no `HttpUazApiClient`

**Files:**
- Modify: `lib/uazapi/http.ts`

**Contexto pro implementador:** seguir o padrão de `listChats` (linha ~296). O endpoint UazApi é `POST /contacts/list` com body `{ limit, offset, contactScope }`. Response esperado: `{ contacts: [...], pagination: {...}, totalDeviceContacts }`. Helpers `pickString`/`pickNumber`/`isObject`/`pick` já existem no arquivo.

- [ ] **Step 1: Adicionar imports do tipo novo**

No bloco de imports no topo de `lib/uazapi/http.ts` (linhas 6-23), incluir os tipos novos:

```ts
import {
  type ConnectInstanceResult,
  type CreateInstanceParams,
  type CreateInstanceResult,
  type InstanceStatusResult,
  type ListChatsParams,
  type ListChatsResult,
  type ListContactsParams,           // NOVO
  type ListContactsResult,           // NOVO
  type SendMediaParams,
  type SendResult,
  type SendTextParams,
  type SetWebhookParams,
  type UazApiAddressBookContact,     // NOVO
  type UazApiChat,
  type UazApiClient,
  type UazApiInstanceCredentials,
  type UazApiNumberCheck,
  UazApiError,
  type UpdateDelayParams,
} from "../uazapi";
```

- [ ] **Step 2: Adicionar mapper `toUazApiAddressBookContact`**

Após `toNumberCheck` (linha ~86), adicionar:

```ts
function toUazApiAddressBookContact(
  raw: Record<string, unknown>,
): UazApiAddressBookContact | null {
  const jid = pickString(raw, "jid");
  if (!jid) return null;
  return {
    jid,
    contact_name: pickString(raw, "contact_name", "contactName"),
    contact_FirstName: pickString(
      raw,
      "contact_FirstName",
      "contact_firstName",
      "contactFirstName",
    ),
  };
}
```

(Aceitamos variações de casing porque a UazApi às vezes é inconsistente — gotcha documentado no comentário do `sendText`.)

- [ ] **Step 3: Implementar método `listContacts` na classe**

Após `listChats` (linha ~327), adicionar:

```ts
  async listContacts(
    creds: UazApiInstanceCredentials,
    params: ListContactsParams,
  ): Promise<ListContactsResult> {
    const result = await this.instanceRequest(creds, "/contacts/list", {
      method: "POST",
      body: {
        limit: params.limit,
        offset: params.offset,
        contactScope: params.contactScope,
      },
    });

    const rawContacts = pick(result, "contacts");
    const contacts: UazApiAddressBookContact[] = Array.isArray(rawContacts)
      ? rawContacts
          .filter(isObject)
          .map(toUazApiAddressBookContact)
          .filter((c): c is UazApiAddressBookContact => c !== null)
      : [];

    const pagination = pick(result, "pagination");
    const totalRecords =
      pickNumber(pagination, "totalRecords") ?? contacts.length;
    const limit = pickNumber(pagination, "limit") ?? params.limit;
    const offset = pickNumber(pagination, "offset") ?? params.offset;

    const totalDeviceContacts = pickNumber(result, "totalDeviceContacts") ?? 0;

    return {
      contacts,
      pagination: { totalRecords, limit, offset },
      totalDeviceContacts,
    };
  }
```

- [ ] **Step 4: Verificar estática**

Run: `npx tsc --noEmit && npm run lint`

Expected: PASS limpo.

- [ ] **Step 5: Commit**

```bash
git add lib/uazapi.ts lib/uazapi/http.ts
git commit -m "feat(uazapi): adiciona listContacts pro /contacts/list"
```

---

## Task 3: Estender tipo `SyncJob` com fase, contadores granulares e warning

**Files:**
- Modify: `types/instance-sync.ts`

**Contexto:** o tipo é tiny (20 linhas). Precisamos adicionar 7 campos novos sem quebrar leitores existentes (UI lê `fetched`/`total`/`imported`/`updated`/`skipped` — esses ficam como agregados).

- [ ] **Step 1: Editar o arquivo inteiro**

Substituir o conteúdo de `types/instance-sync.ts` por:

```ts
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
```

- [ ] **Step 2: Verificar estática (esperado quebrar)**

Run: `npx tsc --noEmit`

Expected: vai quebrar em `lib/services/instance-sync.service.ts` (campos novos não preenchidos no `InternalSyncJob`). Esse é o próximo task.

- [ ] **Step 3: Não commitar ainda**

Task 4 resolve o tsc.

---

## Task 4: Refatorar `instance-sync.service.ts` em duas fases

**Files:**
- Modify: `lib/services/instance-sync.service.ts`

**Contexto:** essa é a task mais densa do PR. Decomponha o `runJob` atual em duas funções de fase + orquestrador. A fase 1 preserva o comportamento atual mas passa a contar em `chatsImported`/`chatsUpdated`. A fase 2 paginar `/contacts/list`. Falha em fase 2 vira `warning`, não `error`.

- [ ] **Step 1: Atualizar imports e constantes**

No topo do arquivo (linhas 1-21), substituir:

```ts
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
```

(Renomear `PAGE_SIZE` → `PAGE_SIZE_CHATS` e `SORT` → `SORT_CHATS` por simetria com fase 2.)

- [ ] **Step 2: Atualizar `InternalSyncJob` e `toPublicJob`**

`InternalSyncJob` continua estendendo `SyncJob` com a flag `cancelled`. Como `SyncJob` ganhou campos novos, o tipo `InternalSyncJob` segue automaticamente — não precisa mudar a declaração. `toPublicJob` continua igual.

- [ ] **Step 3: Atualizar `startSyncContacts` pra aceitar `contactScope`**

Substituir a função inteira por:

```ts
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
```

- [ ] **Step 4: Substituir `runJob` pelo orquestrador de duas fases**

Substituir a função `runJob` inteira (linhas ~129-219 no estado original) por o código abaixo. **Nota:** a versão antiga tinha `job.finishedAt = Date.now()` em três lugares (sucesso, erro e antes do TTL). A nova centraliza no `finally` — comportamento idêntico, código mais curto.

```ts
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
    const timer = setTimeout(() => {
      const current = jobs.get(key);
      if (current?.id === job.id) jobs.delete(key);
    }, TTL_MS);
    timer.unref?.();
  }
}
```

- [ ] **Step 5: Adicionar `runChatsPhase` (extrai o loop atual)**

Acima de `runJob` (ou abaixo — convenção do arquivo), adicionar:

```ts
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
```

- [ ] **Step 6: Adicionar `runAddressBookPhase` e helper `recomputeAggregates`**

Adicionar (próximo do `runChatsPhase`):

```ts
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
```

- [ ] **Step 7: Verificar estática**

Run: `npx tsc --noEmit && npm run lint`

Expected: PASS limpo. Se quebrar em chamadores de `startSyncContacts` que passavam só `{ workspaceId, instanceId }` — o novo parâmetro `contactScope` é opcional, então não quebra; mas confira.

- [ ] **Step 8: Commit**

```bash
git add types/instance-sync.ts lib/services/instance-sync.service.ts
git commit -m "feat(sync): refatora runJob em duas fases (chats + agenda)"
```

---

## Task 5: API aceita `contactScope` no body

**Files:**
- Modify: `app/api/instances/[id]/sync-contacts/route.ts`

**Contexto:** o handler POST hoje não lê body. Adicionar validação zod opcional. `GET` e `DELETE` ficam intactos.

- [ ] **Step 1: Adicionar schema zod e usar no POST**

Substituir o arquivo inteiro por:

```ts
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import {
  cancelSyncContacts,
  getSyncStatus,
  startSyncContacts,
} from "@/lib/services/instance-sync.service";

type RouteContext = { params: Promise<{ id: string }> };

// API expõe só dois valores do toggle. O service permite "outside_address_book"
// internamente; deixar fora do contrato HTTP até virar requisito.
const StartBodySchema = z
  .object({
    contactScope: z.enum(["address_book", "all"]).optional(),
  })
  .optional();

// POST inicia o sync (idempotente: se já tem job running pra mesma instance,
// retorna o existente com alreadyRunning=true). Qualquer role do workspace.
export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    // Body é opcional — request sem body cai no default address_book.
    const raw = await request.text();
    const parsed = raw ? StartBodySchema.parse(JSON.parse(raw)) : undefined;

    const result = await startSyncContacts({
      workspaceId: session.user.workspaceId,
      instanceId: id,
      contactScope: parsed?.contactScope,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

// GET retorna estado atual do job ou null se nunca rodou pra essa instance.
export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const job = getSyncStatus({
      workspaceId: session.user.workspaceId,
      instanceId: id,
    });
    return ok({ job });
  } catch (error) {
    return handleRouteError(error);
  }
}

// DELETE cancela o job em andamento. No-op se nenhum job estiver running.
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const result = cancelSyncContacts({
      workspaceId: session.user.workspaceId,
      instanceId: id,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
```

**Nota sobre `handleRouteError`:** já confirmado — `lib/api-utils.ts:49-50` mapeia `ZodError` para HTTP **422** ("Dados inválidos"). Essa é a convenção do projeto pra erros de validação (não 400). Deixar o catch como está; nenhuma modificação extra necessária.

- [ ] **Step 2: Verificar estática**

Run: `npx tsc --noEmit && npm run lint`

Expected: PASS limpo.

- [ ] **Step 3: Commit**

```bash
git add app/api/instances/[id]/sync-contacts/route.ts
git commit -m "feat(api): /sync-contacts aceita contactScope no body"
```

---

## Task 6: Hook `useStartSyncContacts` aceita `contactScope`

**Files:**
- Modify: `lib/hooks/use-instances.ts`

**Contexto:** o hook hoje recebe `instanceId: string` direto. Vamos mudar pra um objeto `{ instanceId, contactScope }`. O único caller é `SyncContactsRow` (será ajustado na Task 7).

- [ ] **Step 1: Reexportar `ContactScope` e mudar assinatura**

No topo do `lib/hooks/use-instances.ts`, adicionar ao import:

```ts
import type { SyncJob } from "@/types/instance-sync";
import type { ContactScope } from "@/lib/uazapi";

export type { ContactScope };
```

Substituir `useStartSyncContacts` (linhas ~130-148) por:

```ts
export type StartSyncContactsInput = {
  instanceId: string;
  contactScope: ContactScope;
};

export function useStartSyncContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, contactScope }: StartSyncContactsInput) =>
      apiFetch<{ job: SyncJob; alreadyRunning: boolean }>(
        `/api/instances/${instanceId}/sync-contacts`,
        {
          method: "POST",
          body: JSON.stringify({ contactScope }),
        },
      ),
    onSuccess: (data, { instanceId }) => {
      queryClient.setQueryData(["instances", instanceId, "sync-contacts"], {
        job: data.job,
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
```

- [ ] **Step 2: Verificar estática (esperado quebrar no caller)**

Run: `npx tsc --noEmit`

Expected: erro em `components/numbers/numbers-content.tsx` — a chamada `startMutation.mutate(instanceId, ...)` agora exige objeto. Task 7 resolve.

- [ ] **Step 3: Não commitar ainda — Task 7 fecha junto**

---

## Task 7: UI — toggle no ConfirmDialog + texto por fase + toast agregado

**Files:**
- Modify: `components/numbers/numbers-content.tsx`

**Contexto:** essa é a task mais visível pro usuário. Mexer em `SyncContactsRow` (linhas ~145-296 no estado atual). Cuidado: o `ConfirmDialog` aceita um `description: ReactNode` — dá pra colocar JSX dentro.

- [ ] **Step 1: Adicionar import do tipo `ContactScope`**

No topo de `components/numbers/numbers-content.tsx`, na linha do import de `use-instances`:

```ts
import {
  useCancelSyncContacts,
  useDeleteInstance,
  useDisconnectInstance,
  useInstances,
  useStartSyncContacts,
  useSyncContactsStatus,
  type ContactScope,
} from "@/lib/hooks/use-instances";
```

- [ ] **Step 2: Adicionar state e mudar handler do confirm**

Dentro de `SyncContactsRow`, junto dos states existentes (após `const [confirmOpen, setConfirmOpen] = useState(false);`):

```ts
  const [scope, setScope] = useState<ContactScope>("address_book");
```

Substituir `handleConfirmStart` (linhas ~190-209) por:

```ts
  const handleConfirmStart = useCallback(() => {
    setConfirmOpen(false);
    setStatusEnabled(true);
    startMutation.mutate(
      { instanceId, contactScope: scope },
      {
        onSuccess: (result) => {
          if (result.alreadyRunning) {
            toast.info("Importação já em andamento");
          } else {
            toast.info("Importação iniciada");
          }
        },
        onError: (err) => {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Falha ao iniciar importação";
          toast.error(message);
        },
      },
    );
  }, [instanceId, scope, startMutation]);
```

- [ ] **Step 3: Mudar o texto do progress por fase**

Localizar o bloco `{isRunning ? (...)` (linha ~232). Substituir o `<span>` interno de "Importando contatos…" por:

```tsx
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {job.phase === "address_book"
                  ? "Importando agenda..."
                  : "Importando conversas..."}
              </span>
```

(Resto do bloco de progress fica igual — barra continua agregada via `progressPct`.)

- [ ] **Step 4: Atualizar o `useEffect` de transições terminais (toast final)**

Substituir o `useEffect` (linhas ~159-188) por:

```tsx
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev === "running") {
      if (job?.status === "done") {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });

        // Template alinhado com spec §9.3:
        //   "Importação concluída: X conversas + Y da agenda · Z atualizados"
        // Cada parte com 0 é omitida.
        const novosParts: string[] = [];
        if (job.chatsImported > 0) {
          novosParts.push(`${job.chatsImported} conversas`);
        }
        if (job.addressBookImported > 0) {
          novosParts.push(`${job.addressBookImported} da agenda`);
        }
        const novos = novosParts.length > 0 ? novosParts.join(" + ") : "0";
        const total = job.imported + job.updated;
        const summary = `Importação concluída: ${novos}${
          job.updated > 0 ? ` · ${job.updated} atualizados` : ""
        }${job.skipped > 0 ? ` · ${job.skipped} pulados` : ""}`;

        if (job.warning) {
          toast.success(summary, { description: job.warning });
        } else if (total === 0 && job.skipped === 0) {
          toast.info("Nada novo para importar");
        } else {
          toast.success(summary);
        }
      } else if (job?.status === "cancelled") {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast.info(
          `Importação cancelada: ${job.imported} novos, ${job.updated} atualizados antes de parar`,
        );
      } else if (job?.status === "error") {
        toast.error(
          `Falha ao importar: ${job.errorMessage ?? "erro desconhecido"}`,
        );
      }
    }
    prevStatusRef.current = job?.status ?? null;
  }, [
    job?.status,
    job?.imported,
    job?.updated,
    job?.skipped,
    job?.chatsImported,
    job?.addressBookImported,
    job?.warning,
    job?.errorMessage,
    queryClient,
  ]);
```

- [ ] **Step 5: Adicionar o toggle no `ConfirmDialog`**

O `ConfirmDialog` aceita `description: ReactNode`. Substituir o uso atual (linhas ~278-294) por:

```tsx
      <ConfirmDialog
        open={confirmOpen}
        title="Importar contatos do WhatsApp"
        description={
          <div className="space-y-3">
            <p>
              Vai importar contatos deste número pro CRM. Contatos já existentes
              mantêm o nome editado; foto de perfil é atualizada quando houver.
              Pode levar alguns minutos.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-txt-primary">
                O que importar?
              </p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`sync-scope-${instanceId}`}
                  value="address_book"
                  checked={scope === "address_book"}
                  onChange={() => setScope("address_book")}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium text-txt-primary">
                    Só contatos salvos
                  </span>
                  <span className="block text-xs text-txt-muted">
                    Inclui apenas quem você salvou na agenda do celular.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`sync-scope-${instanceId}`}
                  value="all"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium text-txt-primary">
                    Todos os contatos
                  </span>
                  <span className="block text-xs text-txt-muted">
                    Inclui também números não-salvos (de grupos, etc.). Pode
                    importar muito mais.
                  </span>
                </span>
              </label>
            </div>
          </div>
        }
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        variant="primary"
        onConfirm={handleConfirmStart}
        onCancel={() => setConfirmOpen(false)}
      />
```

(Radio nativo é suficiente — não vale adicionar lib de UI só pra isso. Classes de spacing usam tokens semânticos do projeto.)

- [ ] **Step 6: Verificar estática**

Run: `npx tsc --noEmit && npm run lint`

Expected: PASS limpo.

- [ ] **Step 7: Commit**

```bash
git add lib/hooks/use-instances.ts components/numbers/numbers-content.tsx
git commit -m "feat(numeros): toggle de scope + progress por fase no sync"
```

---

## Task 8: Verificação manual end-to-end

**Files:** nenhum — verificação no app rodando.

**Contexto:** o projeto não tem testes automatizados. Essa task é o portão final antes de declarar o PR pronto.

- [ ] **Step 1: Start do dev server**

Run: `npm run dev`

Abrir `http://localhost:3000`, fazer login.

- [ ] **Step 2: Checar tipos e lint num shell paralelo**

Run: `npx tsc --noEmit && npm run lint`

Expected: PASS limpo.

- [ ] **Step 3: Disparar sync com toggle "Só salvos" (default)**

1. Ir em `/numeros`.
2. Numa instância CONNECTED, clicar **"Importar contatos"**.
3. Confirmar que o ConfirmDialog mostra os dois radios e "Só contatos salvos" está marcado.
4. Clicar **"Importar"**.
5. Observar a barra de progress:
   - Texto começa em **"Importando conversas..."**.
   - Em algum momento muda pra **"Importando agenda..."** (quando entra fase 2).
6. Ao fim, conferir toast: **"Importação concluída: X conversas + Y da agenda · Z atualizados"** (omite parte com 0).
7. Conferir `/contatos` — devem aparecer contatos novos da fase 2 (mesmo sem avatar).

- [ ] **Step 4: Disparar sync com toggle "Todos"**

1. Mesmo fluxo, mas selecionar **"Todos os contatos"** no toggle.
2. Conferir que vem mais contatos (em geral; depende da agenda).

- [ ] **Step 5: Forçar erro na fase 2**

Opção A — desconectar instância UazApi entre fase 1 e fase 2 (difícil de cronometrar).

Opção B — em dev, editar temporariamente `lib/uazapi/http.ts` no método `listContacts` pra `throw new UazApiError("teste", 500)` antes do request. Disparar sync, conferir:
- Status final = `done`.
- Toast = **success** com a contagem da fase 1 + `description` com o aviso.
- **Reverter o throw** e confirmar com `git diff lib/uazapi/http.ts` antes de qualquer commit/push.

- [ ] **Step 6: Cancelar durante fase 2**

1. Disparar sync.
2. Quando o texto mudar pra "Importando agenda...", clicar **"Cancelar importação"**.
3. Conferir toast info com contagens parciais. Status final = `cancelled`.

- [ ] **Step 7: Validação 422 na API**

Run: `curl -X POST http://localhost:3000/api/instances/<id>/sync-contacts -H "Content-Type: application/json" -H "Cookie: <session>" -d '{"contactScope":"lixo"}'`

Expected: **422** "Dados inválidos" com `details` apontando o campo (convenção do projeto pra ZodError via `handleRouteError`). Se vier 500, há regressão — investigar.

- [ ] **Step 8: POST concorrente com scope diferente**

1. Disparar sync com "Só salvos".
2. Imediatamente disparar de novo (segundo click no botão antes de virar progress) — o segundo click vai abrir o ConfirmDialog de novo. Não testável diretamente na UI sem mexer no estado. Alternativa via curl: enquanto o job está rodando, fazer POST com `{"contactScope":"all"}`.
3. Conferir que response traz `alreadyRunning: true` e o `contactScope` retornado é o original (`address_book`).

- [ ] **Step 9: Marcar como done**

Se todos os steps acima passaram → o PR está pronto pra commit/merge.

---

## Riscos e mitigações específicos da execução

| Risco | Mitigação |
|---|---|
| Convenção do projeto pra ZodError (422) difere do que o spec sugeriu (400) | Plano usa 422 (verificado em `lib/api-utils.ts:49-50`); spec §10 a alinhar em follow-up |
| Mock/test do UazApi não cobre `listContacts` | Não há testes; verificação manual cobre |
| `ConfirmDialog` não aceita `ReactNode` no description | Confirmar antes de fechar Task 7. Se aceitar só string, refatorar pra passar children ou variant nova |
| Casing real de `contact_FirstName` diverge do schema documentado | Mapper em Task 2 já aceita 3 variações; logar uma página em dev pra confirmar |
| Toggle nativo `<input type="radio">` não combina com o resto do design | Aceitável pra MVP; futuro: trocar por shadcn RadioGroup |
