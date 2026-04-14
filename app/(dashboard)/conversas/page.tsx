"use client";

import { ConversationList, ChatArea, ContactPanel } from "@/components/chat";
import { useConversationStore } from "@/stores/conversation-store";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_NOTES } from "@/lib/mock-data";

export default function ConversationsPage() {
  const { selectedConversationId } = useConversationStore();

  const selectedConversation = MOCK_CONVERSATIONS.find(
    (c) => c.id === selectedConversationId
  ) ?? null;

  const messages = selectedConversation
    ? MOCK_MESSAGES.filter((m) => m.conversationId === selectedConversation.id)
    : [];

  const contact = selectedConversation?.contact ?? null;

  const notes = selectedConversation
    ? MOCK_NOTES.filter((n) => n.conversationId === selectedConversation.id)
    : [];

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList conversations={MOCK_CONVERSATIONS} currentUserId="u1" />
      <ChatArea conversation={selectedConversation} messages={messages} />
      {selectedConversation && (
        <ContactPanel
          contact={contact}
          notes={notes}
          assigneeName={selectedConversation.assignedUser?.name}
        />
      )}
    </div>
  );
}
