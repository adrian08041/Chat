import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import {
  removeTeamMember,
  updateTeamMember,
} from "@/lib/services/team.service";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  role: z.enum(UserRole).optional(),
});

type RouteContext = { params: Promise<{ userId: string }> };

// Prisma cuid default é ~25 chars lowercase alfanuméricos. Rejeita prefixos
// como "invite:xyz" do frontend e inputs aleatórios com 400 claro.
const USER_ID_PATTERN = /^[a-z0-9]{20,40}$/;

function ensureValidUserId(userId: string): void {
  if (!USER_ID_PATTERN.test(userId)) {
    throw new ApiError("userId inválido", 400);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const { userId } = await ctx.params;
    ensureValidUserId(userId);
    const patch = patchSchema.parse(await request.json());
    const updated = await updateTeamMember({
      workspaceId: session.user.workspaceId,
      userId,
      requesterId: session.user.id,
      patch,
    });
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const { userId } = await ctx.params;
    ensureValidUserId(userId);
    await removeTeamMember({
      workspaceId: session.user.workspaceId,
      userId,
      requesterId: session.user.id,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
