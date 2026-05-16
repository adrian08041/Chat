import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import type { Notification } from "@/types/notification";

const LIST_LIMIT = 30;

// GET — notificações do usuário logado (mais recentes primeiro) + contagem
// de não-lidas (separada do take, pra badge correto com >30).
export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();
    const recipientUserId = session.user.id;

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientUserId },
        orderBy: { createdAt: "desc" },
        take: LIST_LIMIT,
      }),
      prisma.notification.count({
        where: { recipientUserId, read: false },
      }),
    ]);

    const notifications: Notification[] = rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.description,
      createdAt: n.createdAt.toISOString(),
      read: n.read,
      actionUrl: n.actionUrl,
      actorName: n.actorName,
    }));

    return ok({ notifications, unreadCount });
  } catch (error) {
    return handleRouteError(error);
  }
}
