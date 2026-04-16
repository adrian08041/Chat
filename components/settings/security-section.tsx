"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_PASSWORDS: PasswordData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function SecuritySection() {
  const [passwords, setPasswords] = useState<PasswordData>(EMPTY_PASSWORDS);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const update = <K extends keyof PasswordData>(key: K, value: PasswordData[K]) =>
    setPasswords((p) => ({ ...p, [key]: value }));

  const handleChangePassword = () => {
    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      toast.error("Preencha todos os campos de senha!");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("A nova senha deve ter no mínimo 8 caracteres!");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    setPasswords(EMPTY_PASSWORDS);
    toast.success("Senha alterada com sucesso!");
  };

  const confirmEnable2FA = () => {
    setTwoFactorEnabled(true);
    setShow2FADialog(false);
    toast.success("Autenticação de dois fatores ativada!");
  };

  const confirmDisable2FA = () => {
    setTwoFactorEnabled(false);
    setShowDisableDialog(false);
    toast.success("Autenticação de dois fatores desativada!");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">Segurança</h2>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <h3 className="font-headline font-semibold text-sm text-txt-primary">
            Alterar Senha
          </h3>
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input
              id="current-password"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="pt-2">
            <Button size="lg" onClick={handleChangePassword}>
              Atualizar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-headline font-semibold text-sm text-txt-primary mb-1">
                Autenticação de Dois Fatores
              </h3>
              <p className="text-sm text-txt-muted">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
            <span
              className={
                "px-3 py-1 rounded-full text-xs font-medium " +
                (twoFactorEnabled
                  ? "bg-success-light text-success"
                  : "bg-neutral-50 text-txt-secondary")
              }
            >
              {twoFactorEnabled ? "Ativo" : "Desativado"}
            </span>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              twoFactorEnabled
                ? setShowDisableDialog(true)
                : setShow2FADialog(true)
            }
          >
            {twoFactorEnabled ? "Desativar 2FA" : "Ativar 2FA"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary-600" />
              Ativar Autenticação de Dois Fatores
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR code abaixo com seu aplicativo autenticador
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="bg-surface-elevated rounded-lg p-6">
              <div className="aspect-square bg-surface-card rounded-lg flex items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-full h-full text-txt-primary">
                  <rect x="0" y="0" width="20" height="20" fill="currentColor" />
                  <rect x="25" y="0" width="5" height="5" fill="currentColor" />
                  <rect x="80" y="0" width="20" height="20" fill="currentColor" />
                  <rect x="0" y="80" width="20" height="20" fill="currentColor" />
                  <rect x="80" y="80" width="20" height="20" fill="currentColor" />
                  <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código de Recuperação</Label>
              <div className="bg-surface-elevated rounded-lg p-3 font-mono text-sm text-center text-txt-primary">
                XXXX-XXXX-XXXX-XXXX
              </div>
              <p className="text-xs text-txt-muted">
                Guarde este código em local seguro. Você precisará dele se perder
                acesso ao seu dispositivo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-code">Código de Verificação</Label>
              <Input
                id="verify-code"
                placeholder="000000"
                className="h-10 text-center font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmEnable2FA}>Ativar 2FA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDisableDialog}
        title="Desativar Autenticação de Dois Fatores"
        description="Você tem certeza? Desativar a autenticação de dois fatores tornará sua conta menos segura."
        confirmLabel="Desativar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDisable2FA}
        onCancel={() => setShowDisableDialog(false)}
      />
    </div>
  );
}
