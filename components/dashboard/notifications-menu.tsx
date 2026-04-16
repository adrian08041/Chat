"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Check,
  MessageSquare,
  UserPlus,
  Users,
  AtSign,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRelativeTime } from "@/lib/format";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import type { Notification, NotificationType } from "@/types/notification";

interface TypeStyle {
  icon: LucideIcon;
  bg: string;
  fg: string;
}

const TYPE_STYLES: Record<NotificationType, TypeStyle> = {
  CONVERSATION_ASSIGNED: {
    icon: MessageSquare,
    bg: "bg-info-light",
    fg: "text-info",
  },
  NEW_CONTACT: {
    icon: UserPlus,
    bg: "bg-success-light",
    fg: "text-success",
  },
  TEAM_INVITE_ACCEPTED: {
    icon: Users,
    bg: "bg-primary-50",
    fg: "text-primary-600",
  },
  MENTION: {
    icon: AtSign,
    bg: "bg-warning-light",
    fg: "text-warning",
  },
  NUMBER_DISCONNECTED: {
    icon: WifiOff,
    bg: "bg-danger-light",
    fg: "text-danger",
  },
};

interface NotificationItemProps {
  notification: Notification;
  onSelect: (notification: Notification) => void;
}

function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const style = TYPE_STYLES[notification.type];
  const Icon = style.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-surface-elevated ${
        notification.read ? "" : "bg-primary-50/30"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}
      >
        <Icon className={`w-4 h-4 ${style.fg}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${
            notification.read
              ? "text-txt-primary font-normal"
              : "text-txt-primary font-semibold"
          }`}
        >
          {notification.title}
        </p>
        {notification.description && (
          <p className="text-xs text-txt-secondary mt-0.5 line-clamp-2">
            {notification.description}
          </p>
        )}
        <p className="text-xs text-txt-muted mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <span
          className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5"
          aria-label="Não lida"
        />
      )}
    </button>
  );
}

export function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  const handleSelect = useCallback(
    (notification: Notification) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setOpen(false);
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    },
    [router]
  );

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 data-[popup-open]:bg-surface-elevated"
        aria-label={
          unreadCount > 0
            ? `Notificações (${unreadCount} não lida${unreadCount === 1 ? "" : "s"})`
            : "Notificações"
        }
      >
        <Bell className="w-5 h-5 text-txt-muted" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-[10px] font-semibold text-white flex items-center justify-center leading-none"
            aria-hidden="true"
          >
            {badgeLabel}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] max-w-[calc(100vw-2rem)] p-0 gap-0"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <div className="flex items-center gap-2">
            <h3 className="font-headline text-sm font-semibold text-txt-primary">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary-600 text-txt-on-primary">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-400 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center">
                <BellOff className="w-5 h-5 text-txt-muted" />
              </div>
              <p className="text-sm text-txt-secondary">
                Nenhuma notificação por aqui
              </p>
              <p className="text-xs text-txt-muted">
                Você será avisado de novas atividades aqui.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border-default px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/configuracoes");
            }}
            className="w-full text-center text-xs font-medium text-primary-600 hover:text-primary-400 transition-colors"
          >
            Preferências de notificação
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
