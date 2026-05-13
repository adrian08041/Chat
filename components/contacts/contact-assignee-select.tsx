"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspaceUsers } from "@/lib/hooks/use-users";

const NO_RESPONSAVEL = "__none__";

interface Props {
  value: string | null;
  onSave: (next: string | null) => Promise<void>;
}

export function ContactAssigneeSelect({ value, onSave }: Props) {
  const { data: users = [] } = useWorkspaceUsers();
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value === NO_RESPONSAVEL ? null : e.target.value;
    setSaving(true);
    try {
      await onSave(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atribuir responsável");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value ?? NO_RESPONSAVEL}
      onChange={handleChange}
      disabled={saving}
      className="h-8 px-2 rounded-md bg-surface-elevated border border-border-default text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-60"
      aria-label="Responsável pelo contato"
    >
      <option value={NO_RESPONSAVEL}>Sem responsável</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );
}
