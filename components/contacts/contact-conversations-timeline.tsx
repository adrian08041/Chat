"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import type { ContactConversationItem } from "@/types/contact";

const STATUS_LABEL: Record<ContactConversationItem["status"], string> = {
  UNASSIGNED: "Não atribuída",
  OPEN: "Aberta",
  WAITING_CUSTOMER: "Aguardando cliente",
  RESOLVED: "Resolvida",
  REOPENED: "Reaberta",
};

interface Props {
  conversations: ContactConversationItem[];
}

export function ContactConversationsTimeline({ conversations }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <MessageSquare className="w-8 h-8 text-txt-muted" />
        <p className="text-sm text-txt-muted">Nenhuma conversa ainda</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/conversas?selected=${c.id}`}
            className="block rounded-lg border border-border-subtle bg-surface-card p-4 hover:border-border-default hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.instanceColor }}
                />
                <span className="text-sm font-medium text-txt-primary truncate">
                  {c.instanceName}
                </span>
                <span className="text-xs text-txt-muted flex-shrink-0">
                  · {STATUS_LABEL[c.status]}
                </span>
              </div>
              <span className="text-xs text-txt-muted flex-shrink-0">
                {c.lastMessageAt
                  ? formatRelativeTime(c.lastMessageAt)
                  : formatRelativeTime(c.createdAt)}
              </span>
            </div>
            {c.lastMessage?.content && (
              <p className="mt-2 text-sm text-txt-secondary line-clamp-2">
                {c.lastMessage.direction === "OUTBOUND" ? "Você: " : ""}
                {c.lastMessage.content}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-txt-muted">
              <span>
                {c.messagesCount} {c.messagesCount === 1 ? "mensagem" : "mensagens"}
              </span>
              {c.assignedUserName && <span>· {c.assignedUserName}</span>}
              {c.unreadCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-primary-600 text-txt-on-primary text-[10px] font-semibold">
                  {c.unreadCount} não lidas
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
