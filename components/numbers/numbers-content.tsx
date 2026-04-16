"use client";

import { useState, useCallback } from "react";
import { MessageSquare, QrCode, Pencil, UserRound, Plus } from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { EditNumberDrawer } from "@/components/numbers/edit-number-drawer";
import { QrCodeSheet } from "@/components/numbers/qr-code-sheet";
import { ConnectNumberSheet } from "@/components/numbers/connect-number-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MOCK_NUMBERS } from "@/lib/mock-data";
import type { NumberCardData, InstanceStatus } from "@/types/instance";

function StatusBadge({ status }: { status: InstanceStatus }) {
  const isConnected = status === "CONNECTED";
  return (
    <span
      className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isConnected ? "bg-success-light text-success" : "bg-danger-light text-danger"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isConnected ? "bg-success" : "bg-danger"
        }`}
      />
      {isConnected ? "Conectado" : "Desconectado"}
    </span>
  );
}

function NumberCard({
  data,
  onEdit,
  onQrCode,
  onDisconnect,
  onReconnect,
}: {
  data: NumberCardData;
  onEdit: (data: NumberCardData) => void;
  onQrCode: (data: NumberCardData) => void;
  onDisconnect: (data: NumberCardData) => void;
  onReconnect: (data: NumberCardData) => void;
}) {
  const { instance, activeConversations, assignedAgents } = data;
  const isConnected = instance.status === "CONNECTED";

  return (
    <div className="bg-surface-card rounded-xl border border-border-default p-5 flex flex-col gap-4">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: instance.color }}
          />
          <h2 className="font-headline text-lg font-bold text-txt-primary leading-tight">
            {instance.phone ?? instance.evolutionInstanceName}
          </h2>
        </div>
        <p className="text-sm text-txt-secondary mt-0.5 pl-5">{instance.name}</p>
      </div>

      {/* Badge de status */}
      <StatusBadge status={instance.status} />

      {/* Conversas ativas */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-success-light flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-success" />
        </div>
        <div>
          <p className="text-xs text-txt-muted">Conversas ativas</p>
          <p className="text-lg font-bold text-txt-primary leading-tight">{activeConversations}</p>
        </div>
      </div>

      {/* Atendentes atribuídos */}
      <div>
        <p className="text-xs text-txt-muted mb-2">Atendentes atribuídos</p>
        {assignedAgents.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {assignedAgents.map((agent) => (
              <AvatarInitials key={agent.id} name={agent.name} size="sm" />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-txt-muted">
            <UserRound className="w-4 h-4" />
            <span className="text-xs">Nenhum atendente atribuído</span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
        <button
          onClick={() => onEdit(data)}
          className="flex-1 h-9 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          onClick={() => onQrCode(data)}
          className="w-9 h-9 rounded-lg border border-border-default bg-surface-card hover:bg-surface-elevated transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Ver QR Code"
        >
          <QrCode className="w-4 h-4 text-txt-secondary" />
        </button>
        {isConnected ? (
          <button
            onClick={() => onDisconnect(data)}
            className="px-3 h-9 rounded-lg border border-danger bg-surface-card text-sm font-medium text-danger hover:bg-danger-light transition-colors flex-shrink-0"
          >
            Desconectar
          </button>
        ) : (
          <button
            onClick={() => onReconnect(data)}
            className="px-3 h-9 rounded-lg border border-primary-600 bg-surface-card text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex-shrink-0"
          >
            Reconectar
          </button>
        )}
      </div>
    </div>
  );
}

export function NumbersContent() {
  const [numbers, setNumbers] = useState(MOCK_NUMBERS);
  const [editTarget, setEditTarget] = useState<NumberCardData | null>(null);
  const [qrTarget, setQrTarget] = useState<NumberCardData | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<NumberCardData | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const handleEdit = useCallback((data: NumberCardData) => setEditTarget(data), []);
  const handleCloseEdit = useCallback(() => setEditTarget(null), []);

  const handleSaveEdit = useCallback((updated: NumberCardData) => {
    setNumbers((prev) =>
      prev.map((n) => (n.instance.id === updated.instance.id ? updated : n))
    );
  }, []);

  const handleQrCode = useCallback((data: NumberCardData) => setQrTarget(data), []);
  const handleCloseQr = useCallback(() => setQrTarget(null), []);

  const handleDisconnect = useCallback((data: NumberCardData) => setDisconnectTarget(data), []);

  const handleConfirmDisconnect = useCallback(() => {
    if (!disconnectTarget) return;
    setNumbers((prev) =>
      prev.map((n) =>
        n.instance.id === disconnectTarget.instance.id
          ? { ...n, instance: { ...n.instance, status: "DISCONNECTED" as const }, activeConversations: 0 }
          : n
      )
    );
    setDisconnectTarget(null);
  }, [disconnectTarget]);

  const handleReconnect = useCallback((data: NumberCardData) => setQrTarget(data), []);

  const handleSimulateReconnect = useCallback((id: string) => {
    setNumbers((prev) =>
      prev.map((n) =>
        n.instance.id === id
          ? { ...n, instance: { ...n.instance, status: "CONNECTED" as const } }
          : n
      )
    );
  }, []);

  const handleCancelDisconnect = useCallback(() => setDisconnectTarget(null), []);
  const handleCloseConnect = useCallback(() => setShowConnect(false), []);

  const handleConnect = useCallback((newData: NumberCardData) => {
    setNumbers((prev) => [...prev, newData]);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-txt-primary">Números Conectados</h2>
          <p className="text-sm text-txt-muted mt-1">
            Gerencie os números de WhatsApp conectados à plataforma
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

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {numbers.map((data) => (
          <NumberCard
            key={data.instance.id}
            data={data}
            onEdit={handleEdit}
            onQrCode={handleQrCode}
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
          />
        ))}
      </div>

      {/* Drawer de edição */}
      <EditNumberDrawer
        key={editTarget?.instance.id ?? "none"}
        data={editTarget}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />

      {/* Sheet de QR Code */}
      <QrCodeSheet
        data={qrTarget}
        onClose={handleCloseQr}
        onReconnect={handleSimulateReconnect}
      />

      {/* Sheet de novo número */}
      <ConnectNumberSheet
        open={showConnect}
        onClose={handleCloseConnect}
        onConnect={handleConnect}
      />

      {/* Dialog de confirmação de desconexão */}
      <ConfirmDialog
        open={disconnectTarget !== null}
        title="Desconectar número"
        description={
          <>
            Tem certeza que deseja desconectar{" "}
            <strong>{disconnectTarget?.instance.name}</strong>? As conversas
            ativas serão pausadas.
          </>
        }
        confirmLabel="Desconectar"
        onConfirm={handleConfirmDisconnect}
        onCancel={handleCancelDisconnect}
      />
    </div>
  );
}
