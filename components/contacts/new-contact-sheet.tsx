"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useTags } from "@/lib/hooks/use-tags";
import { useWorkspaceUsers } from "@/lib/hooks/use-users";
import { useCreateContact } from "@/lib/hooks/use-contacts";
import { ApiClientError } from "@/lib/api-client";
import type { ContactListItem } from "@/types/contact";

const NO_RESPONSAVEL = "__none__";

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

interface NewContactFormProps {
  onClose: () => void;
  onCreated: (contact: ContactListItem) => void;
}

function NewContactForm({ onClose, onCreated }: NewContactFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [agentId, setAgentId] = useState<string>(NO_RESPONSAVEL);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const { data: tags = [] } = useTags();
  const { data: users = [] } = useWorkspaceUsers();
  const createMutation = useCreateContact();

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const trimmedEmail = email.trim();

  const emailError = trimmedEmail && !isValidEmail(trimmedEmail) ? "Email inválido" : null;
  const canSubmit =
    trimmedName.length > 0 &&
    trimmedPhone.length > 0 &&
    !emailError &&
    !createMutation.isPending;

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setPhoneError(null);

    createMutation.mutate(
      {
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail || null,
        notes: notes.trim() || null,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        assignedUserId: agentId === NO_RESPONSAVEL ? null : agentId,
      },
      {
        onSuccess: (created) => {
          toast.success("Contato criado");
          onCreated(created);
        },
        onError: (err) => {
          if (err instanceof ApiClientError && err.status === 409) {
            const details = err.details as { code?: string } | undefined;
            if (details?.code === "phone_exists") {
              setPhoneError("Já existe um contato com esse telefone");
              return;
            }
          }
          const msg = err instanceof ApiClientError ? err.message : "Falha ao criar contato";
          toast.error(msg);
        },
      },
    );
  }

  return (
    <>
      <SheetHeader className="border-b border-border-default pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
            Novo Contato
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-contact-name" className="text-xs font-medium text-txt-secondary">
            Nome <span className="text-danger">*</span>
          </label>
          <input
            id="new-contact-name"
            type="text"
            placeholder="Ex: Ana Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-contact-phone" className="text-xs font-medium text-txt-secondary">
            Telefone <span className="text-danger">*</span>
          </label>
          <input
            id="new-contact-phone"
            type="tel"
            placeholder="+55 00 0 0000-0000"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            aria-invalid={phoneError !== null}
            className={`h-10 px-3 rounded-lg bg-surface-elevated border text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 transition-all ${
              phoneError
                ? "border-danger focus:ring-danger-light"
                : "border-border-default focus:ring-primary-400"
            }`}
          />
          {phoneError && <p className="text-xs text-danger">{phoneError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-contact-email" className="text-xs font-medium text-txt-secondary">
            Email <span className="text-txt-muted font-normal">(opcional)</span>
          </label>
          <input
            id="new-contact-email"
            type="email"
            placeholder="contato@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!emailError}
            className={`h-10 px-3 rounded-lg bg-surface-elevated border text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 transition-all ${
              emailError
                ? "border-danger focus:ring-danger-light"
                : "border-border-default focus:ring-primary-400"
            }`}
          />
          {emailError && <p className="text-xs text-danger">{emailError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-contact-notes" className="text-xs font-medium text-txt-secondary">
            Observações <span className="text-txt-muted font-normal">(opcional)</span>
          </label>
          <textarea
            id="new-contact-notes"
            rows={3}
            maxLength={5000}
            placeholder="Observações gerais sobre este contato…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-txt-secondary">
            Tags <span className="text-txt-muted font-normal">(opcional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <p className="text-xs text-txt-muted">Nenhuma tag disponível</p>
            )}
            {tags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={selected}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all"
                  style={
                    selected
                      ? {
                          backgroundColor: `${tag.color}18`,
                          color: tag.color,
                          boxShadow: `inset 0 0 0 1px ${tag.color}`,
                        }
                      : {
                          backgroundColor: "transparent",
                          color: "var(--color-txt-muted)",
                          boxShadow: "inset 0 0 0 1px var(--color-border-default)",
                        }
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-contact-agent" className="text-xs font-medium text-txt-secondary">
            Responsável <span className="text-txt-muted font-normal">(opcional)</span>
          </label>
          <select
            id="new-contact-agent"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
          >
            <option value={NO_RESPONSAVEL}>Sem responsável</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
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
          {createMutation.isPending ? "Criando..." : "Criar contato"}
        </button>
      </SheetFooter>
    </>
  );
}

interface NewContactSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (contact: ContactListItem) => void;
}

export function NewContactSheet({ open, onClose, onCreated }: NewContactSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {open && <NewContactForm onClose={onClose} onCreated={onCreated} />}
      </SheetContent>
    </Sheet>
  );
}
