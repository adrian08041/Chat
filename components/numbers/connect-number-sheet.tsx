"use client";

import { useState, useEffect } from "react";
import { X, QrCode, RefreshCw, CheckCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { INSTANCE_COLORS } from "@/lib/constants";
import type { NumberCardData } from "@/types/instance";

type Step = "form" | "qr" | "success";

interface ConnectNumberSheetProps {
  open: boolean;
  onClose: () => void;
  onConnect: (data: NumberCardData) => void;
}

export function ConnectNumberSheet({ open, onClose, onConnect }: ConnectNumberSheetProps) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [color, setColor] = useState<string>(INSTANCE_COLORS[0].value);

  // Reseta o formulário sempre que o sheet abre
  useEffect(() => {
    if (open) {
      setStep("form");
      setName("");
      setPhone("");
      setColor(INSTANCE_COLORS[0].value);
    }
  }, [open]);

  function handleSimulateConnect() {
    const newData: NumberCardData = {
      instance: {
        id: `i${Date.now()}`,
        workspaceId: "w1",
        name,
        phone: phone.trim() || null,
        evolutionInstanceName: name.toLowerCase().replace(/\s+/g, "-"),
        color,
        status: "CONNECTED",
        qrCode: null,
        defaultAssignedUserId: null,
        createdAt: new Date().toISOString(),
      },
      activeConversations: 0,
      assignedAgents: [],
    };
    onConnect(newData);
    setStep("success");
    setTimeout(onClose, 1800);
  }

  const titles: Record<Step, string> = {
    form: "Conectar Novo Número",
    qr: "Escanear QR Code",
    success: "Número conectado!",
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-y-auto"
      >
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

        {/* Step 1 — Formulário */}
        {step === "form" && (
          <>
            <div className="flex-1 flex flex-col gap-5 p-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="connect-number-name" className="text-xs font-medium text-txt-secondary">
                  Nome do número
                </label>
                <input
                  id="connect-number-name"
                  type="text"
                  placeholder="Ex: Vendas SP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="connect-number-phone" className="text-xs font-medium text-txt-secondary">
                  Número de telefone{" "}
                  <span className="text-txt-muted font-normal">(opcional)</span>
                </label>
                <input
                  id="connect-number-phone"
                  type="text"
                  placeholder="+55 00 0 0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
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
                      style={{ backgroundColor: c.value }}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                        color === c.value ? "ring-2 ring-offset-2 ring-neutral-400 scale-110" : ""
                      }`}
                      aria-label={`Cor ${c.name}`}
                    />
                  ))}
                </div>
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
                onClick={() => setStep("qr")}
                disabled={!name.trim()}
                className="flex-1 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gerar QR Code
              </button>
            </SheetFooter>
          </>
        )}

        {/* Step 2 — QR Code */}
        {step === "qr" && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
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

            <SheetFooter className="border-t border-border-default pt-4 flex flex-row gap-2">
              <button
                onClick={() => setStep("form")}
                className="flex-1 h-10 rounded-lg border border-border-default text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleSimulateConnect}
                className="flex-1 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
              >
                Simular conexão
              </button>
            </SheetFooter>
          </>
        )}

        {/* Step 3 — Sucesso */}
        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
            <CheckCircle className="w-16 h-16 text-success" />
            <div className="text-center">
              <p className="text-base font-semibold text-txt-primary">Número conectado!</p>
              <p className="text-sm text-txt-muted mt-1">{name}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
