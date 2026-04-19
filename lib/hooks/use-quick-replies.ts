"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { QuickReply, QuickReplyCategory } from "@/types/quick-reply";

export const QUICK_REPLIES_QUERY_KEY: QueryKey = ["quick-replies"];

export function useQuickReplies() {
  return useQuery({
    queryKey: QUICK_REPLIES_QUERY_KEY,
    queryFn: () => apiFetch<QuickReply[]>("/api/quick-replies"),
  });
}

type UpsertPayload = {
  shortcut: string;
  title: string;
  content: string;
  category: QuickReplyCategory | string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
};

export function useCreateQuickReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertPayload) =>
      apiFetch<QuickReply>("/api/quick-replies", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUICK_REPLIES_QUERY_KEY });
    },
  });
}

export function useUpdateQuickReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<UpsertPayload>) => {
      const { id, ...body } = input;
      return apiFetch<QuickReply>(`/api/quick-replies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUICK_REPLIES_QUERY_KEY });
    },
  });
}

export function useDeleteQuickReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/quick-replies/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUICK_REPLIES_QUERY_KEY });
    },
  });
}
