"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Notification } from "@/types/notification";

export const NOTIFICATIONS_QUERY_KEY: QueryKey = ["notifications"];

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () =>
      apiFetch<NotificationsResponse>("/api/notifications"),
  });
}

// Update otimista: marca lida no cache na hora; rollback no onError.
// Contrato do caller: invocar APENAS quando notification.read === false.
// O decremento de unreadCount é incondicional (Math.max só evita negativo) —
// chamar em notificação já lida deixa o cache stale até a próxima invalidação
// por SSE/remount.
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string; read: boolean }>(
        `/api/notifications/${id}`,
        { method: "PATCH" },
      ),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const prev = queryClient.getQueryData<NotificationsResponse>(
        NOTIFICATIONS_QUERY_KEY,
      );
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(
          NOTIFICATIONS_QUERY_KEY,
          {
            notifications: prev.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          },
        );
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.prev);
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ updated: number }>(
        "/api/notifications/read-all",
        { method: "POST" },
      ),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const prev = queryClient.getQueryData<NotificationsResponse>(
        NOTIFICATIONS_QUERY_KEY,
      );
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(
          NOTIFICATIONS_QUERY_KEY,
          {
            notifications: prev.notifications.map((n) => ({
              ...n,
              read: true,
            })),
            unreadCount: 0,
          },
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.prev);
      }
    },
  });
}
