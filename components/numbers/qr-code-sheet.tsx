"use client";

import { QrCode, X, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { NumberCardData } from "@/types/instance";

interface QrCodeSheetProps {
  data: NumberCardData | null;
  onClose: () => void;
  onReconnect?: (id: string) => void;
}

export function QrCodeSheet({ data, onClose, onReconnect }: QrCodeSheetProps) {
  const isDisconnected = data?.instance.status === "DISCONNECTED";

  return (
    <Sheet open={data !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col"
      >
        {data && (
          <>
            <SheetHeader className="border-b border-border-default pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
                  {isDisconnected ? "Reconectar número" : "QR Code"}
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
                {data.instance.phone
                  ? `${data.instance.phone} · ${data.instance.name}`
                  : data.instance.name}
              </p>
            </SheetHeader>

            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
              {/* QR Code mock */}
              <div className="w-52 h-52 bg-white rounded-xl border-2 border-border-default flex items-center justify-center shadow-sm">
                <QrCode className="w-40 h-40 text-txt-primary" />
              </div>

              <div className="text-center space-y-1.5">
                <p className="text-sm font-medium text-txt-primary">
                  Escaneie com o WhatsApp
                </p>
                <p className="text-xs text-txt-muted leading-relaxed">
                  Abra o WhatsApp &rsaquo; Menu &rsaquo; Dispositivos conectados
                  &rsaquo; Conectar dispositivo
                </p>
              </div>

              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-400 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                Gerar novo QR Code
              </button>
            </div>

            <div className="p-4 border-t border-border-default flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-border-default text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
              >
                Fechar
              </button>
              {isDisconnected && onReconnect && (
                <button
                  onClick={() => {
                    onReconnect(data.instance.id);
                    onClose();
                  }}
                  className="flex-1 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
                >
                  Simular reconexão
                </button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
