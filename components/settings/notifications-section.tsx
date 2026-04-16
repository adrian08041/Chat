"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleRow } from "@/components/settings/toggle-row";

interface NotificationSettings {
  newMessages: boolean;
  assignedConversations: boolean;
  mentions: boolean;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
}

const INITIAL: NotificationSettings = {
  newMessages: true,
  assignedConversations: true,
  mentions: true,
  emailNotifications: false,
  desktopNotifications: true,
  soundEnabled: true,
};

const ROWS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  {
    key: "newMessages",
    label: "Novas mensagens",
    description: "Receber notificações de novas mensagens",
  },
  {
    key: "assignedConversations",
    label: "Conversas atribuídas",
    description: "Notificar quando uma conversa for atribuída a você",
  },
  {
    key: "mentions",
    label: "Menções",
    description: "Notificar quando alguém mencionar você",
  },
  {
    key: "emailNotifications",
    label: "Notificações por email",
    description: "Enviar resumos diários por email",
  },
  {
    key: "desktopNotifications",
    label: "Notificações no desktop",
    description: "Mostrar notificações do sistema",
  },
  {
    key: "soundEnabled",
    label: "Som de notificações",
    description: "Ativar som para notificações",
  },
];

export function NotificationsSection() {
  const [settings, setSettings] = useState<NotificationSettings>(INITIAL);

  const toggle = (key: keyof NotificationSettings) => (checked: boolean) => {
    setSettings((s) => ({ ...s, [key]: checked }));
    toast.success("Configuração de notificação atualizada!");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">
        Notificações
      </h2>

      <Card className="border-border-default">
        <CardContent>
          {ROWS.map((row, i) => (
            <ToggleRow
              key={row.key}
              label={row.label}
              description={row.description}
              checked={settings[row.key]}
              onCheckedChange={toggle(row.key)}
              lastItem={i === ROWS.length - 1}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
