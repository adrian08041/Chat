// Realtime — pub/sub in-memory pra SSE (passo 12 do Backend Plan).
// Broadcast escopado por workspaceId + filtragem por role/assignee no
// subscriber. Fanout O(N) em subscribers do workspace; filter é O(1).
//
// Limites conhecidos:
//   - Em memória → não sobrevive multi-instância. Pra scale horizontal,
//     trocar por Redis pub/sub mantendo esta interface.
//   - Publicação é fire-and-forget — erro num subscriber não afeta outros.
//   - Filtro atual cobre `conversation:updated` e `message:updated`; os outros
//     (message:created, instance:updated) ficam workspace-wide por escolha
//     (message:created em UNASSIGNED precisa atingir todos os AGENTs).

import type { UserRole } from "@prisma/client";

export type ConversationVisibility = {
  // Assignee atual. `null` → conversa UNASSIGNED (todos AGENTs veem).
  assignedUserId: string | null;
  // Assignee anterior (só em transferências/resolve/etc). Se igual ao atual ou
  // omitido, apenas `assignedUserId` vale.
  previousAssignedUserId?: string | null;
};

export type RealtimeEvent =
  | {
      type: "message:created";
      conversationId: string;
      visibility: ConversationVisibility;
    }
  | {
      type: "message:updated";
      conversationId: string;
      messageId: string;
      visibility: ConversationVisibility;
    }
  | {
      type: "conversation:updated";
      conversationId: string;
      visibility: ConversationVisibility;
    }
  | { type: "instance:updated"; instanceId: string };

export type SubscriberIdentity = {
  userId: string;
  role: UserRole;
};

export type RealtimeSubscriber = (event: RealtimeEvent) => void;

type SubscriberRecord = {
  identity: SubscriberIdentity;
  handler: RealtimeSubscriber;
};

type WorkspaceBus = Set<SubscriberRecord>;

const buses = new Map<string, WorkspaceBus>();

function getBus(workspaceId: string): WorkspaceBus {
  let bus = buses.get(workspaceId);
  if (!bus) {
    bus = new Set();
    buses.set(workspaceId, bus);
  }
  return bus;
}

// Manager (ADMIN/SUPERVISOR) vê tudo; AGENT só se é/era assignee ou se convo
// está/estava UNASSIGNED. Eventos sem `visibility` (message:created, instance)
// passam direto — filtragem acontece via API filtering no refetch.
function canSee(identity: SubscriberIdentity, event: RealtimeEvent): boolean {
  if (identity.role !== "AGENT") return true;
  if (!("visibility" in event)) return true;
  const v = event.visibility;
  if (v.assignedUserId === null) return true;
  if (v.assignedUserId === identity.userId) return true;
  if (v.previousAssignedUserId === null) return true;
  if (v.previousAssignedUserId === identity.userId) return true;
  return false;
}

export function subscribe(
  workspaceId: string,
  identity: SubscriberIdentity,
  handler: RealtimeSubscriber,
): () => void {
  const bus = getBus(workspaceId);
  const record: SubscriberRecord = { identity, handler };
  bus.add(record);
  console.info(
    `[realtime] subscribe workspace=${workspaceId} user=${identity.userId} total=${bus.size}`,
  );
  return () => {
    bus.delete(record);
    if (bus.size === 0) buses.delete(workspaceId);
  };
}

export function publish(workspaceId: string, event: RealtimeEvent): void {
  const bus = buses.get(workspaceId);
  if (!bus) return;
  let delivered = 0;
  for (const record of bus) {
    if (!canSee(record.identity, event)) continue;
    try {
      record.handler(event);
      delivered += 1;
    } catch (err) {
      // Um subscriber com erro não pode derrubar os outros.
      console.error("[realtime] subscriber failed:", err);
    }
  }
  console.info(
    `[realtime] publish workspace=${workspaceId} type=${event.type} delivered=${delivered}/${bus.size}`,
  );
}

// Diagnóstico — útil pra health check / debug endpoints.
export function getSubscriberCount(workspaceId: string): number {
  return buses.get(workspaceId)?.size ?? 0;
}
