"use client";

import { useCallback, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { INSTANCE_COLORS } from "@/lib/constants";
import { ApiClientError } from "@/lib/api-client";
import { useUpdateInstance } from "@/lib/hooks/use-instances";
import type { WhatsAppInstance } from "@/types/instance";

interface EditNumberDrawerProps {
  instance: WhatsAppInstance | null;
  onClose: () => void;
}

export function EditNumberDrawer({ instance, onClose }: EditNumberDrawerProps) {
  return (
    <Sheet
      open={instance !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {instance && <EditForm instance={instance} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

interface EditFormProps {
  instance: WhatsAppInstance;
  onClose: () => void;
}

function EditForm({ instance, onClose }: EditFormProps) {
  const [name, setName] = useState(instance.name);
  const [color, setColor] = useState(instance.color);
  const [msgDelayMin, setMsgDelayMin] = useState(instance.msgDelayMin);
  const [msgDelayMax, setMsgDelayMax] = useState(instance.msgDelayMax);

  const updateMutation = useUpdateInstance();

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync({
        id: instance.id,
        name,
        color,
        msgDelayMin,
        msgDelayMax,
      });
      toast.success("Alterações salvas");
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Falha ao salvar";
      toast.error(message);
    }
  }, [updateMutation, instance.id, name, color, msgDelayMin, msgDelayMax, onClose]);

  const submitting = updateMutation.isPending;

  return (
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
          {instance.phone ?? instance.uazapiInstanceId}
        </p>
      </SheetHeader>

      <div className="flex-1 flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="edit-number-name"
            className="text-xs font-medium text-txt-secondary"
          >
            Nome do número
          </label>
          <input
            id="edit-number-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-txt-secondary">
            Cor identificadora
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {INSTANCE_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                disabled={submitting}
                style={{ backgroundColor: c.value }}
                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 disabled:opacity-60 ${
                  color === c.value
                    ? "ring-2 ring-offset-2 ring-neutral-400 scale-110"
                    : ""
                }`}
                aria-label={`Cor ${c.name}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-txt-secondary">
            Delay entre mensagens (segundos)
          </p>
          <p className="text-xs text-txt-muted leading-relaxed">
            Anti-ban: UazApi espera um valor aleatório entre mín. e máx. antes
            de cada envio.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-delay-min"
                className="text-xs text-txt-muted"
              >
                Mínimo
              </label>
              <input
                id="edit-delay-min"
                type="number"
                min={0}
                max={60}
                value={msgDelayMin}
                onChange={(e) => setMsgDelayMin(Number(e.target.value))}
                disabled={submitting}
                className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all disabled:opacity-60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-delay-max"
                className="text-xs text-txt-muted"
              >
                Máximo
              </label>
              <input
                id="edit-delay-max"
                type="number"
                min={0}
                max={120}
                value={msgDelayMax}
                onChange={(e) => setMsgDelayMax(Number(e.target.value))}
                disabled={submitting}
                className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      <SheetFooter className="border-t border-border-default pt-4 flex flex-row gap-2">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 h-10 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={
            !name.trim() || msgDelayMin > msgDelayMax || submitting
          }
          className="flex-1 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Salvando..." : "Salvar alterações"}
        </button>
      </SheetFooter>
    </>
  );
}
