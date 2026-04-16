"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { ProfileMenu } from "@/components/dashboard/profile-menu";

const HIDDEN_ROUTES = ["/conversas"];

export function TopHeader() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <header className="grid grid-cols-3 items-center px-6 py-4 border-b border-border-default bg-surface-card flex-shrink-0">
      <div />
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
        <div className="hidden sm:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            aria-label="Buscar"
            className="w-56 h-9 pl-10 pr-4 rounded-lg bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body"
          />
        </div>
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
