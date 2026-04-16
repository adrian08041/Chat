"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleRow } from "@/components/settings/toggle-row";

interface PrivacySettings {
  shareAnalytics: boolean;
  showOnlineStatus: boolean;
}

const INITIAL: PrivacySettings = {
  shareAnalytics: true,
  showOnlineStatus: true,
};

export function PrivacySection() {
  const [settings, setSettings] = useState<PrivacySettings>(INITIAL);

  const toggle = (key: keyof PrivacySettings) => (checked: boolean) =>
    setSettings((s) => ({ ...s, [key]: checked }));

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">
        Privacidade e Dados
      </h2>

      <Card className="border-border-default">
        <CardContent>
          <ToggleRow
            label="Compartilhar dados de análise"
            description="Ajude a melhorar o produto compartilhando dados de uso"
            checked={settings.shareAnalytics}
            onCheckedChange={toggle("shareAnalytics")}
          />
          <ToggleRow
            label="Mostrar status online"
            description="Permitir que outros vejam quando você está online"
            checked={settings.showOnlineStatus}
            onCheckedChange={toggle("showOnlineStatus")}
            lastItem
          />
        </CardContent>
      </Card>

      <Card className="border-border-default">
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-headline font-semibold text-sm text-txt-primary mb-1">
              Exportar Dados
            </h3>
            <p className="text-sm text-txt-muted">
              Baixe uma cópia de todos os seus dados da plataforma
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              toast.success(
                "Exportação de dados iniciada! Você receberá um email quando estiver pronto."
              )
            }
          >
            <Download />
            Solicitar Exportação
          </Button>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-headline font-semibold text-sm text-txt-primary mb-1">
              Excluir Conta
            </h3>
            <p className="text-sm text-txt-muted">
              Excluir permanentemente sua conta e todos os dados associados
            </p>
          </div>
          <Button
            variant="destructive"
            size="lg"
            onClick={() =>
              toast.error(
                "Funcionalidade de exclusão de conta desabilitada nesta demonstração."
              )
            }
          >
            <Trash2 />
            Excluir Minha Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
