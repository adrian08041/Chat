"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ConversationList, ChatArea, ContactPanel } from "@/components/chat";
import { useConversationStore } from "@/stores/conversation-store";
import { ApiClientError } from "@/lib/api-client";
import {
  useConversationDetail,
  useConversationMessages,
  useConversations,
  useMarkConversationRead,
  useSendMessage,
  type ConversationFilters,
} from "@/lib/hooks/use-conversations";
import type { ConversationStatus } from "@/types/conversation";

const SEARCH_DEBOUNCE_MS = 300;

type StoreFilter = "all" | "mine" | "unassigned" | "resolved";

function mapFilterToQuery(filter: StoreFilter): Partial<ConversationFilters> {
  switch (filter) {
    case "mine":
      return { assignedUserId: "me" };
    case "unassigned":
      return { status: "UNASSIGNED" as ConversationStatus };
    case "resolved":
      return { status: "RESOLVED" as ConversationStatus };
    case "all":
    default:
      return {};
  }
}

export default function ConversationsPage() {
  const { data: session } = useSession();
  const { selectedConversationId, activeFilter, searchTerm } =
    useConversationStore();

  // Debounce da busca pra não disparar fetch a cada keypress.
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filters = useMemo<ConversationFilters>(
    () => ({
      ...mapFilterToQuery(activeFilter),
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    }),
    [activeFilter, debouncedSearch],
  );

  const {
    data: listResult,
    isLoading: listLoading,
    error: listError,
  } = useConversations(filters);

  const conversations = useMemo(
    () => listResult?.items ?? [],
    [listResult?.items],
  );

  const { data: detail } = useConversationDetail(selectedConversationId);
  const { data: messagesResult } = useConversationMessages(selectedConversationId);

  // Backend retorna messages em ordem desc (newest first). UI exibe cronológica.
  const selectedMessages = useMemo(() => {
    if (!messagesResult) return [];
    return [...messagesResult.items].reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      contactId: detail?.contactId ?? "",
      direction: m.direction,
      type: m.type,
      content: m.content,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      status: m.status,
      whatsappMessageId: m.whatsappMessageId,
      sentByUserId: m.sentByUserId,
      createdAt: m.createdAt,
    }));
  }, [messagesResult, detail?.contactId]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    // Prefere o detail (mais campos); cai pra list item pra evitar flicker antes do detail chegar.
    if (detail && detail.id === selectedConversationId) return detail;
    return conversations.find((c) => c.id === selectedConversationId) ?? null;
  }, [detail, conversations, selectedConversationId]);

  const sendMutation = useSendMessage(selectedConversationId);
  const markReadMutation = useMarkConversationRead();

  // Marca como lida ao abrir uma conversa com unreadCount > 0.
  useEffect(() => {
    if (!selectedConversation || selectedConversation.unreadCount === 0) return;
    markReadMutation.mutate(selectedConversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, selectedConversation?.unreadCount]);

  const assigneeName = useMemo(() => {
    if (!selectedConversation?.assignedUserId) return "Não atribuído";
    // Passo 13.3 não busca nome de todos os usuários; se for o próprio user mostra "Você".
    if (selectedConversation.assignedUserId === session?.user?.id) {
      return session?.user?.name ?? "Você";
    }
    return "Atendente";
  }, [selectedConversation, session]);

  const contact = detail?.contactFull ?? null;

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!selectedConversationId) return;
      sendMutation.mutate(content, {
        onError: (err) => {
          const msg =
            err instanceof ApiClientError ? err.message : "Falha ao enviar";
          toast.error(msg);
        },
      });
    },
    [selectedConversationId, sendMutation],
  );

  const handleAddNote = useCallback(() => {
    toast.info("Notas internas ainda não disponíveis");
  }, []);

  const handleResolveConversation = useCallback(() => {
    toast.info("Resolver conversa ainda não disponível");
  }, []);

  const handleTransferConversation = useCallback(() => {
    toast.info("Transferir conversa ainda não disponível");
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        conversations={conversations}
        isLoading={listLoading}
        error={listError instanceof Error ? listError : null}
      />
      <ChatArea
        conversation={selectedConversation}
        messages={selectedMessages}
        assigneeName={assigneeName}
        onSendMessage={handleSendMessage}
      />
      {selectedConversation && (
        <ContactPanel
          contact={contact}
          notes={[]}
          assigneeName={assigneeName}
          assignedUserId={selectedConversation.assignedUserId}
          isResolved={selectedConversation.status === "RESOLVED"}
          onAddNote={handleAddNote}
          onResolveConversation={handleResolveConversation}
          onTransferConversation={handleTransferConversation}
        />
      )}
    </div>
  );
}
