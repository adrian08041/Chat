"use client";

import { useState, useCallback } from "react";
import { Phone, Mail, Globe, Calendar, Clock, User, MessageSquare, Pencil, Trash2, Plus } from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { TagBadge } from "@/components/ui/tag-badge";
import { formatRelativeTime, formatDate } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { MOCK_HISTORICO, MOCK_CONTACT_NOTAS, MOCK_CONTACT_ORIGENS } from "@/lib/mock-data";
import type { ContactTableRow, NotaInterna } from "@/types/contact";

interface ContactProfileDrawerProps {
  row: ContactTableRow | null;
  onClose: () => void;
  onStartChat: () => void;
  onDelete: () => void;
}

export function ContactProfileDrawer({ row, onClose, onStartChat, onDelete }: ContactProfileDrawerProps) {
  const isOpen = row !== null;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-md bg-surface-card text-txt-primary overflow-y-auto"
      >
        {row && (
          <DrawerBody
            row={row}
            onClose={onClose}
            onStartChat={onStartChat}
            onDelete={onDelete}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  row,
  onClose,
  onStartChat,
  onDelete,
}: {
  row: ContactTableRow;
  onClose: () => void;
  onStartChat: () => void;
  onDelete: () => void;
}) {
  const { contact, responsavel, ultimoContato } = row;
  const historico = MOCK_HISTORICO[contact.id] ?? [];
  const [notas, setNotas] = useState<NotaInterna[]>(MOCK_CONTACT_NOTAS[contact.id] ?? []);
  const [novaNota, setNovaNota] = useState("");
  const origem = MOCK_CONTACT_ORIGENS[contact.id] ?? "Desconhecida";
  const primeiroContato = contact.createdAt;
  const displayName = contact.name ?? "Contato sem nome";

  const handleAddNota = useCallback(() => {
    const texto = novaNota.trim();
    if (!texto) return;

    const nota: NotaInterna = {
      id: `n-${Date.now()}`,
      autor: "Admin User",
      data: new Date().toISOString(),
      conteudo: texto,
    };
    setNotas((prev) => [nota, ...prev]);
    setNovaNota("");
  }, [novaNota]);

  return (
    <>
      {/* Header */}
      <SheetHeader className="flex-row items-center justify-between px-6 pt-6 pb-2">
        <SheetTitle className="font-headline text-lg font-semibold text-txt-primary">
          Perfil do Contato
        </SheetTitle>
      </SheetHeader>

      {/* Avatar + nome + tags */}
      <div className="flex flex-col items-center px-6 py-6 gap-3">
        <AvatarInitials name={contact.name} size="xl" />
        <div className="text-center">
          <p className="font-headline text-lg font-semibold text-txt-primary">{displayName}</p>
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {contact.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info de contato */}
      <div className="px-6 space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-txt-muted flex-shrink-0" />
          <span className="text-sm text-txt-primary">{contact.phone}</span>
        </div>
        {contact.email && (
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-txt-muted flex-shrink-0" />
            <span className="text-sm text-txt-primary">{contact.email}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle mx-6" />

      {/* Dados do Contato */}
      <div className="px-6 py-6">
        <h3 className="font-headline text-sm font-semibold text-txt-primary mb-4">Dados do Contato</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Origem</p>
              <p className="text-sm text-txt-primary">{origem}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Primeiro contato</p>
              <p className="text-sm text-txt-primary">{formatDate(primeiroContato)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Último contato</p>
              <p className="text-sm text-txt-primary">{formatRelativeTime(ultimoContato)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Atendente responsável</p>
              <p className="text-sm text-txt-primary">{responsavel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle mx-6" />

      {/* Histórico de Conversas */}
      <div className="px-6 py-6">
        <h3 className="font-headline text-sm font-semibold text-txt-primary mb-4">Histórico de Conversas</h3>
        <div className="relative">
          {historico.length > 1 && (
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border-default" />
          )}
          <div className="space-y-5">
            {historico.map((item) => (
              <div key={item.id} className="flex gap-4 relative">
                <div className="w-[11px] h-[11px] rounded-full bg-success border-2 border-surface-card flex-shrink-0 mt-1 z-10" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-txt-muted">{formatDate(item.data)}</p>
                  <p className="text-sm text-txt-primary mt-0.5">{item.descricao}</p>
                  <p className="text-xs text-txt-muted mt-0.5">Atendido por {item.atendidoPor}</p>
                </div>
                {item.duracao && (
                  <span className="text-xs text-txt-muted flex-shrink-0 mt-1">{item.duracao}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle mx-6" />

      {/* Notas Internas */}
      <div className="px-6 py-6">
        <h3 className="font-headline text-sm font-semibold text-txt-primary mb-4">Notas Internas</h3>
        <textarea
          value={novaNota}
          onChange={(e) => setNovaNota(e.target.value)}
          placeholder="Adicionar nova nota..."
          className="w-full h-20 p-3 rounded-lg bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body resize-none"
        />
        <button
          onClick={handleAddNota}
          disabled={!novaNota.trim()}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 h-9 rounded-lg border border-primary-600 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Adicionar Nota
        </button>
        {notas.length > 0 && (
          <div className="mt-5 space-y-4">
            {notas.map((nota) => (
              <div key={nota.id} className="border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-txt-primary">{nota.autor}</p>
                  <p className="text-xs text-txt-muted">{formatDate(nota.data)}</p>
                </div>
                <p className="text-sm text-txt-secondary leading-relaxed">{nota.conteudo}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <SheetFooter className="px-6 pb-6 pt-2 gap-3">
        <button
          onClick={onStartChat}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Iniciar Conversa
        </button>
        <button
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar Contato
        </button>
        <button
          onClick={onDelete}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-danger text-sm font-medium text-danger hover:bg-danger-light transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Contato
        </button>
      </SheetFooter>
    </>
  );
}
