import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { deleteTag, TAG_COLORS, updateTag } from "@/lib/services/tag.service";

type RouteContext = { params: Promise<{ id: string }> };

const CUID_PATTERN = /^[a-z0-9]{20,40}$/;

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    color: z.enum(TAG_COLORS).optional(),
  })
  .refine((v) => v.name !== undefined || v.color !== undefined, {
    message: "Informe name ou color",
  });

function ensureValidId(id: string): void {
  if (!CUID_PATTERN.test(id)) {
    throw new ApiError("Tag id inválido", 400);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN", "SUPERVISOR");
    const { id } = await ctx.params;
    ensureValidId(id);
    const body = patchSchema.parse(await request.json());
    const tag = await updateTag({
      workspaceId: session.user.workspaceId,
      tagId: id,
      name: body.name,
      color: body.color,
    });
    return ok(tag);
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
    await deleteTag({
      workspaceId: session.user.workspaceId,
      tagId: id,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
