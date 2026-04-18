"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ConnectInstanceResult, WhatsAppInstance } from "@/types/instance";

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
