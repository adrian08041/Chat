"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  QrCode,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  Phone,
  AlertTriangle,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { EditNumberDrawer } from "@/components/numbers/edit-number-drawer";
import { QrCodeSheet } from "@/components/numbers/qr-code-sheet";
import { ConnectNumberSheet } from "@/components/numbers/connect-number-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError } from "@/lib/api-client";
import {
  useCancelSyncContacts,
  useDeleteInstance,
  useDisconnectInstance,
  useInstances,
  useStartSyncContacts,
  useSyncContactsStatus,
} from "@/lib/hooks/use-instances";
import type { InstanceStatus, WhatsAppInstance } from "@/types/instance";

const STATUS_LABEL: Record<InstanceStatus, string> = {
  CONNECTED: "Conectado",
  CONNECTING: "Conectando...",
  DISCONNECTED: "Desconectado",
  ERROR: "Erro",
};

const STATUS_STYLES: Record<InstanceStatus, { pill: string; dot: string }> = {
  CONNECTED: { pill: "bg-success-light text-success", dot: "bg-success" },
  CONNECTING: { pill: "bg-warning-light text-warning", dot: "bg-warning animate-pulse" },
  DISCONNECTED: { pill: "bg-danger-light text-danger", dot: "bg-danger" },
  ERROR: { pill: "bg-danger-light text-danger", dot: "bg-danger" },
};

