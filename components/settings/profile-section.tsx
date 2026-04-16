"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AvatarInitials } from "@/components/chat/avatar-initials";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

const INITIAL_PROFILE: ProfileData = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@plataforma.com",
  role: "Administrador",
  avatarUrl: null,
};

export function ProfileSection() {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande! Máximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      update("avatarUrl", e.target?.result as string);
      toast.success("Foto atualizada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!profile.firstName || !profile.lastName || !profile.email) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }
    toast.success("Perfil atualizado com sucesso!");
  };

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">Perfil</h2>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <p className="font-semibold text-sm text-txt-primary">Foto de Perfil</p>
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt="Foto de perfil"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <AvatarInitials name={fullName || "Admin User"} size="xl" />
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif"
                hidden
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
              >
                Alterar foto
              </Button>
              <p className="text-xs text-txt-muted mt-2">
                JPG, PNG ou GIF. Máximo 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => update("email", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Cargo</Label>
            <Input
              id="role"
              value={profile.role}
              onChange={(e) => update("role", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="pt-2 flex justify-end">
            <Button size="lg" onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
