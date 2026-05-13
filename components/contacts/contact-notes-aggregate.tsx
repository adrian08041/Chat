"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { formatRelativeTime } from "@/lib/format";
import type { ContactNoteItem } from "@/types/contact";

interface Props {
  notes: ContactNoteItem[];
}

export function ContactNotesAggregate({ notes }: Props) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <FileText className="w-8 h-8 text-txt-muted" />
        <p className="text-sm text-txt-muted">Nenhuma nota interna ainda</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((n) => (
        <li key={n.id} className="rounded-lg border border-border-subtle bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <AvatarInitials name={n.userName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-txt-primary">{n.userName}</span>
                <span className="text-xs text-txt-muted">{formatRelativeTime(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-txt-secondary whitespace-pre-wrap">{n.content}</p>
              <Link
                href={`/conversas?selected=${n.conversationId}`}
                className="mt-2 inline-block text-xs text-primary-600 hover:underline"
              >
                Ver conversa →
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
