import type { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { connectInstance } from "@/lib/services/instance.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const { id } = await ctx.params;
    const result = await connectInstance(session.user.workspaceId, id);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
