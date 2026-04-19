import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import {
  deleteQuickReply,
  updateQuickReply,
} from "@/lib/services/quick-reply.service";

type RouteContext = { params: Promise<{ id: string }> };

const CUID_PATTERN = /^[a-z0-9]{20,40}$/;

const patchSchema = z
  .object({
    shortcut: z.string().trim().min(1).max(40).optional(),
    title: z.string().trim().min(1).max(80).optional(),
    content: z.string().trim().min(1).max(4000).optional(),
    category: z.string().trim().max(40).nullable().optional(),
    mediaUrl: z.string().trim().max(500).nullable().optional(),
    mediaType: z.string().trim().max(100).nullable().optional(),
  })
  .refine(
    (v) =>
      v.shortcut !== undefined ||
      v.title !== undefined ||
      v.content !== undefined ||
      v.category !== undefined ||
      v.mediaUrl !== undefined ||
      v.mediaType !== undefined,
    { message: "Informe ao menos um campo" },
  );

function ensureValidId(id: string): void {
  if (!CUID_PATTERN.test(id)) {
    throw new ApiError("Id inválido", 400);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN", "SUPERVISOR");
    const { id } = await ctx.params;
    ensureValidId(id);
    const body = patchSchema.parse(await request.json());
    const updated = await updateQuickReply({
      workspaceId: session.user.workspaceId,
      id,
      ...body,
    });
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN", "SUPERVISOR");
    const { id } = await ctx.params;
    ensureValidId(id);
    await deleteQuickReply({
      workspaceId: session.user.workspaceId,
      id,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
