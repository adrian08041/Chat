"use client";

// Passo 12 — real-time via SSE. Conecta em /api/realtime, escuta eventos
// emitidos por services (message.service, conversation.service, etc.) e
// invalida React Query keys de forma surgical pra evitar refetch em cascata.
//
// EventSource nativo reconecta sozinho em queda (backoff do browser).
// Em dev (Strict Mode), o cleanup do useEffect fecha a conexão antiga antes
// de criar a nova — comportamento esperado.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CONVERSATIONS_QUERY_KEY } from "./use-conversations";
import { INSTANCES_QUERY_KEY } from "./use-instances";

type ConversationVisibility = {
  assignedUserId: string | null;
  previousAssignedUserId?: string | null;
};

type RealtimeEventPayload =
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

export function useRealtime(enabled: boolean = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const source = new EventSource("/api/realtime");

    const handleEvent = (rawData: string) => {
      let event: RealtimeEventPayload;
      try {
        event = JSON.parse(rawData) as RealtimeEventPayload;
      } catch {
        return;
      }

      // Invalidação surgical — mirar subkeys específicas evita refetch
      // desnecessário de notes/tags/detail quando só chegou mensagem nova.
      switch (event.type) {
        case "message:created":
          queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
          queryClient.invalidateQueries({
            queryKey: [...CONVERSATIONS_QUERY_KEY, event.conversationId, "messages"],
          });
          break;
        case "message:updated":
          // Só checkmarks/status mudam — basta refetchar messages da convo,
          // lista já tem lastMessage igual.
          queryClient.invalidateQueries({
            queryKey: [...CONVERSATIONS_QUERY_KEY, event.conversationId, "messages"],
          });
          break;
        case "conversation:updated":
          queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
          queryClient.invalidateQueries({
            queryKey: [...CONVERSATIONS_QUERY_KEY, event.conversationId, "detail"],
          });
          queryClient.invalidateQueries({
            queryKey: [...CONVERSATIONS_QUERY_KEY, event.conversationId, "notes"],
          });
          break;
        case "instance:updated":
          queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEY });
          break;
      }
    };

    const typedHandler = (e: MessageEvent) => handleEvent(e.data);
    source.addEventListener("message:created", typedHandler);
    source.addEventListener("message:updated", typedHandler);
    source.addEventListener("conversation:updated", typedHandler);
    source.addEventListener("instance:updated", typedHandler);

    source.onerror = () => {
      // Se o EventSource não conseguiu reconectar (401 por sessão expirada,
      // server down, etc.), `readyState=CLOSED`. Browser NÃO para retry
      // automaticamente — segue tentando pra sempre. `source.close()` explícito
      // encerra o loop; próxima navegação HTTP vai detectar a sessão inválida
      // e redirecionar pro login.
      if (source.readyState === EventSource.CLOSED) {
        console.warn("[realtime] connection closed — stopping reconnect attempts");
        source.close();
      }
    };

    return () => {
      source.close();
    };
  }, [enabled, queryClient]);
}
