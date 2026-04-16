"use client";

import { useCallback, useState } from "react";
import { Phone, Video, MapPin, Calendar, Clock, UserCircle, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { AvatarInitials } from "./avatar-initials";
import { TransferConversationSheet } from "./transfer-conversation-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Contact } from "@/types/contact";
import type { InternalNote } from "@/types/note";

interface ContactPanelProps {
  contact: Contact | null;
  notes: InternalNote[];
  assigneeName: string;
  assignedUserId: string | null;
  isResolved: boolean;
  onAddNote: (content: string) => void;
  onResolveConversation: () => void;
  onTransferConversation: (agentId: string) => void;
}

function formatContactDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-txt-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-txt-muted font-body">{label}</p>
        <p className="text-sm text-txt-primary font-body font-medium">{value}</p>
      </div>
    </div>
  );
}

export function ContactPanel({
  contact,
  notes,
  assigneeName,
  assignedUserId,
  isResolved,
  onAddNote,
  onResolveConversation,
  onTransferConversation,
}: ContactPanelProps) {
  const [noteDraft, setNoteDraft] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);

  const trimmedNote = noteDraft.trim();

  const handleAddNote = useCallback(() => {
    if (!trimmedNote) return;
    onAddNote(trimmedNote);
    setNoteDraft("");
  }, [trimmedNote, onAddNote]);

  const handleConfirmResolve = useCallback(() => {
    setConfirmResolveOpen(false);
    onResolveConversation();
  }, [onResolveConversation]);

  const handleCloseTransfer = useCallback(() => setTransferOpen(false), []);
  const handleCancelResolve = useCallback(() => setConfirmResolveOpen(false), []);

  if (!contact) return null;

  const tags = contact.tags ?? [];

  return (
    <div className="hidden lg:flex w-[320px] flex-shrink-0 border-l border-border-default bg-surface-card flex-col h-full overflow-y-auto">
      <div className="flex flex-col items-center pt-8 pb-5 px-5 border-b border-border-subtle">
        <AvatarInitials name={contact.name} size="xl" />
        <h3 className="font-headline font-bold text-lg text-txt-primary mt-3">
          {contact.name ?? "Sem nome"}
        </h3>
        <p className="text-sm text-txt-muted font-body">{contact.phone}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-body font-medium"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  border: `1px solid ${tag.color}30`,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4 w-full">
          <button className="flex-1 h-10 rounded-xl bg-primary-600 text-white text-sm font-body font-medium flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors">
            <Phone className="w-4 h-4" />
            Ligar
          </button>
          <button className="flex-1 h-10 rounded-xl border border-border-default text-txt-primary text-sm font-body font-medium flex items-center justify-center gap-2 hover:bg-surface-elevated transition-colors">
            <Video className="w-4 h-4" />
            Vídeo
          </button>
        </div>
      </div>

      <div className="px-5 py-5 border-b border-border-subtle">
        <h4 className="font-headline font-semibold text-sm text-txt-primary mb-4">
          Informações do Contato
        </h4>
        <div className="space-y-4">
          <InfoRow icon={MapPin} label="Origem" value={contact.notes ?? "Desconhecida"} />
          <InfoRow icon={Calendar} label="Primeiro contato" value={formatContactDate(contact.createdAt)} />
          <InfoRow icon={Clock} label="Último contato" value={formatRelativeTime(contact.updatedAt)} />
          <InfoRow icon={UserCircle} label="Atendente responsável" value={assigneeName} />
        </div>
      </div>

      <div className="px-5 py-5 flex-1">
        <h4 className="font-headline font-semibold text-sm text-txt-primary mb-4">
          Notas Internas
        </h4>

        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Adicionar nota interna..."
              aria-label="Adicionar nota interna"
              className="w-full h-20 p-3 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none font-body transition-all"
            />
            <button
              onClick={handleAddNote}
              disabled={!trimmedNote}
              className="self-end h-9 px-4 rounded-lg bg-primary-600 text-txt-on-primary text-sm font-body font-medium hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar
            </button>
          </div>

          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-xl border border-border-subtle bg-surface-elevated"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-body font-semibold text-xs text-txt-primary">
                  {note.userName}
                </span>
                <span className="text-[10px] text-txt-muted font-body">
                  {new Date(note.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })},{" "}
                  {new Date(note.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-txt-secondary font-body leading-relaxed">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-2 flex-shrink-0">
        <button
          onClick={() => setTransferOpen(true)}
          className="w-full h-11 rounded-xl border border-border-default text-txt-primary text-sm font-body font-medium flex items-center justify-center gap-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Transferir conversa
        </button>
        <button
          onClick={() => setConfirmResolveOpen(true)}
          disabled={isResolved}
          className="w-full h-11 rounded-xl bg-primary-600 text-white text-sm font-body font-medium flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isResolved ? "Conversa resolvida" : "Resolver conversa"}
        </button>
      </div>

      <TransferConversationSheet
        open={transferOpen}
        currentAssignedUserId={assignedUserId}
        onClose={handleCloseTransfer}
        onTransfer={onTransferConversation}
      />

      <ConfirmDialog
        open={confirmResolveOpen}
        title="Marcar como resolvida?"
        description="A conversa será marcada como resolvida. Você poderá continuar vendo o histórico, mas ela sairá do filtro de conversas abertas."
        confirmLabel="Resolver"
        cancelLabel="Cancelar"
        variant="primary"
        onConfirm={handleConfirmResolve}
        onCancel={handleCancelResolve}
      />
    </div>
  );
}
