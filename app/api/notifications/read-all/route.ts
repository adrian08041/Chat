import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// POST — marca todas as não-lidas do usuário logado como lidas.
export async function POST(_request: NextRequest) {
  try {
    const session = await requireAuth();
    const result = await prisma.notification.updateMany({
      where: { recipientUserId: session.user.id, read: false },
      data: { read: true },
    });
    return ok({ updated: result.count });
  } catch (error) {
    return handleRouteError(error);
  }
}
