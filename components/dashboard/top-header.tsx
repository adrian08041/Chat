"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
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
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
