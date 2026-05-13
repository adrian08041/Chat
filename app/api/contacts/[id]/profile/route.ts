import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { getContactProfile } from "@/lib/services/contact.service";

type RouteContext = { params: Promise<{ id: string }> };

const CUID_PATTERN = /^[a-z0-9]{20,40}$/;

function ensureValidId(id: string): void {
  if (!CUID_PATTERN.test(id)) {
    throw new ApiError("Id inválido", 400);
  }
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    ensureValidId(id);
    const profile = await getContactProfile({
      workspaceId: session.user.workspaceId,
      id,
    });
    return ok(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}
