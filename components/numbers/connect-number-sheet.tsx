"use client";

import { useEffect, useMemo, useState } from "react";
import { X, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
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
import {
  useConnectInstance,
  useCreateInstance,
  useInstanceStatus,
} from "@/lib/hooks/use-instances";
import type { ConnectInstanceResult, WhatsAppInstance } from "@/types/instance";

type Step = "form" | "qr" | "success";

interface ConnectFormProps {
  onClose: () => void;
  onConnected: (instance: WhatsAppInstance) => void;
}

// Componente interno: monta fresh a cada abertura do sheet, zerando estado
// sem precisar reset via useEffect.
function ConnectForm({ onClose, onConnected }: ConnectFormProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(INSTANCE_COLORS[0].value);
  const [createdInstance, setCreatedInstance] =
    useState<WhatsAppInstance | null>(null);
  const [connectResult, setConnectResult] =
    useState<ConnectInstanceResult | null>(null);

  const createMutation = useCreateInstance();
  const connectMutation = useConnectInstance();

  // step é derivado — evita setState dentro de useEffect (regra
  // react-hooks/set-state-in-effect do React 19).
  const pollingEnabled =
    createdInstance !== null && connectResult !== null;
  const { data: statusData } = useInstanceStatus(
    createdInstance?.id ?? null,
    pollingEnabled,
  );

  const step: Step = useMemo(() => {
    if (statusData?.status === "CONNECTED") return "success";
    if (connectResult !== null) return "qr";
    return "form";
  }, [statusData, connectResult]);

  useEffect(() => {
    if (step !== "success" || !statusData) return;
    onConnected(statusData);
    const timeout = setTimeout(onClose, 1800);
    return () => clearTimeout(timeout);
  }, [step, statusData, onConnected, onClose]);

  async function handleStart() {
    try {
      const instance = await createMutation.mutateAsync({
        name: name.trim(),
        color,
      });
      setCreatedInstance(instance);
      const connect = await connectMutation.mutateAsync(instance.id);
      setConnectResult(connect);
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Falha ao criar número";
      toast.error(message);
    }
  }

  async function handleRegenerateQr() {
    if (!createdInstance) return;
    try {
      const connect = await connectMutation.mutateAsync(createdInstance.id);
      setConnectResult(connect);
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Falha ao gerar QR";
      toast.error(message);
    }
  }

  const submitting = createMutation.isPending || connectMutation.isPending;

  const titles: Record<Step, string> = {
    form: "Conectar Novo Número",
    qr: "Escanear QR Code",
    success: "Número conectado!",
  };

  return (
    <>
      <SheetHeader className="border-b border-border-default pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
            {titles[step]}
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

      {step === "form" && (
        <>
          <div className="flex-1 flex flex-col gap-5 p-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="connect-number-name"
                className="text-xs font-medium text-txt-secondary"
              >
                Nome do número
              </label>
              <input
                id="connect-number-name"
                type="text"
                placeholder="Ex: Vendas SP"
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

            <p className="text-xs text-txt-muted leading-relaxed">
              O telefone é detectado automaticamente após escanear o QR Code.
            </p>
          </div>

          <SheetFooter className="border-t border-border-default pt-4 flex flex-row gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-10 rounded-lg border border-border-default text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              onClick={handleStart}
              disabled={!name.trim() || submitting}
              className="flex-1 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Criando..." : "Gerar QR Code"}
            </button>
          </SheetFooter>
        </>
      )}

      {step === "qr" && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            <div className="w-52 h-52 bg-white rounded-xl border-2 border-border-default flex items-center justify-center shadow-sm overflow-hidden">
              {connectResult?.qrCode ? (
                <Image
                  src={connectResult.qrCode}
                  alt="QR Code WhatsApp"
                  width={208}
                  height={208}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              ) : (
                <Loader2 className="w-10 h-10 text-txt-muted animate-spin" />
              )}
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-sm font-medium text-txt-primary">
                Escaneie com o WhatsApp
              </p>
              <p className="text-xs text-txt-muted leading-relaxed">
                Abra o WhatsApp &rsaquo; Menu &rsaquo; Dispositivos conectados
                &rsaquo; Conectar dispositivo
              </p>
              {connectResult?.pairingCode && (
                <p className="text-xs text-txt-secondary mt-2">
                  Código de pareamento:{" "}
                  <span className="font-mono font-semibold text-txt-primary">
                    {connectResult.pairingCode}
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={handleRegenerateQr}
              disabled={connectMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-400 transition-colors disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${connectMutation.isPending ? "animate-spin" : ""}`}
              />
              Gerar novo QR Code
            </button>
          </div>

          <SheetFooter className="border-t border-border-default pt-4 flex flex-row gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-border-default text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
            >
              Fechar
            </button>
          </SheetFooter>
        </>
      )}

      {step === "success" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <CheckCircle className="w-16 h-16 text-success" />
          <div className="text-center">
            <p className="text-base font-semibold text-txt-primary">
              Número conectado!
            </p>
            <p className="text-sm text-txt-muted mt-1">
              {statusData?.phone ?? createdInstance?.name ?? name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

interface ConnectNumberSheetProps {
  open: boolean;
  onClose: () => void;
  onConnected: (instance: WhatsAppInstance) => void;
}

export function ConnectNumberSheet({
  open,
  onClose,
  onConnected,
}: ConnectNumberSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
        {open && <ConnectForm onClose={onClose} onConnected={onConnected} />}
      </SheetContent>
    </Sheet>
  );
}
