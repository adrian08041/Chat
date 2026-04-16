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
import { MOCK_TAGS, MOCK_AGENTS } from "@/lib/mock-data";
import type { Contact, ContactTableRow } from "@/types/contact";

const NO_RESPONSAVEL = "__none__";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

interface NewContactFormProps {
  existingPhones: Set<string>;
  onClose: () => void;
  onCreate: (row: ContactTableRow) => void;
}

function NewContactForm({ existingPhones, onClose, onCreate }: NewContactFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [agentId, setAgentId] = useState<string>(NO_RESPONSAVEL);
  const [notes, setNotes] = useState("");

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const trimmedEmail = email.trim();

  const phoneAlreadyExists = useMemo(() => {
    if (!trimmedPhone) return false;
    return existingPhones.has(normalizePhone(trimmedPhone));
  }, [trimmedPhone, existingPhones]);

  const emailError = trimmedEmail && !isValidEmail(trimmedEmail) ? "Email inválido" : null;

  const canSubmit =
    trimmedName.length > 0 &&
    trimmedPhone.length > 0 &&
    !phoneAlreadyExists &&
    !emailError;

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function handleSubmit() {
    if (!canSubmit) return;

    const now = new Date().toISOString();
    const agent = MOCK_AGENTS.find((a) => a.id === agentId) ?? null;
    const tags = MOCK_TAGS.filter((t) => selectedTagIds.includes(t.id));

    const contact: Contact = {
      id: `c-${Date.now()}`,
      workspaceId: "w1",
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail || null,
      avatarUrl: null,
      notes: notes.trim() || null,
      assignedUserId: agent?.id ?? null,
      createdAt: now,
      updatedAt: now,
      tags,
    };

    const row: ContactTableRow = {
      contact,
      responsavel: agent?.name ?? "Não atribuído",
      conversasCount: 0,
      ultimoContato: now,
    };

    onCreate(row);
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
        {/* Nome */}
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

        {/* Telefone */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-contact-phone" className="text-xs font-medium text-txt-secondary">
            Telefone <span className="text-danger">*</span>
          </label>
          <input
            id="new-contact-phone"
            type="tel"
            placeholder="+55 00 0 0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={phoneAlreadyExists}
            className={`h-10 px-3 rounded-lg bg-surface-elevated border text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 transition-all ${
              phoneAlreadyExists
                ? "border-danger focus:ring-danger-light"
                : "border-border-default focus:ring-primary-400"
            }`}
          />
          {phoneAlreadyExists && (
            <p className="text-xs text-danger">Já existe um contato com esse telefone</p>
          )}
        </div>

        {/* Email */}
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

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-txt-secondary">
            Tags <span className="text-txt-muted font-normal">(opcional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MOCK_TAGS.map((tag) => {
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
                      ? { backgroundColor: `${tag.color}18`, color: tag.color, boxShadow: `inset 0 0 0 1px ${tag.color}` }
                      : { backgroundColor: "transparent", color: "var(--color-txt-muted)", boxShadow: "inset 0 0 0 1px var(--color-border-default)" }
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsável */}
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
            {MOCK_AGENTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-contact-notes" className="text-xs font-medium text-txt-secondary">
            Notas <span className="text-txt-muted font-normal">(opcional)</span>
          </label>
          <textarea
            id="new-contact-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre este contato..."
            rows={3}
            className="p-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all font-body resize-none"
          />
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
          Criar contato
        </button>
      </SheetFooter>
    </>
  );
}

interface NewContactSheetProps {
  open: boolean;
  existingContacts: Contact[];
  onClose: () => void;
  onCreate: (row: ContactTableRow) => void;
}

export function NewContactSheet({ open, existingContacts, onClose, onCreate }: NewContactSheetProps) {
  const existingPhones = useMemo(
    () => new Set(existingContacts.map((c) => normalizePhone(c.phone))),
    [existingContacts]
  );

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {open && (
          <NewContactForm
            existingPhones={existingPhones}
            onClose={onClose}
            onCreate={onCreate}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
