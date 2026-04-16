"use client";

import { useState } from "react";
import { Pencil, Copy, Trash2, ImageIcon, Check } from "lucide-react";
import { highlightVariables } from "@/lib/highlight-variables";
import { QUICK_REPLY_CATEGORIES } from "@/lib/constants";
import type { QuickReply } from "@/types/quick-reply";

interface QuickReplyCardProps {
  reply: QuickReply;
  onEdit: (reply: QuickReply) => void;
  onDelete: (reply: QuickReply) => void;
}

export function QuickReplyCard({ reply, onEdit, onDelete }: QuickReplyCardProps) {
  const [justCopied, setJustCopied] = useState(false);
  const category = QUICK_REPLY_CATEGORIES.find((c) => c.key === reply.category);
  const hasMedia = reply.mediaUrl !== null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reply.content);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch {
      /* clipboard indisponível: ignorar */
    }
  }

  return (
    <div className="bg-surface-card rounded-xl border border-border-default p-5 transition-colors hover:border-primary-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-600 text-txt-on-primary">
              /{reply.shortcut}
            </span>
            {category && (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${category.color}18`, color: category.color }}
              >
                {category.label}
              </span>
            )}
            {hasMedia && (
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded bg-surface-elevated text-txt-muted"
                title="Possui mídia anexada"
                aria-label="Possui mídia anexada"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Título */}
          <h3 className="font-headline text-base font-semibold text-txt-primary mt-3">
            {reply.title}
          </h3>

          {/* Corpo com variáveis */}
          <p className="text-sm text-txt-secondary mt-2 leading-relaxed">
            {highlightVariables(reply.content)}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(reply)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-card hover:border hover:border-border-default transition-colors text-txt-secondary hover:text-txt-primary"
            aria-label="Editar resposta"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-card hover:border hover:border-border-default transition-colors text-txt-secondary hover:text-txt-primary"
            aria-label="Copiar conteúdo"
          >
            {justCopied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(reply)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-danger-light hover:bg-danger-light/80 transition-colors"
            aria-label="Excluir resposta"
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      </div>
    </div>
  );
}
