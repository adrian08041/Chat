"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  Conversation,
  ConversationDetail,
  ConversationStatus,
} from "@/types/conversation";
import type { Message } from "@/types/message";
import type { InternalNote } from "@/types/note";

export const CONVERSATIONS_QUERY_KEY: QueryKey = ["conversations"];
const LIST_REFETCH_MS = 10_000;
const MESSAGES_REFETCH_MS = 10_000;

export type ConversationFilters = {
  status?: ConversationStatus;
  assignedUserId?: string | "me";
  instanceId?: string;
  search?: string;
};

type ConversationListResponse = {
  items: Conversation[];
  nextCursor: string | null;
};

function buildListUrl(filters: ConversationFilters): string {
  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.assignedUserId) qs.set("assignedUserId", filters.assignedUserId);
  if (filters.instanceId) qs.set("instanceId", filters.instanceId);
  if (filters.search) qs.set("search", filters.search);
  const query = qs.toString();
  return query ? `/api/conversations?${query}` : "/api/conversations";
}

export function useConversations(filters: ConversationFilters) {
  return useQuery({
    queryKey: [...CONVERSATIONS_QUERY_KEY, filters],
    queryFn: () => apiFetch<ConversationListResponse>(buildListUrl(filters)),
    // Polling leve enquanto não há real-time (passo 12).
    refetchInterval: LIST_REFETCH_MS,
    refetchIntervalInBackground: false,
  });
}

export function useConversationDetail(id: string | null) {
  return useQuery({
    queryKey: [...CONVERSATIONS_QUERY_KEY, id, "detail"],
    queryFn: () => apiFetch<ConversationDetail>(`/api/conversations/${id}`),
    enabled: id !== null,
  });
}

type MessagesResponse = {
  items: Message[];
  nextCursor: string | null;
};

export function useConversationMessages(id: string | null) {
  return useQuery({
    queryKey: [...CONVERSATIONS_QUERY_KEY, id, "messages"],
    queryFn: () =>
      apiFetch<MessagesResponse>(`/api/conversations/${id}/messages`),
    enabled: id !== null,
    refetchInterval: id !== null ? MESSAGES_REFETCH_MS : false,
    refetchIntervalInBackground: false,
  });
}

export function useInvalidateConversations() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) {
        throw new Error("Conversa não selecionada");
      }
      return apiFetch<Message>(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ type: "TEXT", content }),
        },
      );
    },
    onSuccess: () => {
      // Invalida tanto a lista (lastMessage atualiza) quanto as mensagens
      // da conversa aberta.
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      apiFetch<{ unreadCount: 0 }>(
        `/api/conversations/${conversationId}/read`,
        { method: "POST" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

type PatchConversationBody = {
  assignedUserId?: string | null;
  status?: "RESOLVED" | "REOPENED";
  tagIds?: string[];
};

function patchConversation(id: string, body: PatchConversationBody) {
  return apiFetch<ConversationDetail>(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { conversationId: string; assigneeId: string | null }) =>
      patchConversation(vars.conversationId, { assignedUserId: vars.assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useResolveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      patchConversation(conversationId, { status: "RESOLVED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useReopenConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      patchConversation(conversationId, { status: "REOPENED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useSetConversationTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { conversationId: string; tagIds: string[] }) =>
      patchConversation(vars.conversationId, { tagIds: vars.tagIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

// ============================================================================
// Notas internas — passo 15.
// ============================================================================

export function useConversationNotes(conversationId: string | null) {
  return useQuery({
    queryKey: [...CONVERSATIONS_QUERY_KEY, conversationId, "notes"],
    queryFn: () =>
      apiFetch<InternalNote[]>(`/api/conversations/${conversationId}/notes`),
    enabled: conversationId !== null,
  });
}

export function useAddNote(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) {
        throw new Error("Conversa não selecionada");
      }
      return apiFetch<InternalNote>(
        `/api/conversations/${conversationId}/notes`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...CONVERSATIONS_QUERY_KEY, conversationId, "notes"],
      });
    },
  });
}

export function useDeleteNote(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => {
      if (!conversationId) {
        throw new Error("Conversa não selecionada");
      }
      return apiFetch<{ deleted: boolean }>(
        `/api/conversations/${conversationId}/notes/${noteId}`,
        { method: "DELETE" },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...CONVERSATIONS_QUERY_KEY, conversationId, "notes"],
      });
    },
  });
}
