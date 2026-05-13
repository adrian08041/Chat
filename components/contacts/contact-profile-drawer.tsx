"use client";

import Link from "next/link";
import {
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  MessageSquare,
  Trash2,
  FileText,
} from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { formatRelativeTime, formatDate } from "@/lib/format";
import { getContactDisplayName } from "@/lib/contacts/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ContactInlineField } from "./contact-inline-field";
import { ContactTagsEditor } from "./contact-tags-editor";
import { ContactAssigneeSelect } from "./contact-assignee-select";
import type { ContactProfileUpdate } from "./contact-profile-header";
import type { ContactListItem } from "@/types/contact";

interface ContactProfileDrawerProps {
  item: ContactListItem | null;
  onClose: () => void;
  onStartChat: () => void;
  onDelete: () => void;
  onUpdate: (partial: ContactProfileUpdate) => Promise<void>;
}

export function ContactProfileDrawer({
  item,
  onClose,
  onStartChat,
  onDelete,
  onUpdate,
}: ContactProfileDrawerProps) {
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
        {item && (
          <DrawerBody
            item={item}
            onStartChat={onStartChat}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  item,
  onStartChat,
  onDelete,
  onUpdate,
}: {
  item: ContactListItem;
  onStartChat: () => void;
  onDelete: () => void;
  onUpdate: (partial: ContactProfileUpdate) => Promise<void>;
}) {
  const displayName = getContactDisplayName(item);
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
        <div className="w-full text-center">
          <ContactInlineField
            value={item.name}
            placeholder={displayName}
            maxLength={120}
            onSave={(next) => onUpdate({ name: next ?? "" })}
            ariaLabel="Nome do contato"
            displayClassName="block w-full font-headline text-lg font-semibold text-txt-primary hover:bg-surface-elevated rounded px-2 py-1 transition-colors"
            inputClassName="w-full text-center font-headline text-lg font-semibold rounded-md bg-surface-elevated border border-border-default px-2 py-1 text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      <div className="px-6 space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-txt-muted flex-shrink-0" />
          <div className="flex-1">
            <ContactInlineField
              value={item.phone}
              placeholder="Telefone"
              maxLength={40}
              onSave={(next) => onUpdate({ phone: next ?? "" })}
              ariaLabel="Telefone do contato"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-txt-muted flex-shrink-0" />
          <div className="flex-1">
            <ContactInlineField
              value={item.email}
              placeholder="Adicionar email"
              maxLength={200}
              onSave={(next) => onUpdate({ email: next })}
              ariaLabel="Email do contato"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle mx-6" />

      <div className="px-6 py-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-txt-secondary">Tags</label>
          <div className="mt-2">
            <ContactTagsEditor
              value={item.tags}
              onSave={(tagIds) => onUpdate({ tagIds })}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-txt-secondary">Responsável</label>
          <div className="mt-2">
            <ContactAssigneeSelect
              value={item.assignedUserId}
              onSave={(next) => onUpdate({ assignedUserId: next })}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-txt-muted flex-shrink-0" />
            <label className="text-xs font-medium text-txt-secondary">Observações</label>
          </div>
          <div className="mt-2">
            <ContactInlineField
              value={item.notes}
              placeholder="Adicionar observação sobre este contato…"
              multiline
              maxLength={5000}
              onSave={(next) => onUpdate({ notes: next })}
              ariaLabel="Observações do contato"
              displayClassName="block w-full min-h-[3rem] text-sm text-txt-secondary hover:bg-surface-elevated rounded-md px-2 py-2 transition-colors whitespace-pre-wrap"
              inputClassName="w-full rounded-md bg-surface-elevated border border-border-default px-2 py-2 text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle mx-6" />

      <div className="px-6 py-6">
        <h3 className="font-headline text-sm font-semibold text-txt-primary mb-4">Dados</h3>
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
            <MessageSquare className="w-4 h-4 text-txt-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-txt-muted">Conversas</p>
              <p className="text-sm text-txt-primary">{item.conversasCount}</p>
            </div>
          </div>
        </div>
      </div>

      <SheetFooter className="px-6 pb-6 pt-2 gap-3">
        <button
          type="button"
          onClick={onStartChat}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Iniciar Conversa
        </button>
        <Link
          href={`/contatos/${item.id}`}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
        >
          Ver perfil completo
        </Link>
        <button
          type="button"
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
