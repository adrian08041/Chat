import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH — marca UMA notificação como lida. Ownership check: notificação de
// outro usuário → 404 (não 403, pra não vazar existência).
export async function PATCH(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    const result = await prisma.notification.updateMany({
      where: { id, recipientUserId: session.user.id },
      data: { read: true },
    });
    if (result.count === 0) {
      throw new ApiError("Notificação não encontrada", 404);
    }
    return ok({ id, read: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
