"use client";

import { useMemo, useRef, useState } from "react";
import { X, Upload, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { QUICK_REPLY_CATEGORIES } from "@/lib/constants";
import { useUploadFile } from "@/lib/hooks/use-uploads";
import { ApiClientError } from "@/lib/api-client";
import type { QuickReply, QuickReplyCategory } from "@/types/quick-reply";

function normalizeShortcut(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type QuickReplyFormData = {
  shortcut: string;
  title: string;
  content: string;
  category: QuickReplyCategory;
  mediaUrl: string | null;
  mediaType: string | null;
};

interface QuickReplyFormProps {
  mode: "create" | "edit";
  initial: QuickReply | null;
  existingShortcuts: Set<string>;
  onClose: () => void;
  onSubmit: (data: QuickReplyFormData) => void;
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
  const [mediaUrl, setMediaUrl] = useState<string | null>(initial?.mediaUrl ?? null);
  const [mediaType, setMediaType] = useState<string | null>(initial?.mediaType ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();

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
      mediaUrl,
      mediaType,
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const result = await uploadMutation.mutateAsync({
        file,
        scope: "quick-reply",
      });
      setMediaUrl(result.url);
      setMediaType(result.mimeType);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Falha no upload";
      toast.error(msg);
    }
  }

  function handleRemoveMedia() {
    setMediaUrl(null);
    setMediaType(null);
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
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-txt-secondary">Mídia anexada</span>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf"
            onChange={handleFileChange}
          />
          {mediaUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-border-default">
              {mediaType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded flex items-center justify-center bg-surface-card flex-shrink-0">
                  <FileText className="w-5 h-5 text-txt-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-txt-primary truncate">{mediaType ?? "arquivo"}</p>
                <p className="text-[10px] text-txt-muted truncate">{mediaUrl.split("/").pop()}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveMedia}
                aria-label="Remover mídia"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-danger hover:bg-danger-light transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-2 h-10 px-3 rounded-lg border border-dashed border-border-default text-sm text-txt-secondary hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Anexar mídia (opcional)
                </>
              )}
            </button>
          )}
        </div>
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
  onSubmit: (data: QuickReplyFormData) => void;
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
