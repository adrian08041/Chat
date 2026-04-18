import type { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { disconnectInstance } from "@/lib/services/instance.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const { id } = await ctx.params;
    const instance = await disconnectInstance(session.user.workspaceId, id);
    return ok(instance);
  } catch (error) {
    return handleRouteError(error);
  }
}
