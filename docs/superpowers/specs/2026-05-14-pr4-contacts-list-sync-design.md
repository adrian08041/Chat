# PR #4 — Sync complementar via `POST /contacts/list`

**Data:** 2026-05-14
**Status:** Design aprovado, aguardando plano de implementação
**Branch base:** `main` (HEAD `5e5c7c5` após commit do PR #5)
**Relacionado:** complementa PR #3 (`5e5c7c5`)

## 1. Contexto

O sync atual de contatos (`instance-sync.service.ts`, introduzido no PR #3) usa
apenas `POST /chat/find` da UazApi, que retorna **só contatos com conversa
existente**. Leads que estão salvos no celular do usuário mas nunca escreveram
para a instância ficam de fora.

`POST /contacts/list` resolve esse gap: retorna a agenda do aparelho paginada,
incluindo contatos sem conversa. Payload é mais leve (jid + nome, sem avatar /
lastMsg), mas cobre o universo restante.

## 2. Decisões de produto

Fechadas no brainstorm de 2026-05-14:

| Tema | Decisão |
|---|---|
| Integração com sync atual | **Fase 2 do mesmo job**, mesmo botão, uma confirmação |
| `contactScope` | **Toggle no ConfirmDialog**: `address_book` (default) ou `all` |
| Avatar para contatos novos vindos só da agenda | **Aceitar sem avatar** — preenche quando alguém conversar e o próximo sync `/chat/find` rodar |
| Erro na fase 2 após fase 1 OK | Status final `done` com campo `warning` preenchido |
| Progresso na UI | Texto muda por fase (`"Importando conversas..."` → `"Importando agenda..."`), barra agregada contínua |

Decisões herdadas do PR #3 (continuam valendo):
- Polling pra progress (não SSE)
- Nome só preenche se vazio (`upsertContactFromInbound` preserva edição manual)
- Qualquer role do workspace pode disparar (não só ADMIN)
- Idempotência por `workspaceId:instanceId`
- Sem `publish` no fim do sync

## 3. Escopo

**Entra:**
- Extensão do contrato UazApi com `listContacts`.
- Refatoração do `runJob` em duas fases sequenciais.
- Toggle de `contactScope` no ConfirmDialog.
- Contadores granulares por fase no `SyncJob` público.
- Texto do progress trocando por `job.phase`.
- Toast final agregado com contagem por fase.

**Não entra:**
- Fetch de avatar via `/chat/details` para contatos da agenda.
- Job separado / botão separado.
- Refactor do sync existente além do necessário pra encadear a fase 2.
- Alterações em `/contatos` (lista ou perfil).
- Sync bidirecional (`/contact/add`, `/contact/remove`) — fica para depois.

## 4. Contrato UazApi (extensão)

Em `lib/uazapi.ts`:

```ts
export type ContactScope = "address_book" | "outside_address_book" | "all";

export interface ListContactsParams {
  limit: number;   // <= 1000
  offset: number;
  contactScope: ContactScope;
}

export interface UazApiAddressBookContact {
  jid: string;
  contact_name: string | null;
  contact_FirstName: string | null;
}
// Nota: os nomes dos campos refletem o schema documentado da UazApi
// (`contact_name`, `contact_FirstName`). Durante a implementação, validar
// com response real (logar uma página em dev) — se houver divergência de
// casing/nome, mapear no HTTP client em vez de propagar pro contrato.

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

Acrescentar ao `UazApiClient`:

```ts
listContacts(
  creds: UazApiInstanceCredentials,
  params: ListContactsParams,
): Promise<ListContactsResult>;
```

Implementação em `lib/uazapi/http.ts`: `POST /contacts/list` com body
`{ limit, offset, contactScope }`. Erros 4xx/5xx lançam `UazApiError` (padrão
existente).

## 5. Modelo de job

Em `types/instance-sync.ts`:

```ts
export type SyncJobStatus = "running" | "done" | "error" | "cancelled";
export type SyncPhase = "chats" | "address_book";

export interface SyncJob {
  id: string;
  workspaceId: string;
  instanceId: string;
  status: SyncJobStatus;
  phase: SyncPhase;                  // NOVO

  // Agregados (chats + agenda)
  fetched: number;
  total: number;
  imported: number;
  updated: number;
  skipped: number;

  // Granulares por fase
  chatsImported: number;             // NOVO
  chatsUpdated: number;              // NOVO
  addressBookImported: number;       // NOVO
  addressBookUpdated: number;        // NOVO

  // Aviso de falha parcial: status=done + warning != null
  warning: string | null;            // NOVO

  contactScope: ContactScope;        // NOVO — ecoado do start
  startedAt: number;
  finishedAt: number | null;
  errorMessage: string | null;
}
```

Notas:
- `imported`/`updated` continuam sendo soma dos granulares (recomputados a cada
  upsert). Mantidos pra back-compat e cálculos rápidos.
- `warning` separado de `errorMessage`: `status === "done"` + `warning != null`
  significa "completou com aviso", não "falhou".
- `phase` é exposto no contrato público pra UI trocar o texto sem adivinhar.

## 6. Service: refatoração do `runJob`

`lib/services/instance-sync.service.ts` decompõe o loop atual em duas funções
privadas + orquestrador:

```ts
async function runChatsPhase(
  job: InternalSyncJob,
  creds: UazApiInstanceCredentials,
  client: UazApiClient,
): Promise<void>;

async function runAddressBookPhase(
  job: InternalSyncJob,
  creds: UazApiInstanceCredentials,
  client: UazApiClient,
): Promise<void>;

async function runJob(
  job: InternalSyncJob,
  creds: UazApiInstanceCredentials,
): Promise<void> {
  const client = getUazApiClient();
  const key = jobKey(job.workspaceId, job.instanceId);
  try {
    job.phase = "chats";
    await runChatsPhase(job, creds, client);
    if (job.cancelled) {
      job.status = "cancelled";
      return;
    }

    job.phase = "address_book";
    try {
      await runAddressBookPhase(job, creds, client);
    } catch (phase2Err) {
      const msg = phase2Err instanceof Error
        ? phase2Err.message
        : String(phase2Err);
      job.warning = `Falhei ao importar agenda: ${msg}`;
      console.warn(`[instance-sync] phase2 failed (degraded done)`, phase2Err);
    }

    job.status = job.cancelled ? "cancelled" : "done";
  } catch (err) {
    job.status = "error";
    job.errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[instance-sync] FAIL`, err);
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

### 6.1 `runChatsPhase` (comportamento atual, ajustado)

- Loop idêntico ao atual paginando `client.listChats(creds, { limit, offset, sort: "-wa_lastMsgTimestamp" })`.
- Cada upsert que retorna `created` incrementa `chatsImported`; senão
  `chatsUpdated`. Os agregados `imported`/`updated` são recalculados após cada
  upsert: `job.imported = job.chatsImported + job.addressBookImported`.
- `total` segue lógica atual (vem de `pagination.totalRecords` da fase 1).
- Cancel-checks entre páginas e entre upserts (mesmo padrão atual).

### 6.2 `runAddressBookPhase`

Loop análogo paginando
`client.listContacts(creds, { limit: 500, offset, contactScope: job.contactScope })`.

Para cada contato:

1. `phone = stripJidSuffix(contact.jid)`. Se vazio → `skipped++`, continua.
2. Se `jid` termina em `@g.us` → `skipped++`, continua (grupo).
3. `fallbackName = contact.contact_name ?? contact.contact_FirstName ?? null`.
4. `upsertContactFromInbound({ workspaceId, phone, fallbackName, avatarUrl: null })`.
5. Se `created` → `addressBookImported++`. Senão `addressBookUpdated++`.
   Recomputa `imported`/`updated`.
6. Quando `pagination.totalRecords > 0` na primeira página, atualiza
   `job.total = chatsTotalSnapshot + result.pagination.totalRecords` (somando
   o total final da fase 1). O snapshot é tirado uma vez ao entrar em
   `runAddressBookPhase` (`const chatsTotalSnapshot = job.total`) antes do
   primeiro write em `job.total`.
7. Cancel-checks idênticos à fase 1.
8. Critério de parada idêntico: `result.contacts.length < PAGE_SIZE` ou
   `fetched >= totalRecords`.

### 6.3 Mudanças em `startSyncContacts`

- Assinatura aceita `contactScope: ContactScope` (default `"address_book"`).
- Persiste em `job.contactScope`.
- Idempotência inalterada: se já tem job running pra mesma `workspaceId:instanceId`,
  retorna `{ job, alreadyRunning: true }` mesmo se o `contactScope` pedido for
  diferente do em curso. **Não troca scope no meio do caminho.**

### 6.4 Page size

- Fase 1: continua `PAGE_SIZE_CHATS = 200` (renomear o `PAGE_SIZE` atual).
- Fase 2: `PAGE_SIZE_CONTACTS = 500` (endpoint aceita até 1000; 500 equilibra
  latência por chamada e número de chamadas).

Ambas como constantes no topo do arquivo, simétricas.

## 7. API

`app/api/instances/[id]/sync-contacts/route.ts`:

- **`POST`** aceita body opcional `{ contactScope?: "address_book" | "all" }`,
  validado com zod. Default `"address_book"`. Valor inválido → **422 "Dados
  inválidos"** com `details` (convenção do projeto via `handleRouteError`,
  `lib/api-utils.ts:49-50`). Passa pro `startSyncContacts`.
- **`GET`** e **`DELETE`** inalterados.

Embora `ContactScope` no service permita `"outside_address_book"`, a API só
expõe `"address_book" | "all"` (as duas opções do toggle). O terceiro valor
fica reservado pra evolução futura sem precisar mexer no contrato HTTP.

## 8. Hook

`lib/hooks/use-instances.ts`:

- `useStartSyncContacts` muda de `useMutation<_, _, string>` para
  `useMutation<_, _, { instanceId: string; contactScope: ContactScope }>`.
- `useSyncContactsStatus` e `useCancelSyncContacts` inalterados.
- Exporta `ContactScope` pra UI usar.

## 9. UI

`components/numbers/numbers-content.tsx` — `SyncContactsRow`:

### 9.1 Estado e ConfirmDialog

- Novo state local `scope: ContactScope` (default `"address_book"`).
- `ConfirmDialog.description` ganha um bloco com dois radios (ou Select shadcn):

  **"O que importar?"**

  - **Só contatos salvos** (default) — *"Inclui apenas quem você salvou na agenda do celular."*
  - **Todos os contatos** — *"Inclui também números não-salvos (de grupos, etc.). Pode importar muito mais."*

- `handleConfirmStart` passa `{ instanceId, contactScope: scope }` na mutation.

### 9.2 Progress durante o sync

Texto por `job.phase`:

| Fase | Texto |
|---|---|
| `chats` | `"Importando conversas... {fetched}/{total}"` |
| `address_book` | `"Importando agenda... {fetched}/{total}"` |

Barra agregada usa `Math.min(100, Math.round((fetched / total) * 100))` — já
existente.

### 9.3 Toast final

Transições terminais (detectadas pelo `useEffect` com `prevStatusRef`):

- **`done` + `warning == null`:**
  `"Importação concluída: X conversas + Y da agenda · Z atualizados"`
  — se `addressBookImported === 0`, omite "+ Y da agenda".

- **`done` + `warning != null`:** mesma string de contagem do caso sem warning
  como título do `toast.success`, e `description: warning` (campo do sonner).

- **`cancelled`:** preserva comportamento atual, usando contagens agregadas.

- **`error`:** preserva comportamento atual (`toast.error` com `errorMessage`).

## 10. Edge cases

1. **POST concorrente com scope diferente:** retorna job atual com
   `alreadyRunning: true`. Scope original é mantido.
2. **Cancel durante fase 2:** fase 1 commitada, status final `cancelled` com
   contagens parciais agregadas.
3. **`/contacts/list` retorna 4xx/5xx:** entra no try interno, vira `warning`
   + status `done`. Log via `console.warn`.
4. **`/chat/find` falha (fase 1):** comportamento atual — status `error`, fase
   2 nem roda.
5. **Phone vazio / grupo / jid malformado:** `skipped++`, loop continua.
6. **`total` cresce no meio do caminho:** ao iniciar fase 2 e descobrir
   `pagination.totalRecords`, `job.total` aumenta. Barra recua proporcionalmente.
   Trade-off aceito; alternativa (pre-fetch da fase 2 só pra calcular total)
   não vale.
7. **`contactScope` inválido na API:** zod rejeita com 422 antes do service.
8. **Job em terminal state ainda no TTL:** novo POST inicia novo job
   (substitui no Map). Comportamento atual preservado.

## 11. Verificação (antes de marcar como done)

O projeto **não tem framework de testes** configurado (padrão dos PRs #1-#5).
A verificação é manual + estática:

**Estática (obrigatório, bloqueia commit):**
- `npx tsc --noEmit` limpo
- `npm run lint` limpo

**Manual (smoke + casos críticos):**

- Disparar sync em instância com agenda real, conferir as duas fases no
  progress bar (texto muda entre "conversas" e "agenda").
- Disparar com toggle `Todos` → conferir que contatos sem `contact_name`
  aparecem com placeholder de telefone.
- Forçar 500 no `/contacts/list` (parar a instância UazApi entre fases ou
  ajustar URL em dev) → conferir warning no toast final + status `done`.
- Cancelar durante fase 2 → conferir contagens parciais e status `cancelled`.
- POST com body `{ contactScope: "lixo" }` via curl → conferir 422 com `details`.
- POST duplicado com scope diferente durante job em curso → conferir
  `alreadyRunning: true` e scope original mantido.

## 12. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Fase 2 muito demorada em agendas grandes (milhares de contatos) | Page size 500, cancel disponível, progress visível. Se virar reclamação, ajusta page size ou paraleliza. |
| Usuário com toggle `Todos` importa muito ruído de grupos | Copy do toggle explica o trade-off; default conservador (`address_book`). |
| Cresce inesperado do `total` ao entrar na fase 2 confunde o usuário | Texto da fase muda junto — "Importando agenda..." sinaliza nova fase visualmente. |
| `/contacts/list` indisponível na UazApi | Fase 2 falha vira `done` + warning; usuário ainda recebe o sync da fase 1. |
