"use client";

import { useCallback, useMemo, useState } from "react";
import { ConversationList, ChatArea, ContactPanel } from "@/components/chat";
import { useConversationStore } from "@/stores/conversation-store";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_NOTES,
  MOCK_AGENTS,
  CURRENT_USER,
} from "@/lib/mock-data";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import type { InternalNote } from "@/types/note";

const PREVIEW_MAX = 60;

function truncatePreview(content: string): string {
  return content.length > PREVIEW_MAX
    ? `${content.slice(0, PREVIEW_MAX - 3)}...`
    : content;
}

export default function ConversationsPage() {
  const { selectedConversationId } = useConversationStore();

  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [notes, setNotes] = useState<InternalNote[]>(MOCK_NOTES);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const selectedMessages = useMemo(
    () =>
      selectedConversation
        ? messages.filter((m) => m.conversationId === selectedConversation.id)
        : [],
    [messages, selectedConversation]
  );

  const selectedNotes = useMemo(
    () =>
      selectedConversation
        ? notes.filter((n) => n.conversationId === selectedConversation.id)
        : [],
    [notes, selectedConversation]
  );

  const assigneeName = useMemo(() => {
    if (!selectedConversation?.assignedUserId) return "Não atribuído";
    const agent = MOCK_AGENTS.find((a) => a.id === selectedConversation.assignedUserId);
    return agent?.name ?? "Não atribuído";
  }, [selectedConversation]);

  const contact = selectedConversation?.contact ?? null;

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!selectedConversation) return;
      const now = new Date().toISOString();
      const newMessage: Message = {
        id: `m-${Date.now()}`,
        conversationId: selectedConversation.id,
        contactId: selectedConversation.contactId,
        direction: "OUTBOUND",
        type: "TEXT",
        content,
        mediaUrl: null,
        mediaType: null,
        status: "SENT",
        whatsappMessageId: null,
        sentByUserId: CURRENT_USER.id,
        createdAt: now,
      };
      setMessages((prev) => [...prev, newMessage]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, lastMessageAt: now, lastMessagePreview: truncatePreview(content) }
            : c
        )
      );
    },
    [selectedConversation]
  );

  const handleAddNote = useCallback(
    (content: string) => {
      if (!selectedConversation) return;
      const now = new Date().toISOString();
      const newNote: InternalNote = {
        id: `n-${Date.now()}`,
        conversationId: selectedConversation.id,
        userId: CURRENT_USER.id,
        userName: CURRENT_USER.name,
        content,
        createdAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
    },
    [selectedConversation]
  );

  const handleResolveConversation = useCallback(() => {
    if (!selectedConversation) return;
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, status: "RESOLVED", resolvedAt: now }
          : c
      )
    );
  }, [selectedConversation]);

  const handleTransferConversation = useCallback(
    (agentId: string) => {
      if (!selectedConversation) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id ? { ...c, assignedUserId: agentId } : c
        )
      );
    },
    [selectedConversation]
  );

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList conversations={conversations} currentUserId={CURRENT_USER.id} />
      <ChatArea
        conversation={selectedConversation}
        messages={selectedMessages}
        assigneeName={assigneeName}
        onSendMessage={handleSendMessage}
      />
      {selectedConversation && (
        <ContactPanel
          contact={contact}
          notes={selectedNotes}
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
