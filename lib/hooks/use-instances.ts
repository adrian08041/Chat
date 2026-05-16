"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ConnectInstanceResult, WhatsAppInstance } from "@/types/instance";
import type { SyncJob } from "@/types/instance-sync";
import type { ContactScope } from "@/lib/uazapi";

export type { ContactScope };

export const INSTANCES_QUERY_KEY: QueryKey = ["instances"];

export function useInstances() {
  return useQuery({
    queryKey: INSTANCES_QUERY_KEY,
    queryFn: () => apiFetch<WhatsAppInstance[]>("/api/instances"),
    // Polling leve: enquanto houver instância em CONNECTING, refetch a cada 3s
    // pra refletir transição pra CONNECTED sem o usuário precisar reload.
    refetchInterval: (query) => {
      const data = query.state.data as WhatsAppInstance[] | undefined;
      return data?.some((i) => i.status === "CONNECTING") ? 3000 : false;
    },
  });
}

export function useInvalidateInstances() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEY });
}

export type CreateInstanceInput = {
  name: string;
  color?: string;
  msgDelayMin?: number;
  msgDelayMax?: number;
};

export function useCreateInstance() {
  const invalidate = useInvalidateInstances();
  return useMutation({
    mutationFn: (input: CreateInstanceInput) =>
      apiFetch<WhatsAppInstance>("/api/instances", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export type UpdateInstanceInput = {
  id: string;
  name?: string;
  color?: string;
  msgDelayMin?: number;
  msgDelayMax?: number;
  proxyUrl?: string | null;
};

export function useUpdateInstance() {
  const invalidate = useInvalidateInstances();
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateInstanceInput) =>
      apiFetch<WhatsAppInstance>(`/api/instances/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: invalidate,
  });
}

export function useConnectInstance() {
  const invalidate = useInvalidateInstances();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ConnectInstanceResult>(`/api/instances/${id}/connect`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

export function useDisconnectInstance() {
  const invalidate = useInvalidateInstances();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<WhatsAppInstance>(`/api/instances/${id}/disconnect`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteInstance() {
  const invalidate = useInvalidateInstances();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/instances/${id}`, {
        method: "DELETE",
      }),
    onSuccess: invalidate,
  });
}

// `enabled` opcional: por padrão a query só é habilitada quando há instanceId,
// mas o caller pode controlar pra evitar GET no mount inicial em cards onde
// o usuário ainda não interagiu (n cards = n GETs ociosos no /numeros).
export function useSyncContactsStatus(
  instanceId: string | null,
  options?: { enabled?: boolean },
) {
  const enabled = (options?.enabled ?? true) && instanceId !== null;
  return useQuery({
    queryKey: ["instances", instanceId, "sync-contacts"],
    queryFn: () =>
      apiFetch<{ job: SyncJob | null }>(
        `/api/instances/${instanceId}/sync-contacts`,
      ),
    enabled,
    // Polling 1.5s enquanto job estiver rodando; senão fica idle.
    refetchInterval: (query) => {
      const data = query.state.data as { job: SyncJob | null } | undefined;
      return data?.job?.status === "running" ? 1500 : false;
    },
    refetchIntervalInBackground: false,
  });
}

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
      // Atualiza cache do status imediatamente — UI já mostra running sem esperar polling.
      queryClient.setQueryData(["instances", instanceId, "sync-contacts"], {
        job: data.job,
      });
      // Invalida lista de contatos pra refletir importação assim que terminar
      // (o polling vai invalidar de novo no done).
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useCancelSyncContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) =>
      apiFetch<{ cancelled: boolean }>(
        `/api/instances/${instanceId}/sync-contacts`,
        { method: "DELETE" },
      ),
    onSuccess: (_data, instanceId) => {
      // Invalida o status pra refletir o cancel rapidamente — o polling pega
      // a transição running → cancelled no próximo tick também.
      queryClient.invalidateQueries({
        queryKey: ["instances", instanceId, "sync-contacts"],
      });
    },
  });
}

// Hook isolado: polling do /status de uma instância específica enquanto
// enabled=true. Usado durante o fluxo de QR pra detectar CONNECTED.
export function useInstanceStatus(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["instances", id, "status"],
    queryFn: () => apiFetch<WhatsAppInstance>(`/api/instances/${id}/status`),
    enabled: enabled && id !== null,
    refetchInterval: enabled ? 3000 : false,
    refetchIntervalInBackground: false,
  });
}
