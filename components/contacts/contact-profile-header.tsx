"use client";

import {
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  User,
  MessageSquare,
  FileText,
} from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { getContactDisplayName } from "@/lib/contacts/format";
import { ContactInlineField } from "./contact-inline-field";
import { ContactTagsEditor } from "./contact-tags-editor";
import { ContactAssigneeSelect } from "./contact-assignee-select";
import type { ContactListItem } from "@/types/contact";

export interface ContactProfileUpdate {
  name?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
  tagIds?: string[];
  assignedUserId?: string | null;
}

interface Props {
  item: ContactListItem;
  onUpdate: (partial: ContactProfileUpdate) => Promise<void>;
}

export function ContactProfileHeader({ item, onUpdate }: Props) {
  const displayName = getContactDisplayName(item);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <AvatarInitials name={item.name} size="xl" />
        <div className="w-full max-w-xs text-center">
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

      <div className="flex flex-col gap-3">
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

      <div className="border-t border-border-subtle" />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-txt-secondary">Tags</label>
        <ContactTagsEditor
          value={item.tags}
          onSave={(tagIds) => onUpdate({ tagIds })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-txt-secondary">Responsável</label>
        <ContactAssigneeSelect
          value={item.assignedUserId}
          onSave={(next) => onUpdate({ assignedUserId: next })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-txt-muted flex-shrink-0" />
          <label className="text-xs font-medium text-txt-secondary">Observações</label>
        </div>
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

      <div className="border-t border-border-subtle" />

      <div className="flex flex-col gap-3">
        <h3 className="font-headline text-sm font-semibold text-txt-primary">Dados</h3>
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
            <p className="text-sm text-txt-primary">{item.assignedUser?.name ?? "Não atribuído"}</p>
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
  );
}
