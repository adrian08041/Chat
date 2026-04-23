"use client";

import {
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
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
import type { ContactListItem } from "@/types/contact";

interface ContactProfileDrawerProps {
  item: ContactListItem | null;
  onClose: () => void;
  onStartChat: () => void;
  onDelete: () => void;
}

export function ContactProfileDrawer({ item, onClose, onStartChat, onDelete }: ContactProfileDrawerProps) {
  return (
    <Sheet
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-md bg-surface-card text-txt-primary overflow-y-auto"
      >
        {item && <DrawerBody item={item} onStartChat={onStartChat} onDelete={onDelete} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  item,
  onStartChat,
  onDelete,
}: {
  item: ContactListItem;
  onStartChat: () => void;
  onDelete: () => void;
}) {
  const displayName = item.name ?? "Contato sem nome";
  const responsavel = item.assignedUser?.name ?? "Não atribuído";
  const canDelete = item.conversasCount === 0;
  const deleteTooltip = canDelete
    ? undefined
    : "Contato possui conversas e não pode ser excluído";

  return (
    <>
      <SheetHeader className="flex-row items-center justify-between px-6 pt-6 pb-2">
        <SheetTitle className="font-headline text-lg font-semibold text-txt-primary">
          Perfil do Contato
        </SheetTitle>
      </SheetHeader>

      <div className="flex flex-col items-center px-6 py-6 gap-3">
        <AvatarInitials name={item.name} size="xl" />
        <div className="text-center">
          <p className="font-headline text-lg font-semibold text-txt-primary">{displayName}</p>
          {item.tags.length > 0 && (
            <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
              {item.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-txt-muted flex-shrink-0" />
          <span className="text-sm text-txt-primary">{item.phone}</span>
        </div>
        {item.email && (
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-txt-muted flex-shrink-0" />
            <span className="text-sm text-txt-primary">{item.email}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle mx-6" />

      <div className="px-6 py-6">
        <h3 className="font-headline text-sm font-semibold text-txt-primary mb-4">Dados do Contato</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Origem</p>
              <p className="text-sm text-txt-primary">{item.source ?? "Desconhecida"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Primeiro contato</p>
              <p className="text-sm text-txt-primary">{formatDate(item.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Último contato</p>
              <p className="text-sm text-txt-primary">
                {item.ultimoContato ? formatRelativeTime(item.ultimoContato) : "Sem conversas"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Atendente responsável</p>
              <p className="text-sm text-txt-primary">{responsavel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Conversas</p>
              <p className="text-sm text-txt-primary">{item.conversasCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle mx-6" />

      <div className="px-6 py-6">
        <h3 className="font-headline text-sm font-semibold text-txt-primary mb-2">Histórico de Conversas</h3>
        <p className="text-xs text-txt-muted">Timeline completa chega na próxima iteração do perfil.</p>
      </div>

      <div className="border-t border-border-subtle mx-6" />

      <div className="px-6 py-6">
        <h3 className="font-headline text-sm font-semibold text-txt-primary mb-2">Notas Internas</h3>
        <p className="text-xs text-txt-muted">Agregação de notas por contato chega junto do perfil.</p>
      </div>

      <SheetFooter className="px-6 pb-6 pt-2 gap-3">
        <button
          onClick={onStartChat}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Iniciar Conversa
        </button>
        <button
          disabled
          title="Em breve"
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary opacity-50 cursor-not-allowed"
        >
          <Pencil className="w-4 h-4" />
          Editar Contato
        </button>
        <button
          onClick={onDelete}
          disabled={!canDelete}
          title={deleteTooltip}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-danger text-sm font-medium text-danger hover:bg-danger-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Contato
        </button>
      </SheetFooter>
    </>
  );
}
