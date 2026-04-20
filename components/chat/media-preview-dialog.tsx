"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Send, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface MediaPreviewDialogProps {
  file: File | null;
  sending: boolean;
  onCancel: () => void;
  onConfirm: (caption: string) => void;
}

interface DialogBodyProps {
  file: File;
  sending: boolean;
  onCancel: () => void;
  onConfirm: (caption: string) => void;
}

function DialogBody({ file, sending, onCancel, onConfirm }: DialogBodyProps) {
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  // Resource acquisition dentro do effect: Strict Mode do React 19 dispara
  // mount → cleanup (revoga) → mount (nova URL). A última URL fica viva.
  // `useMemo`/`useState` lazy-init não sobrevivem ao cleanup simulado porque
  // só mantém a primeira URL, que é revogada antes do paint real.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => captionRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  const mime = file.type || "application/octet-stream";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) onConfirm(caption.trim());
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-default flex-shrink-0">
        <div className="min-w-0">
          <DialogTitle className="text-sm font-medium text-txt-primary truncate">
            {file.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-txt-muted">
            {mime} · {formatBytes(file.size)}
          </DialogDescription>
        </div>
        <button
          type="button"
          aria-label="Cancelar"
          onClick={onCancel}
          disabled={sending}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-surface-bg p-6 min-h-[240px] overflow-auto">
        {isImage && previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-[55vh] object-contain rounded-lg"
          />
        )}
        {isVideo && previewUrl && (
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-[55vh] rounded-lg"
          />
        )}
        {isAudio && previewUrl && <audio src={previewUrl} controls className="w-full max-w-md" />}
        {!isImage && !isVideo && !isAudio && (
          <div className="flex flex-col items-center gap-3 text-txt-muted">
            <div className="w-20 h-20 rounded-xl bg-surface-elevated flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary-600" />
            </div>
            <p className="text-sm">Documento pronto para envio</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-border-default bg-surface-card flex-shrink-0 flex items-end gap-3">
        <textarea
          ref={captionRef}
          rows={1}
          placeholder="Adicione uma legenda (opcional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1 min-h-[44px] max-h-32 px-4 py-2.5 rounded-xl bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body resize-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => onConfirm(caption.trim())}
          disabled={sending}
          aria-label="Enviar"
          className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-primary-600 hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-wait flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </>
  );
}

export function MediaPreviewDialog({
  file,
  sending,
  onCancel,
  onConfirm,
}: MediaPreviewDialogProps) {
  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open && !sending) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "!max-w-3xl w-full p-0 bg-surface-card text-txt-primary overflow-hidden",
          "flex flex-col max-h-[90vh]",
        )}
      >
        {file && (
          <DialogBody
            key={`${file.name}-${file.size}-${file.lastModified}`}
            file={file}
            sending={sending}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
