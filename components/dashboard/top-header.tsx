"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, Bell } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { AvatarInitials } from "@/components/chat/avatar-initials";

const HIDDEN_ROUTES = ["/conversas"];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contatos": "Contatos",
  "/numeros": "Números",
  "/equipe": "Equipe",
  "/respostas-rapidas": "Respostas Rápidas",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
};

export function TopHeader() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] ?? "Página";

  return (
    <header className="grid grid-cols-3 items-center px-6 py-4 border-b border-border-default bg-surface-card flex-shrink-0">
      <h1 className="font-headline text-xl font-bold text-txt-primary">{title}</h1>
      <div className="flex justify-center">
        <Image
          src="/logo.png"
          alt="Adrilo"
          width={180}
          height={56}
          className="h-14 w-auto object-contain"
          priority
        />
      </div>
      <div className="flex items-center gap-4 justify-end">
        <div className="hidden sm:block">
          <InputGroup className="w-56 bg-surface-elevated">
            <InputGroupAddon>
              <Search className="w-4 h-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Buscar..."
              aria-label="Buscar"
            />
          </InputGroup>
        </div>
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-elevated transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5 text-txt-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" aria-hidden="true" />
          <span className="sr-only">Novas notificações</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-txt-primary leading-tight">Admin User</p>
            <p className="text-xs text-txt-muted leading-tight">Administrador</p>
          </div>
          <AvatarInitials name="Admin User" size="md" />
        </div>
      </div>
    </header>
  );
}
