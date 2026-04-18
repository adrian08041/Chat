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
import type { TeamMember, UserRole } from "@/types/user";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Acesso total, incluindo faturamento e gerenciamento de membros.",
  },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    description: "Acompanha métricas e supervisiona atendentes.",
  },
  {
    value: "AGENT",
    label: "Atendente",
    description: "Atende conversas e gerencia contatos designados.",
  },
];

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

interface InviteMemberFormProps {
  existingEmails: Set<string>;
  onClose: () => void;
  onInvite: (member: TeamMember) => void;
}

type InviteApiResponse =
  | {
      success: true;
      data: { id: string; email: string; role: UserRole; expiresAt: string };
    }
  | { success: false; error: string };

function InviteMemberForm({ existingEmails, onClose, onInvite }: InviteMemberFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("AGENT");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const emailAlreadyExists = useMemo(() => {
    if (!trimmedEmail) return false;
    return existingEmails.has(trimmedEmail);
  }, [trimmedEmail, existingEmails]);

  const emailFormatError =
    trimmedEmail && !isValidEmail(trimmedEmail) ? "Email inválido" : null;

  const canSubmit =
    trimmedName.length > 0 &&
    trimmedEmail.length > 0 &&
    !emailAlreadyExists &&
    !emailFormatError &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, role }),
      });
      const payload = (await res.json().catch(() => null)) as InviteApiResponse | null;

      if (!res.ok || !payload?.success) {
        setSubmitError(
          payload?.success === false
            ? payload.error
            : "Falha ao enviar convite",
        );
        return;
      }

      const member: TeamMember = {
        id: payload.data.id,
        workspaceId: "",
        name: trimmedName,
        email: payload.data.email,
        role: payload.data.role,
        memberStatus: "PENDING",
        avatarUrl: null,
        joinedAt: new Date().toISOString(),
        lastActiveAt: null,
      };

      onInvite(member);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SheetHeader className="border-b border-border-default pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
            Convidar Membro
          </SheetTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-txt-muted" />
          </button>
        </div>
        <p className="text-xs text-txt-muted">
          Um convite será enviado por email para o novo membro.
        </p>
      </SheetHeader>

      <div className="flex-1 flex flex-col gap-5 p-4">
        {submitError && (
          <div
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-sm text-danger"
          >
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-name" className="text-xs font-medium text-txt-secondary">
            Nome <span className="text-danger">*</span>
          </label>
          <input
            id="invite-name"
            type="text"
            placeholder="Ex: Ana Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-email" className="text-xs font-medium text-txt-secondary">
            Email <span className="text-danger">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            placeholder="membro@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailAlreadyExists || !!emailFormatError}
            className={`h-10 px-3 rounded-lg bg-surface-elevated border text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 transition-all ${
              emailAlreadyExists || emailFormatError
                ? "border-danger focus:ring-danger-light"
                : "border-border-default focus:ring-primary-400"
            }`}
          />
          {emailAlreadyExists && (
            <p className="text-xs text-danger">Já existe um membro com esse email</p>
          )}
          {emailFormatError && !emailAlreadyExists && (
            <p className="text-xs text-danger">{emailFormatError}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-txt-secondary">
            Função <span className="text-danger">*</span>
          </span>
          <div className="flex flex-col gap-2">
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={selected}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selected
                      ? "border-primary-600 bg-primary-50"
                      : "border-border-default bg-surface-card hover:bg-surface-elevated"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      selected ? "text-primary-600" : "text-txt-primary"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-txt-muted mt-0.5">{option.description}</p>
                </button>
              );
            })}
          </div>
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
          {submitting ? "Enviando..." : "Enviar convite"}
        </button>
      </SheetFooter>
    </>
  );
}

interface InviteMemberSheetProps {
  open: boolean;
  existingMembers: TeamMember[];
  onClose: () => void;
  onInvite: (member: TeamMember) => void;
}

export function InviteMemberSheet({
  open,
  existingMembers,
  onClose,
  onInvite,
}: InviteMemberSheetProps) {
  const existingEmails = useMemo(
    () => new Set(existingMembers.map((m) => m.email.toLowerCase())),
    [existingMembers]
  );

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {open && (
          <InviteMemberForm
            existingEmails={existingEmails}
            onClose={onClose}
            onInvite={onInvite}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
