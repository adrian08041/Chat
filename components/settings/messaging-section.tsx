"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleRow } from "@/components/settings/toggle-row";

interface MessagingSettings {
  autoResponse: boolean;
  readReceipts: boolean;
  typingIndicator: boolean;
  maxMessageLength: number;
}

const INITIAL: MessagingSettings = {
  autoResponse: false,
  readReceipts: true,
  typingIndicator: true,
  maxMessageLength: 4096,
};

export function MessagingSection() {
  const [settings, setSettings] = useState<MessagingSettings>(INITIAL);

  const toggle = <K extends keyof MessagingSettings>(key: K) =>
    (value: MessagingSettings[K]) =>
      setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">Mensagens</h2>

      <Card className="border-border-default">
        <CardContent>
          <ToggleRow
            label="Resposta automática"
            description="Enviar mensagem automática fora do horário"
            checked={settings.autoResponse}
            onCheckedChange={toggle("autoResponse")}
          />
          <ToggleRow
            label="Confirmação de leitura"
            description="Mostrar quando você leu as mensagens"
            checked={settings.readReceipts}
            onCheckedChange={toggle("readReceipts")}
          />
          <ToggleRow
            label="Indicador de digitação"
            description="Mostrar quando você está digitando"
            checked={settings.typingIndicator}
            onCheckedChange={toggle("typingIndicator")}
          />

          <div className="py-3 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-3 gap-4">
              <div>
                <p className="font-medium text-sm text-txt-primary mb-0.5">
                  Tamanho máximo de mensagem
                </p>
                <p className="text-sm text-txt-muted">
                  Limite de caracteres por mensagem
                </p>
              </div>
              <span className="text-sm font-bold text-txt-primary tabular-nums">
                {settings.maxMessageLength}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={10000}
              step={100}
              value={settings.maxMessageLength}
              onChange={(e) =>
                toggle("maxMessageLength")(parseInt(e.target.value, 10))
              }
              className="w-full h-2 bg-neutral-50 rounded-lg appearance-none cursor-pointer accent-primary-600"
              aria-label="Tamanho máximo de mensagem"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              size="lg"
              onClick={() => toast.success("Configurações de mensagens salvas!")}
            >
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
