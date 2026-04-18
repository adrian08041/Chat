import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { refreshInstanceStatus } from "@/lib/services/instance.service";

type RouteContext = { params: Promise<{ id: string }> };

// GET força refresh contra UazApi + persiste. Cliente que quiser só o valor
// cacheado do banco usa GET /api/instances/[id] (passo 8).
export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const instance = await refreshInstanceStatus(session.user.workspaceId, id);
    return ok(instance);
  } catch (error) {
    return handleRouteError(error);
  }
}
