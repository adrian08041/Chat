"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { QrCode, X, RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiClientError } from "@/lib/api-client";
import {
  useConnectInstance,
  useInstanceStatus,
} from "@/lib/hooks/use-instances";
import type { ConnectInstanceResult, WhatsAppInstance } from "@/types/instance";

interface QrCodeContentProps {
  instance: WhatsAppInstance;
  onClose: () => void;
}

function QrCodeContent({ instance, onClose }: QrCodeContentProps) {
  const [connectResult, setConnectResult] =
    useState<ConnectInstanceResult | null>(null);

  const connectMutation = useConnectInstance();
  const { data: statusData } = useInstanceStatus(
    instance.id,
    connectResult !== null,
  );

  // connected é derivado do status da query.
  const connected = statusData?.status === "CONNECTED";

  // Dispara connect assim que a sheet abre (fluxo de reconnect).
  useEffect(() => {
    let cancelled = false;
    connectMutation
      .mutateAsync(instance.id)
      .then((result) => {
        if (!cancelled) setConnectResult(result);
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof ApiClientError ? error.message : "Falha ao gerar QR";
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance.id]);

  useEffect(() => {
    if (!connected) return;
    toast.success(`${instance.name} conectado`);
    const timeout = setTimeout(onClose, 1500);
    return () => clearTimeout(timeout);
  }, [connected, instance.name, onClose]);

  async function handleRegenerate() {
    try {
      const result = await connectMutation.mutateAsync(instance.id);
      setConnectResult(result);
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Falha ao gerar QR";
      toast.error(message);
    }
  }

  return (
    <>
      <SheetHeader className="border-b border-border-default pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
            {connected ? "Conectado!" : "Reconectar número"}
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
          {instance.phone ? `${instance.phone} · ${instance.name}` : instance.name}
        </p>
      </SheetHeader>

      {connected ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <CheckCircle className="w-16 h-16 text-success" />
          <p className="text-base font-semibold text-txt-primary">Conectado!</p>
        </div>
      ) : (
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
              ) : connectMutation.isPending ? (
                <Loader2 className="w-10 h-10 text-txt-muted animate-spin" />
              ) : (
                <QrCode className="w-40 h-40 text-txt-primary" />
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
              onClick={handleRegenerate}
              disabled={connectMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-400 transition-colors disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${connectMutation.isPending ? "animate-spin" : ""}`}
              />
              Gerar novo QR Code
            </button>
          </div>

          <div className="p-4 border-t border-border-default">
            <button
              onClick={onClose}
              className="w-full h-10 rounded-lg border border-border-default text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </>
  );
}

interface QrCodeSheetProps {
  instance: WhatsAppInstance | null;
  onClose: () => void;
}

export function QrCodeSheet({ instance, onClose }: QrCodeSheetProps) {
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
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col"
      >
        {instance && <QrCodeContent instance={instance} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
