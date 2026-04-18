"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { UserStatus } from "@/types/user";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  AGENT: "Atendente",
};

const PRESENCE_OPTIONS: {
  value: UserStatus;
  label: string;
  dotClass: string;
}[] = [
  { value: "ONLINE", label: "Online", dotClass: "bg-success" },
  { value: "AWAY", label: "Ausente", dotClass: "bg-warning" },
  { value: "OFFLINE", label: "Offline", dotClass: "bg-txt-muted" },
];

function presenceLabel(presence: UserStatus): string {
  return PRESENCE_OPTIONS.find((s) => s.value === presence)?.label ?? "Online";
}

function presenceDotClass(presence: UserStatus): string {
  return (
    PRESENCE_OPTIONS.find((s) => s.value === presence)?.dotClass ?? "bg-success"
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [presence, setPresence] = useState<UserStatus>("ONLINE");

  if (sessionStatus === "loading" || !session?.user) {
    return (
      <div className="inline-flex items-center gap-2 p-1 pr-2">
        <Skeleton className="size-9 rounded-full" />
        <div className="hidden sm:block space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  const name = session.user.name ?? "Usuário";
  const email = session.user.email ?? "";
  const role = ROLE_LABELS[session.user.role] ?? session.user.role;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group inline-flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 data-[popup-open]:bg-surface-elevated"
        aria-label="Abrir menu de perfil"
      >
        <div className="relative">
          <AvatarInitials name={name} size="md" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-card ${presenceDotClass(presence)}`}
            aria-hidden="true"
          />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-txt-primary leading-tight">
            {name}
          </p>
          <p className="text-xs text-txt-muted leading-tight">{role}</p>
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
            <AvatarInitials name={name} size="lg" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-card ${presenceDotClass(presence)}`}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-txt-primary truncate">
              {name}
            </p>
            <p className="text-xs text-txt-muted truncate">{email}</p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
              {role}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <p className="px-2 py-1 text-xs font-medium text-txt-muted">Meu status</p>
        <DropdownMenuRadioGroup
          value={presence}
          onValueChange={(value) => setPresence(value as UserStatus)}
        >
          {PRESENCE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="pl-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${option.dotClass}`}
                aria-hidden="true"
              />
              <span>{option.label}</span>
              {presence === option.value && (
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
          Status atual: {presenceLabel(presence)}
        </span>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
