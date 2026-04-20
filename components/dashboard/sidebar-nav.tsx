"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import {
  MessageSquare,
  LayoutGrid,
  Users,
  Phone,
  MessageCircle,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  icon: typeof MessageSquare;
  label: string;
  // Se presente, só managers (ADMIN/SUPERVISOR) veem o item.
  managerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/conversas", icon: MessageSquare, label: "Conversas" },
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard", managerOnly: true },
  { href: "/contatos", icon: Users, label: "Contatos" },
  { href: "/numeros", icon: Phone, label: "Números" },
  { href: "/respostas-rapidas", icon: MessageCircle, label: "Respostas Rápidas" },
  { href: "/relatorios", icon: BarChart3, label: "Relatórios", managerOnly: true },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

interface SidebarNavProps {
  // Role vem do server layout (sem flash de hydration). Client-only fallback
  // via useSession era válido mas AGENT via items manager por ~100ms.
  role: UserRole;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const isManager = role === "ADMIN" || role === "SUPERVISOR";
  const visibleItems = NAV_ITEMS.filter((item) => !item.managerOnly || isManager);

  return (
    <TooltipProvider delay={200}>
      <aside className="hidden md:flex flex-col items-center w-[72px] flex-shrink-0 border-r border-border-default bg-surface-card py-5 gap-1">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center mb-6">
          <MessageSquare className="w-5 h-5 text-txt-on-primary" />
        </div>

        <nav className="flex flex-col items-center gap-1 flex-1" aria-label="Navegação principal">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                        isActive
                          ? "bg-primary-600 text-txt-on-primary shadow-md"
                          : "text-txt-muted hover:text-txt-primary hover:bg-surface-elevated"
                      )}
                    />
                  }
                >
                  <item.icon className="w-5 h-5" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
