import type { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { resendInvite } from "@/lib/services/invite.service";

type RouteContext = { params: Promise<{ id: string }> };

const INVITE_ID_PATTERN = /^[a-z0-9]{20,40}$/;

function ensureValidInviteId(id: string): void {
  if (!INVITE_ID_PATTERN.test(id)) {
    throw new ApiError("inviteId inválido", 400);
  }
}

export async function POST(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const { id } = await ctx.params;
    ensureValidInviteId(id);
    const invite = await resendInvite({
      workspaceId: session.user.workspaceId,
      inviteId: id,
    });
    return ok({
      id: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
