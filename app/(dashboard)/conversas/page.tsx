"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ConversationList, ChatArea, ContactPanel } from "@/components/chat";
import { useConversationStore } from "@/stores/conversation-store";
import { ApiClientError } from "@/lib/api-client";
import {
  useAddNote,
  useAssignConversation,
  useConversationDetail,
  useConversationMessages,
  useConversationNotes,
  useConversations,
  useDeleteNote,
  useMarkConversationRead,
  useReopenConversation,
  useResolveConversation,
  useSendMessage,
  useSetConversationTags,
  type ConversationFilters,
  type SendMessagePayload,
} from "@/lib/hooks/use-conversations";
import { useTags } from "@/lib/hooks/use-tags";
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
    return [...messagesResult.items].reverse();
  }, [messagesResult]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    // Prefere o detail (mais campos); cai pra list item pra evitar flicker antes do detail chegar.
    if (detail && detail.id === selectedConversationId) return detail;
    return conversations.find((c) => c.id === selectedConversationId) ?? null;
  }, [detail, conversations, selectedConversationId]);

  const sendMutation = useSendMessage(selectedConversationId);
  const markReadMutation = useMarkConversationRead();
  const assignMutation = useAssignConversation();
  const resolveMutation = useResolveConversation();
  const reopenMutation = useReopenConversation();
  const addNoteMutation = useAddNote(selectedConversationId);
  const deleteNoteMutation = useDeleteNote(selectedConversationId);
  const setTagsMutation = useSetConversationTags();
  const {
    data: notes = [],
    isLoading: notesLoading,
    error: notesError,
  } = useConversationNotes(selectedConversationId);
  const { data: allTags = [], isLoading: allTagsLoading } = useTags();

  // Marca como lida ao abrir uma conversa com unreadCount > 0.
  useEffect(() => {
    if (!selectedConversation || selectedConversation.unreadCount === 0) return;
    markReadMutation.mutate(selectedConversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, selectedConversation?.unreadCount]);

  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;

  const assigneeName = useMemo(() => {
    if (!selectedConversation?.assignedUserId) return "Não atribuído";
    if (selectedConversation.assignedUserId === currentUserId) {
      return session?.user?.name ?? "Você";
    }
    return selectedConversation.assignedUser?.name ?? "Atendente";
  }, [selectedConversation, currentUserId, session]);

  const contact = detail?.contactFull ?? null;

  const isManager = currentUserRole === "ADMIN" || currentUserRole === "SUPERVISOR";
  const isSelfAssigned =
    !!currentUserId && selectedConversation?.assignedUserId === currentUserId;
  const canAssumeSelf =
    !!selectedConversation &&
    !isSelfAssigned &&
    selectedConversation.status !== "RESOLVED" &&
    // AGENT só assume UNASSIGNED; gerentes podem assumir a qualquer momento.
    (isManager || selectedConversation.assignedUserId === null);
  const canTransfer = isManager && !!selectedConversation;
  const isMutating =
    assignMutation.isPending ||
    resolveMutation.isPending ||
    reopenMutation.isPending;

  const handleSendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!selectedConversationId) return;
      try {
        await sendMutation.mutateAsync(payload);
      } catch (err) {
        const msg =
          err instanceof ApiClientError ? err.message : "Falha ao enviar";
        toast.error(msg);
        // Re-throw para o caller (MediaPreviewDialog) saber que falhou
        // e não fechar — assim o usuário pode reenviar sem re-upload.
        throw err;
      }
    },
    [selectedConversationId, sendMutation],
  );

  const handleAddNote = useCallback(
    (content: string) => {
      if (!selectedConversationId) return;
      addNoteMutation.mutate(content, {
        onSuccess: () => toast.success("Nota adicionada"),
        onError: (err) =>
          toast.error(
            err instanceof ApiClientError ? err.message : "Falha ao adicionar nota",
          ),
      });
    },
    [selectedConversationId, addNoteMutation],
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      if (!selectedConversationId) return;
      deleteNoteMutation.mutate(noteId, {
        onSuccess: () => toast.success("Nota excluída"),
        onError: (err) =>
          toast.error(
            err instanceof ApiClientError ? err.message : "Falha ao excluir nota",
          ),
      });
    },
    [selectedConversationId, deleteNoteMutation],
  );

  const handleSetTags = useCallback(
    (tagIds: string[]) => {
      if (!selectedConversationId) return;
      setTagsMutation.mutate(
        { conversationId: selectedConversationId, tagIds },
        {
          onError: (err) =>
            toast.error(
              err instanceof ApiClientError ? err.message : "Falha ao atualizar tags",
            ),
        },
      );
    },
    [selectedConversationId, setTagsMutation],
  );

  const handleAssumeConversation = useCallback(() => {
    if (!selectedConversationId || !currentUserId) return;
    assignMutation.mutate(
      { conversationId: selectedConversationId, assigneeId: currentUserId },
      {
        onSuccess: () => toast.success("Você assumiu a conversa"),
        onError: (err) =>
          toast.error(
            err instanceof ApiClientError ? err.message : "Falha ao atribuir",
          ),
      },
    );
  }, [selectedConversationId, currentUserId, assignMutation]);

  const handleResolveConversation = useCallback(() => {
    if (!selectedConversationId) return;
    resolveMutation.mutate(selectedConversationId, {
      onSuccess: () => toast.success("Conversa resolvida"),
      onError: (err) =>
        toast.error(
          err instanceof ApiClientError ? err.message : "Falha ao resolver",
        ),
    });
  }, [selectedConversationId, resolveMutation]);

  const handleReopenConversation = useCallback(() => {
    if (!selectedConversationId) return;
    reopenMutation.mutate(selectedConversationId, {
      onSuccess: () => toast.success("Conversa reaberta"),
      onError: (err) =>
        toast.error(
          err instanceof ApiClientError ? err.message : "Falha ao reabrir",
        ),
    });
  }, [selectedConversationId, reopenMutation]);

  const handleTransferConversation = useCallback(
    (agentId: string) => {
      if (!selectedConversationId) return;
      assignMutation.mutate(
        { conversationId: selectedConversationId, assigneeId: agentId },
        {
          onSuccess: () => toast.success("Conversa transferida"),
          onError: (err) =>
            toast.error(
              err instanceof ApiClientError ? err.message : "Falha ao transferir",
            ),
        },
      );
    },
    [selectedConversationId, assignMutation],
  );

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
          notes={notes}
          notesLoading={notesLoading}
          notesError={notesError instanceof Error ? notesError.message : null}
          isAddingNote={addNoteMutation.isPending}
          currentUserId={currentUserId ?? null}
          isManager={isManager}
          conversationTags={detail?.tags ?? []}
          allTags={allTags}
          allTagsLoading={allTagsLoading}
          canEditTags={isManager || isSelfAssigned}
          onSetTags={handleSetTags}
          assigneeName={assigneeName}
          assignedUserId={selectedConversation.assignedUserId}
          isResolved={selectedConversation.status === "RESOLVED"}
          canTransfer={canTransfer}
          canAssumeSelf={canAssumeSelf}
          isMutating={isMutating}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onAssumeConversation={handleAssumeConversation}
          onResolveConversation={handleResolveConversation}
          onReopenConversation={handleReopenConversation}
          onTransferConversation={handleTransferConversation}
        />
      )}
    </div>
  );
}
