"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { AvatarInitials } from "@/components/chat/avatar-initials";
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

interface EditMemberSheetProps {
  member: TeamMember | null;
  canDemoteAdmin: boolean;
  isCurrentUser: boolean;
  onClose: () => void;
  onSave: (updated: TeamMember) => void;
}

export function EditMemberSheet({
  member,
  canDemoteAdmin,
  isCurrentUser,
  onClose,
  onSave,
}: EditMemberSheetProps) {
  const [name, setName] = useState(() => member?.name ?? "");
  const [role, setRole] = useState<UserRole>(() => member?.role ?? "AGENT");

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0;

  const handleSave = useCallback(() => {
    if (!member || !canSubmit) return;
    onSave({ ...member, name: trimmedName, role });
    onClose();
  }, [member, trimmedName, role, canSubmit, onSave, onClose]);

  const isDemotingLastAdmin =
    member?.role === "ADMIN" &&
    member?.memberStatus === "ACTIVE" &&
    role !== "ADMIN" &&
    !canDemoteAdmin;

  return (
    <Sheet open={member !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {member && (
          <>
            <SheetHeader className="border-b border-border-default pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
                  Editar Membro
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
              <div className="flex items-center gap-3">
                <AvatarInitials name={member.name} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-txt-primary truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-txt-muted truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-member-name" className="text-xs font-medium text-txt-secondary">
                  Nome
                </label>
                <input
                  id="edit-member-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-txt-secondary">Função</span>
                <div className="flex flex-col gap-2">
                  {ROLE_OPTIONS.map((option) => {
                    const selected = role === option.value;
                    const wouldLeaveNoAdmin =
                      member.role === "ADMIN" &&
                      member.memberStatus === "ACTIVE" &&
                      option.value !== "ADMIN" &&
                      !canDemoteAdmin;
                    const disabled = wouldLeaveNoAdmin;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !disabled && setRole(option.value)}
                        aria-pressed={selected}
                        disabled={disabled}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          selected
                            ? "border-primary-600 bg-primary-50"
                            : "border-border-default bg-surface-card hover:bg-surface-elevated"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            selected ? "text-primary-600" : "text-txt-primary"
                          }`}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs text-txt-muted mt-0.5">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {isDemotingLastAdmin && (
                  <p className="text-xs text-danger">
                    Não é possível rebaixar o último administrador do workspace.
                  </p>
                )}
                {isCurrentUser && member.role === "ADMIN" && canDemoteAdmin && (
                  <p className="text-xs text-txt-muted">
                    Atenção: você está editando sua própria função.
                  </p>
                )}
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
                onClick={handleSave}
                disabled={!canSubmit || isDemotingLastAdmin}
                className="flex-1 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar alterações
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
