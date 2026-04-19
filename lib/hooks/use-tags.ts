"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Tag, TagColor } from "@/types/tag";

export const TAGS_QUERY_KEY: QueryKey = ["tags"];

export function useTags() {
  return useQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: () => apiFetch<Tag[]>("/api/tags"),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color: TagColor }) =>
      apiFetch<Tag>("/api/tags", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; color?: TagColor }) => {
      const { id, ...body } = input;
      return apiFetch<Tag>(`/api/tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      // Tags de conversa re-renderizam quando a tag em si é editada —
      // invalida detail pra refletir nome/cor novos.
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      // Tag removida cascateia em conversations; força refetch.
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
