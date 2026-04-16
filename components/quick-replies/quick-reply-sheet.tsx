"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { QUICK_REPLY_CATEGORIES } from "@/lib/constants";
import type { QuickReply, QuickReplyCategory } from "@/types/quick-reply";

function normalizeShortcut(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface QuickReplyFormProps {
  mode: "create" | "edit";
  initial: QuickReply | null;
  existingShortcuts: Set<string>;
  onClose: () => void;
  onSubmit: (data: {
    shortcut: string;
    title: string;
    content: string;
    category: QuickReplyCategory;
    hasMedia: boolean;
  }) => void;
}

function QuickReplyForm({
  mode,
  initial,
  existingShortcuts,
  onClose,
  onSubmit,
}: QuickReplyFormProps) {
  const [shortcut, setShortcut] = useState(initial?.shortcut ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState<QuickReplyCategory>(
    (initial?.category as QuickReplyCategory) ?? "boas-vindas"
  );
  const [hasMedia, setHasMedia] = useState(initial?.mediaUrl !== null && initial?.mediaUrl !== undefined);

  const normalizedShortcut = normalizeShortcut(shortcut);
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  const shortcutDuplicate = useMemo(() => {
    if (!normalizedShortcut) return false;
    return existingShortcuts.has(normalizedShortcut);
  }, [normalizedShortcut, existingShortcuts]);

  const shortcutEmpty = shortcut.trim().length > 0 && normalizedShortcut.length === 0;

  const canSubmit =
    normalizedShortcut.length > 0 &&
    !shortcutDuplicate &&
    trimmedTitle.length > 0 &&
    trimmedContent.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      shortcut: normalizedShortcut,
      title: trimmedTitle,
      content: trimmedContent,
      category,
      hasMedia,
    });
  }

  const titleText = mode === "create" ? "Nova Resposta" : "Editar Resposta";
  const submitLabel = mode === "create" ? "Criar resposta" : "Salvar alterações";

  return (
    <>
      <SheetHeader className="border-b border-border-default pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
            {titleText}
          </SheetTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-txt-muted" />
          </button>
        </div>
      </SheetHeader>

      <div className="flex-1 flex flex-col gap-5 p-4">
        {/* Atalho */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-shortcut" className="text-xs font-medium text-txt-secondary">
            Atalho <span className="text-danger">*</span>
          </label>
          <div className="flex items-center h-10 rounded-lg bg-surface-elevated border border-border-default focus-within:ring-2 focus-within:ring-primary-400 transition-all overflow-hidden">
            <span className="pl-3 text-sm text-txt-muted select-none">/</span>
            <input
              id="qr-shortcut"
              type="text"
              placeholder="saudacao"
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              aria-invalid={shortcutDuplicate || shortcutEmpty}
              className="flex-1 h-full pl-1 pr-3 bg-transparent text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none"
            />
          </div>
          {shortcutDuplicate && (
            <p className="text-xs text-danger">Já existe uma resposta com esse atalho</p>
          )}
          {shortcutEmpty && (
            <p className="text-xs text-danger">Atalho deve conter letras, números ou hífens</p>
          )}
          {!shortcutDuplicate && !shortcutEmpty && normalizedShortcut && (
            <p className="text-xs text-txt-muted">
              Será usado como <code className="text-txt-primary">/{normalizedShortcut}</code>
            </p>
          )}
        </div>

        {/* Título */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-title" className="text-xs font-medium text-txt-secondary">
            Título <span className="text-danger">*</span>
          </label>
          <input
            id="qr-title"
            type="text"
            placeholder="Ex: Saudação Inicial"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
          />
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-category" className="text-xs font-medium text-txt-secondary">
            Categoria <span className="text-danger">*</span>
          </label>
          <select
            id="qr-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as QuickReplyCategory)}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
          >
            {QUICK_REPLY_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-content" className="text-xs font-medium text-txt-secondary">
            Mensagem <span className="text-danger">*</span>
          </label>
          <textarea
            id="qr-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Olá {{nome_cliente}}, seja bem-vindo..."
            rows={6}
            className="p-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-body resize-none"
          />
          <p className="text-xs text-txt-muted">
            Use <code className="text-txt-primary">{`{{nome_variavel}}`}</code> para marcar variáveis
          </p>
        </div>

        {/* Mídia */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasMedia}
            onChange={(e) => setHasMedia(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-primary-600 focus:ring-primary-400"
          />
          <span className="text-sm text-txt-primary">Anexar mídia</span>
          <span className="text-xs text-txt-muted">(placeholder)</span>
        </label>
      </div>

      <SheetFooter className="border-t border-border-default pt-4 flex flex-row gap-2">
        <button
          onClick={onClose}
          className="flex-1 h-10 rounded-lg border border-border-default text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </SheetFooter>
    </>
  );
}

interface QuickReplySheetProps {
  open: boolean;
  mode: "create" | "edit";
  initial: QuickReply | null;
  existingShortcuts: Set<string>;
  onClose: () => void;
  onSubmit: (data: {
    shortcut: string;
    title: string;
    content: string;
    category: QuickReplyCategory;
    hasMedia: boolean;
  }) => void;
}

export function QuickReplySheet({
  open,
  mode,
  initial,
  existingShortcuts,
  onClose,
  onSubmit,
}: QuickReplySheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {open && (
          <QuickReplyForm
            mode={mode}
            initial={initial}
            existingShortcuts={existingShortcuts}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
