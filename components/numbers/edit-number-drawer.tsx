"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { INSTANCE_COLORS } from "@/lib/constants";
import { MOCK_AGENTS } from "@/lib/mock-data";
import type { NumberCardData } from "@/types/instance";

interface EditNumberDrawerProps {
  data: NumberCardData | null;
  onClose: () => void;
  onSave: (updated: NumberCardData) => void;
}

export function EditNumberDrawer({ data, onClose, onSave }: EditNumberDrawerProps) {
  const [name, setName] = useState(() => data?.instance.name ?? "");
  const [color, setColor] = useState<string>(() => data?.instance.color ?? INSTANCE_COLORS[0].value);
  const [agents, setAgents] = useState(() => data?.assignedAgents ?? []);
  const [addingAgent, setAddingAgent] = useState(false);

  const availableAgents = MOCK_AGENTS.filter(
    (a) => !agents.some((ag) => ag.id === a.id)
  );

  const handleRemoveAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleAddAgent = useCallback((id: string) => {
    const agent = MOCK_AGENTS.find((a) => a.id === id);
    if (!agent) return;
    setAgents((prev) => [...prev, agent]);
    setAddingAgent(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!data) return;
    onSave({
      ...data,
      instance: { ...data.instance, name, color },
      assignedAgents: agents,
    });
    onClose();
  }, [data, name, color, agents, onSave, onClose]);

  return (
    <Sheet open={data !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {data && (
          <>
            <SheetHeader className="border-b border-border-default pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
                  Editar Número
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
                {data.instance.phone ?? data.instance.evolutionInstanceName}
              </p>
            </SheetHeader>

            <div className="flex-1 flex flex-col gap-6 p-4">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-number-name" className="text-xs font-medium text-txt-secondary">
                  Nome do número
                </label>
                <input
                  id="edit-number-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
              </div>

              {/* Cor identificadora */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-txt-secondary">
                  Cor identificadora
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {INSTANCE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      style={{ backgroundColor: c.value }}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                        color === c.value ? "ring-2 ring-offset-2 ring-neutral-400 scale-110" : ""
                      }`}
                      aria-label={`Cor ${c.name}`}
                    />
                  ))}
                </div>
              </div>

              {/* Atendentes atribuídos */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-txt-secondary">
                  Atendentes atribuídos
                </label>

                {agents.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-elevated"
                      >
                        <div className="flex items-center gap-2">
                          <AvatarInitials name={agent.name} size="sm" />
                          <span className="text-sm text-txt-primary">{agent.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAgent(agent.id)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-danger-light transition-colors"
                          aria-label={`Remover ${agent.name}`}
                        >
                          <X className="w-3.5 h-3.5 text-txt-muted hover:text-danger" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-txt-muted py-2">Nenhum atendente atribuído</p>
                )}

                {addingAgent ? (
                  <select
                    autoFocus
                    defaultValue=""
                    onChange={(e) => handleAddAgent(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="" disabled>Selecionar atendente...</option>
                    {availableAgents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                ) : (
                  availableAgents.length > 0 && (
                    <button
                      onClick={() => setAddingAgent(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-400 transition-colors self-start"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar atendente
                    </button>
                  )
                )}
              </div>
            </div>

            <SheetFooter className="border-t border-border-default pt-4 flex flex-row gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
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
