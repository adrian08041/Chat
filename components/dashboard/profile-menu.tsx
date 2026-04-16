"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserStatus } from "@/types/user";

interface ProfileData {
  name: string;
  email: string;
  role: string;
}

const PROFILE: ProfileData = {
  name: "Admin User",
  email: "admin@plataforma.com",
  role: "Administrador",
};

const STATUS_OPTIONS: { value: UserStatus; label: string; dotClass: string }[] = [
  { value: "ONLINE", label: "Online", dotClass: "bg-success" },
  { value: "AWAY", label: "Ausente", dotClass: "bg-warning" },
  { value: "OFFLINE", label: "Offline", dotClass: "bg-txt-muted" },
];

function statusLabel(status: UserStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "Online";
}

function statusDotClass(status: UserStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.dotClass ?? "bg-success";
}

export function ProfileMenu() {
  const router = useRouter();
  const [status, setStatus] = useState<UserStatus>("ONLINE");

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    toast.success("Sessão encerrada");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group inline-flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 data-[popup-open]:bg-surface-elevated"
        aria-label="Abrir menu de perfil"
      >
        <div className="relative">
          <AvatarInitials name={PROFILE.name} size="md" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-card ${statusDotClass(status)}`}
            aria-hidden="true"
          />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-txt-primary leading-tight">
            {PROFILE.name}
          </p>
          <p className="text-xs text-txt-muted leading-tight">{PROFILE.role}</p>
        </div>
        <ChevronDown
          className="hidden sm:block w-4 h-4 text-txt-muted transition-transform duration-150 group-data-[popup-open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 p-2"
      >
        <div className="flex items-center gap-3 p-2">
          <div className="relative">
            <AvatarInitials name={PROFILE.name} size="lg" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-card ${statusDotClass(status)}`}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-txt-primary truncate">
              {PROFILE.name}
            </p>
            <p className="text-xs text-txt-muted truncate">{PROFILE.email}</p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
              {PROFILE.role}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <p className="px-2 py-1 text-xs font-medium text-txt-muted">Meu status</p>
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(value) => setStatus(value as UserStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="pl-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${option.dotClass}`}
                aria-hidden="true"
              />
              <span>{option.label}</span>
              {status === option.value && (
                <span className="sr-only">(selecionado)</span>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleNavigate("/configuracoes")}>
          <UserRound />
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate("/configuracoes")}>
          <Settings />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info("Central de ajuda em breve")}>
          <HelpCircle />
          Ajuda e suporte
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          Sair
        </DropdownMenuItem>

        <span className="sr-only" aria-live="polite">
          Status atual: {statusLabel(status)}
        </span>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
