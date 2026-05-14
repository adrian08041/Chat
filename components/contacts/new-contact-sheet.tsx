"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTags } from "@/lib/hooks/use-tags";
import { useWorkspaceUsers } from "@/lib/hooks/use-users";
import {
  CHECK_PHONE_MIN_DIGITS,
  type CheckPhoneResult,
  useCheckWhatsappNumber,
  useCreateContact,
} from "@/lib/hooks/use-contacts";
import { ApiClientError } from "@/lib/api-client";
import type { ContactListItem } from "@/types/contact";

const NO_RESPONSAVEL = "__none__";

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

// Permite só dígitos e formatação comum (+, -, (, ), espaço). Letras e
// símbolos quaisquer são removidos silenciosamente — comportamento de
// telefone de aplicativos mobile, não exige feedback explícito.
function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\-()\s]/g, "");
}

interface PhoneCheckHintProps {
  data: CheckPhoneResult | undefined;
}

// Render do feedback de validação. Verde = no WhatsApp, amarelo = não está,
// cinza = sem instance CONNECTED ou erro UazApi (skip silencioso). Não bloqueia.
function PhoneCheckHint({ data }: PhoneCheckHintProps) {
  if (!data) return null;

  if (!data.validated) {
    if (data.skipReason === "no_instance") {
      return (
        <p className="text-xs text-txt-muted">
          Nenhum WhatsApp conectado para fazer a verificação. Você pode salvar mesmo assim.
        </p>
      );
    }
    // api_error (ou null por defesa) — falha transitória da UazApi
    return (
      <p className="text-xs text-txt-muted">
        Verificação indisponível agora. Tente de novo em instantes ou salve mesmo assim.
      </p>
    );
  }

  if (data.isInWhatsapp) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Este número tem WhatsApp
        {data.verifiedName ? ` · ${data.verifiedName}` : ""}
      </p>
    );
  }

  return (
    <p className="flex items-start gap-1.5 text-xs text-warning">
      <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
      <span>
        Este número não tem conta no WhatsApp. Confira se digitou certo — se
        salvar assim, não vai dar para conversar com ele pelo app.
      </span>
    </p>
  );
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
  const [phoneTouched, setPhoneTouched] = useState(false);

  const { data: tags = [] } = useTags();
  const { data: users = [] } = useWorkspaceUsers();
  const createMutation = useCreateContact();
  const checkMutation = useCheckWhatsappNumber();

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const trimmedEmail = email.trim();
  const phoneDigits = trimmedPhone.replace(/\D/g, "");

  // Dígitos do telefone que foi efetivamente validado (variables guarda o
  // input bruto da última mutation). Comparar com phoneDigits diz se o
  // resultado em cache ainda é "fresh" pro valor atual.
  const checkedDigits = checkMutation.variables?.replace(/\D/g, "") ?? null;
  const checkInSync = checkedDigits !== null && checkedDigits === phoneDigits;
  const verifiedName =
    checkMutation.data?.validated && checkInSync
      ? checkMutation.data.verifiedName
      : null;

  const canCheck =
    phoneDigits.length >= CHECK_PHONE_MIN_DIGITS && !checkMutation.isPending;

  const emailError = trimmedEmail && !isValidEmail(trimmedEmail) ? "Email inválido" : null;
  // Erro do server (409 phone_exists) tem precedência sobre validação local.
  // Validação local só aparece depois que o usuário interagiu com o campo
  // (touched) — evita "vermelho na primeira tecla" enquanto digita.
  const phoneTooShort =
    phoneDigits.length > 0 && phoneDigits.length < CHECK_PHONE_MIN_DIGITS;
  const phoneTooShortError =
    phoneTouched && phoneTooShort
      ? `Telefone deve ter ao menos ${CHECK_PHONE_MIN_DIGITS} dígitos`
      : null;
  const phoneInputError = phoneError ?? phoneTooShortError;

  const canSubmit =
    trimmedName.length > 0 &&
    phoneDigits.length >= CHECK_PHONE_MIN_DIGITS &&
    !emailError &&
    !createMutation.isPending;

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  function handleCheck() {
    if (!canCheck) return;
    checkMutation.mutate(trimmedPhone, {
      onError: (err) => {
        const msg =
          err instanceof ApiClientError
            ? err.message
            : "Não foi possível verificar o número agora.";
        toast.error(msg);
      },
    });
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

  const showHint = checkMutation.data !== undefined && checkInSync;
  const checkLabel = showHint ? "Verificar de novo" : "Verificar número";

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
            placeholder={verifiedName ?? "Ex: Ana Silva"}
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
              const next = sanitizePhoneInput(e.target.value);
              setPhone(next);
              if (phoneError) setPhoneError(null);
              // Reset do último resultado quando os dígitos mudam — força o
              // user a revalidar pro número novo em vez de ver resultado stale.
              const nextDigits = next.replace(/\D/g, "");
              if (
                checkedDigits !== null &&
                checkedDigits !== nextDigits &&
                (checkMutation.data !== undefined || checkMutation.error !== null)
              ) {
                checkMutation.reset();
              }
            }}
            onBlur={() => setPhoneTouched(true)}
            aria-invalid={phoneInputError !== null}
            className={`h-10 px-3 rounded-lg bg-surface-elevated border text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 transition-all ${
              phoneInputError
                ? "border-danger focus:ring-danger-light"
                : "border-border-default focus:ring-primary-400"
            }`}
          />
          {phoneInputError && <p className="text-xs text-danger">{phoneInputError}</p>}
          {phoneDigits.length >= CHECK_PHONE_MIN_DIGITS && (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                {showHint ? (
                  <PhoneCheckHint data={checkMutation.data} />
                ) : (
                  <p className="text-xs text-txt-muted">
                    Confira se este número usa WhatsApp.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCheck}
                disabled={!canCheck}
                className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-primary-600 hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {checkMutation.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  checkLabel
                )}
              </button>
            </div>
          )}
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
          <Select
            value={agentId}
            onValueChange={(v) => setAgentId(v ?? NO_RESPONSAVEL)}
          >
            <SelectTrigger
              id="new-contact-agent"
              className="!h-10 w-full px-3 rounded-lg bg-surface-elevated border-border-default text-sm text-txt-primary focus-visible:ring-primary-400/50 focus-visible:border-primary-400"
            >
              <SelectValue>
                {(value) => {
                  if (value === NO_RESPONSAVEL || value == null) {
                    return "Sem responsável";
                  }
                  return users.find((u) => u.id === value)?.name ?? "Sem responsável";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className="bg-surface-card text-txt-primary"
            >
              <SelectItem value={NO_RESPONSAVEL}>Sem responsável</SelectItem>
              {users.length > 0 && <SelectSeparator />}
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
