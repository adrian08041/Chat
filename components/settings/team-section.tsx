"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, MailCheck, Pencil, Trash2 } from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InviteMemberSheet } from "@/components/settings/invite-member-sheet";
import { EditMemberSheet } from "@/components/settings/edit-member-sheet";
import { formatRelativeTime } from "@/lib/format";
import { CURRENT_USER, MOCK_TEAM_MEMBERS } from "@/lib/mock-data";
import type { TeamMember, TeamMemberStatus, UserRole } from "@/types/user";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  AGENT: "Atendente",
};

const STATUS_LABEL: Record<TeamMemberStatus, string> = {
  ACTIVE: "Ativo",
  PENDING: "Pendente",
  INACTIVE: "Inativo",
};

const FILTER_TABS: { key: "all" | UserRole; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "ADMIN", label: "Administradores" },
  { key: "SUPERVISOR", label: "Supervisores" },
  { key: "AGENT", label: "Atendentes" },
];

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    ADMIN: "bg-primary-50 text-primary-600",
    SUPERVISOR: "bg-info/10 text-info",
    AGENT: "bg-surface-elevated text-txt-secondary",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role]}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: TeamMemberStatus }) {
  const styles: Record<TeamMemberStatus, { dot: string; pill: string }> = {
    ACTIVE: { dot: "bg-success", pill: "bg-success-light text-success" },
    PENDING: { dot: "bg-warning", pill: "bg-warning-light text-warning" },
    INACTIVE: { dot: "bg-txt-muted", pill: "bg-surface-elevated text-txt-muted" },
  };
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

interface MemberRowProps {
  member: TeamMember;
  isCurrentUser: boolean;
  onEdit: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onResendInvite: (member: TeamMember) => void;
}

function MemberRow({
  member,
  isCurrentUser,
  onEdit,
  onRemove,
  onResendInvite,
}: MemberRowProps) {
  const lastActiveLabel =
    member.memberStatus === "PENDING"
      ? "Convite pendente"
      : member.lastActiveAt
        ? formatRelativeTime(member.lastActiveAt)
        : "Nunca acessou";

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <AvatarInitials name={member.name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-txt-primary truncate">
              {member.name}
              {isCurrentUser && (
                <span className="ml-2 text-xs font-normal text-txt-muted">(Você)</span>
              )}
            </p>
            <p className="text-xs text-txt-muted truncate">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <RoleBadge role={member.role} />
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={member.memberStatus} />
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-txt-secondary">{lastActiveLabel}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {member.memberStatus === "PENDING" && (
            <button
              onClick={() => onResendInvite(member)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
            >
              <MailCheck className="w-3.5 h-3.5" />
              Reenviar
            </button>
          )}
          <button
            onClick={() => onEdit(member)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-card border border-border-default transition-colors"
            aria-label={`Editar ${member.name}`}
          >
            <Pencil className="w-4 h-4 text-txt-secondary" />
          </button>
          <button
            onClick={() => onRemove(member)}
            disabled={isCurrentUser}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-light hover:bg-danger-light/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Remover ${member.name}`}
            title={isCurrentUser ? "Você não pode remover a si mesmo" : undefined}
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | UserRole>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const activeAdminCount = useMemo(
    () =>
      members.filter((m) => m.role === "ADMIN" && m.memberStatus === "ACTIVE")
        .length,
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return members.filter((m) => {
      if (q) {
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesEmail = m.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }
      if (activeFilter !== "all" && m.role !== activeFilter) return false;
      return true;
    });
  }, [members, searchTerm, activeFilter]);

  const counts = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.memberStatus === "ACTIVE").length,
      pending: members.filter((m) => m.memberStatus === "PENDING").length,
    }),
    [members]
  );

  const handleInvite = useCallback((member: TeamMember) => {
    setMembers((prev) => [member, ...prev]);
    setInviteOpen(false);
    toast.success(`Convite enviado para ${member.email}`);
  }, []);

  const handleEdit = useCallback((member: TeamMember) => {
    setEditTarget(member);
  }, []);

  const handleSaveEdit = useCallback((updated: TeamMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    toast.success(`${updated.name} atualizado`);
  }, []);

  const handleRequestRemove = useCallback((member: TeamMember) => {
    setRemoveTarget(member);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (!removeTarget) return;
    setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
    toast.success(`${removeTarget.name} removido da equipe`);
    setRemoveTarget(null);
  }, [removeTarget]);

  const handleResendInvite = useCallback((member: TeamMember) => {
    toast.success(`Convite reenviado para ${member.email}`);
  }, []);

  const removeWouldLeaveNoAdmin =
    removeTarget?.role === "ADMIN" &&
    removeTarget.memberStatus === "ACTIVE" &&
    activeAdminCount <= 1;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-headline text-xl font-bold text-txt-primary">Equipe</h2>
          <p className="text-sm text-txt-muted mt-1">
            {counts.total} {counts.total === 1 ? "membro" : "membros"} · {counts.active} ativo
            {counts.active === 1 ? "" : "s"}
            {counts.pending > 0 && ` · ${counts.pending} pendente${counts.pending === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Convidar Membro
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            aria-label="Buscar membros"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body"
          />
        </div>

        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtrar por função">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeFilter === tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-primary-600 text-txt-on-primary"
                  : "bg-surface-elevated text-txt-secondary hover:bg-surface-card"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-card rounded-xl border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Membro
                </th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Função
                </th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Última atividade
                </th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isCurrentUser={member.id === CURRENT_USER.id}
                  onEdit={handleEdit}
                  onRemove={handleRequestRemove}
                  onResendInvite={handleResendInvite}
                />
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-txt-muted">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteMemberSheet
        open={inviteOpen}
        existingMembers={members}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      <EditMemberSheet
        key={editTarget?.id ?? "none"}
        member={editTarget}
        canDemoteAdmin={activeAdminCount > 1}
        isCurrentUser={editTarget?.id === CURRENT_USER.id}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remover membro"
        description={
          removeWouldLeaveNoAdmin ? (
            <>
              Não é possível remover <strong>{removeTarget?.name}</strong>. Ele(a) é o
              último administrador ativo do workspace.
            </>
          ) : (
            <>
              Tem certeza que deseja remover <strong>{removeTarget?.name}</strong> da equipe? O
              acesso dele(a) será revogado imediatamente.
            </>
          )
        }
        confirmLabel={removeWouldLeaveNoAdmin ? "Entendi" : "Remover"}
        cancelLabel={removeWouldLeaveNoAdmin ? "Fechar" : "Cancelar"}
        variant={removeWouldLeaveNoAdmin ? "primary" : "danger"}
        onConfirm={
          removeWouldLeaveNoAdmin ? () => setRemoveTarget(null) : handleConfirmRemove
        }
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