function StatusBadge({ status }: { status: InstanceStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

interface NumberCardProps {
  instance: WhatsAppInstance;
  onEdit: (instance: WhatsAppInstance) => void;
  onQrCode: (instance: WhatsAppInstance) => void;
  onDisconnect: (instance: WhatsAppInstance) => void;
  onDelete: (instance: WhatsAppInstance) => void;
}

function NumberCard({
  instance,
  onEdit,
  onQrCode,
  onDisconnect,
  onDelete,
}: NumberCardProps) {
  const isConnected = instance.status === "CONNECTED";

  return (
    <div className="bg-surface-card rounded-xl border border-border-default p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: instance.color }}
          />
          <h2 className="font-headline text-lg font-bold text-txt-primary leading-tight">
            {instance.phone ?? instance.name}
          </h2>
        </div>
        <p className="text-sm text-txt-secondary mt-0.5 pl-5">{instance.name}</p>
      </div>

      <StatusBadge status={instance.status} />

      <div className="flex items-center gap-3 text-xs text-txt-muted">
        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">
          {instance.phone ?? "Aguardando conexão"}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
        <button
          onClick={() => onEdit(instance)}
          className="flex-1 h-9 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          onClick={() => onQrCode(instance)}
          className="w-9 h-9 rounded-lg border border-border-default bg-surface-card hover:bg-surface-elevated transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Ver QR Code / Reconectar"
          title="QR Code"
        >
          <QrCode className="w-4 h-4 text-txt-secondary" />
        </button>
        {isConnected ? (
          <button
            onClick={() => onDisconnect(instance)}
            className="px-3 h-9 rounded-lg border border-danger bg-surface-card text-sm font-medium text-danger hover:bg-danger-light transition-colors flex-shrink-0"
          >
            Desconectar
          </button>
        ) : (
          <button
            onClick={() => onQrCode(instance)}
            className="px-3 h-9 rounded-lg border border-primary-600 bg-surface-card text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex-shrink-0"
          >
            Reconectar
          </button>
        )}
        <button
          onClick={() => onDelete(instance)}
          className="w-9 h-9 rounded-lg bg-danger-light hover:bg-danger-light/80 transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Remover número"
          title="Remover"
        >
          <Trash2 className="w-4 h-4 text-danger" />
        </button>
      </div>

      {isConnected && <SyncContactsRow instanceId={instance.id} />}
    </div>
  );
}

function SyncContactsRow({ instanceId }: { instanceId: string }) {
  const queryClient = useQueryClient();
  // Status query só liga após primeiro click — evita GET inicial em cada card
  // connected do /numeros. Uma vez habilitada, fica até desmontar.
  const [statusEnabled, setStatusEnabled] = useState(false);
  const { data } = useSyncContactsStatus(instanceId, { enabled: statusEnabled });
  const startMutation = useStartSyncContacts();
  const cancelMutation = useCancelSyncContacts();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const job = data?.job ?? null;
  const isRunning = job?.status === "running";

  // Detecta transições terminais pra invalidar contacts e mostrar toast.
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev === "running") {
      if (job?.status === "done") {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast.success(
          `Importação concluída: ${job.imported} novos, ${job.updated} atualizados${
            job.skipped > 0 ? `, ${job.skipped} pulados` : ""
          }`,
        );
      } else if (job?.status === "cancelled") {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast.info(
          `Importação cancelada: ${job.imported} novos, ${job.updated} atualizados antes de parar`,
        );
      } else if (job?.status === "error") {
        toast.error(
          `Falha ao importar: ${job.errorMessage ?? "erro desconhecido"}`,
        );
      }
    }
    prevStatusRef.current = job?.status ?? null;
  }, [
    job?.status,
    job?.imported,
    job?.updated,
    job?.skipped,
    job?.errorMessage,
    queryClient,
  ]);

  const handleConfirmStart = useCallback(() => {
    setConfirmOpen(false);
    setStatusEnabled(true);
    startMutation.mutate(instanceId, {
      onSuccess: (result) => {
        if (result.alreadyRunning) {
          toast.info("Importação já em andamento");
        } else {
          toast.info("Importação iniciada");
        }
      },
      onError: (err) => {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Falha ao iniciar importação";
        toast.error(message);
      },
    });
  }, [instanceId, startMutation]);

  const handleCancel = useCallback(() => {
    cancelMutation.mutate(instanceId, {
      onError: (err) => {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Falha ao cancelar importação";
        toast.error(message);
      },
    });
  }, [instanceId, cancelMutation]);

  const progressPct =
    isRunning && job && job.total > 0
      ? Math.min(100, Math.round((job.fetched / job.total) * 100))
      : 0;

  return (
    <>
      <div className="pt-3 border-t border-border-subtle">
        {isRunning ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-txt-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Importando contatos…
              </span>
              <span className="font-medium">
                {job.fetched}
                {job.total > 0 ? ` / ${job.total}` : ""}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="w-full h-8 rounded-lg border border-border-default bg-surface-card text-xs font-medium text-txt-secondary hover:bg-surface-elevated transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
              Cancelar importação
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={startMutation.isPending}
            className="w-full h-9 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {startMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Importar contatos
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Importar contatos do WhatsApp"
        description={
          <>
            Vai importar todos os contatos das conversas deste número. Contatos
            já existentes mantêm o nome editado; foto de perfil é atualizada.
            Pode levar alguns minutos.
          </>
        }
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        variant="primary"
        onConfirm={handleConfirmStart}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

export function NumbersContent() {
  const { data: instances = [], isLoading, error } = useInstances();
  const disconnectMutation = useDisconnectInstance();
  const deleteMutation = useDeleteInstance();

  const [editTarget, setEditTarget] = useState<WhatsAppInstance | null>(null);
  const [qrTarget, setQrTarget] = useState<WhatsAppInstance | null>(null);
  const [disconnectTarget, setDisconnectTarget] =
    useState<WhatsAppInstance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppInstance | null>(
    null,
  );
  const [showConnect, setShowConnect] = useState(false);

  const handleEdit = useCallback(
    (instance: WhatsAppInstance) => setEditTarget(instance),
    [],
  );
  const handleQrCode = useCallback(
    (instance: WhatsAppInstance) => setQrTarget(instance),
    [],
  );
  const handleDisconnect = useCallback(
    (instance: WhatsAppInstance) => setDisconnectTarget(instance),
    [],
  );
  const handleDelete = useCallback(
    (instance: WhatsAppInstance) => setDeleteTarget(instance),
    [],
  );

  const handleConfirmDisconnect = useCallback(() => {
    if (!disconnectTarget) return;
    const target = disconnectTarget;
    setDisconnectTarget(null);
    disconnectMutation.mutate(target.id, {
      onSuccess: () => toast.success(`${target.name} desconectado`),
      onError: (err) => {
        const msg =
          err instanceof ApiClientError ? err.message : "Falha ao desconectar";
        toast.error(msg);
      },
    });
  }, [disconnectTarget, disconnectMutation]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    deleteMutation.mutate(target.id, {
      onSuccess: () => toast.success(`${target.name} removido`),
      onError: (err) => {
        const msg =
          err instanceof ApiClientError ? err.message : "Falha ao remover";
        toast.error(msg);
      },
    });
  }, [deleteTarget, deleteMutation]);

  const handleConnected = useCallback(() => {
    setShowConnect(false);
    // Revalidação automática via onSuccess dos hooks. Nada a fazer aqui.
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-txt-primary">
            Números Conectados
          </h2>
          <p className="text-sm text-txt-muted mt-1">
            {isLoading
              ? "Carregando..."
              : `${instances.length} ${instances.length === 1 ? "número" : "números"}`}
          </p>
        </div>
        <button
          onClick={() => setShowConnect(true)}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Conectar Novo Número
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-danger bg-danger-light/40 text-sm text-danger">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erro ao carregar números</p>
            <p className="text-xs mt-0.5">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
          </div>
        </div>
      )}

      {isLoading && !error && (
        <div className="flex items-center justify-center py-16 text-txt-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!isLoading && !error && instances.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
            <Phone className="w-6 h-6 text-txt-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-txt-primary">
              Nenhum número conectado
            </p>
            <p className="text-xs text-txt-muted mt-1">
              Conecte o primeiro número de WhatsApp da sua equipe.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && instances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <NumberCard
              key={instance.id}
              instance={instance}
              onEdit={handleEdit}
              onQrCode={handleQrCode}
              onDisconnect={handleDisconnect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EditNumberDrawer
        key={editTarget ? `edit-${editTarget.id}` : "edit-none"}
        instance={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <QrCodeSheet
        key={qrTarget ? `qr-${qrTarget.id}` : "qr-none"}
        instance={qrTarget}
        onClose={() => setQrTarget(null)}
      />

      <ConnectNumberSheet
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onConnected={handleConnected}
      />

      <ConfirmDialog
        open={disconnectTarget !== null}
        title="Desconectar número"
        description={
          <>
            Tem certeza que deseja desconectar{" "}
            <strong>{disconnectTarget?.name}</strong>? As conversas ativas
            serão pausadas.
          </>
        }
        confirmLabel="Desconectar"
        variant="danger"
        onConfirm={handleConfirmDisconnect}
        onCancel={() => setDisconnectTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remover número"
        description={
          <>
            Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>?
            O histórico de conversas e mensagens deste número será preservado,
            mas não será mais possível enviar/receber por ele.
          </>
        }
        confirmLabel="Remover"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
