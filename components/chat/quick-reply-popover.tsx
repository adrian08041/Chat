"use client";

import { useEffect, useRef } from "react";
import { ImageIcon } from "lucide-react";
import type { QuickReply } from "@/types/quick-reply";

interface QuickReplyPopoverProps {
  listboxId: string;
  optionIdPrefix: string;
  matches: QuickReply[];
  activeIndex: number;
  onSelect: (reply: QuickReply) => void;
  onHoverIndex: (index: number) => void;
}

export function QuickReplyPopover({
  listboxId,
  optionIdPrefix,
  matches,
  activeIndex,
  onSelect,
  onHoverIndex,
}: QuickReplyPopoverProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (matches.length === 0) return null;

  return (
    <div
      id={listboxId}
      role="listbox"
      aria-label="Respostas rápidas disponíveis"
      className="absolute bottom-full mb-2 left-0 right-0 bg-surface-card rounded-xl border border-border-default shadow-lg overflow-hidden max-h-64 overflow-y-auto z-10"
    >
      {matches.map((reply, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={reply.id}
            id={`${optionIdPrefix}-${i}`}
            ref={isActive ? activeRef : null}
            role="option"
            aria-selected={isActive}
            onMouseEnter={() => onHoverIndex(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(reply);
            }}
            className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ${
              isActive ? "bg-primary-50" : "hover:bg-surface-elevated"
            }`}
          >
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-600 text-txt-on-primary flex-shrink-0 mt-0.5">
              /{reply.shortcut}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-txt-primary truncate">
                  {reply.title}
                </p>
                {reply.mediaUrl && (
                  <ImageIcon className="w-3 h-3 text-txt-muted flex-shrink-0" aria-label="Possui mídia" />
                )}
              </div>
              <p className="text-xs text-txt-muted truncate">{reply.content}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
