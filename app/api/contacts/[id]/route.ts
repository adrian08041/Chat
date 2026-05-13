import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import {
  deleteContact,
  getContact,
  updateContact,
} from "@/lib/services/contact.service";

type RouteContext = { params: Promise<{ id: string }> };

const CUID_PATTERN = /^[a-z0-9]{20,40}$/;

function ensureValidId(id: string): void {
  if (!CUID_PATTERN.test(id)) {
    throw new ApiError("Id inválido", 400);
  }
}

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(1).max(40).optional(),
    email: z.string().trim().email().max(200).nullable().optional(),
    assignedUserId: z.string().trim().min(1).nullable().optional(),
    tagIds: z.array(z.string().trim().min(1)).max(20).optional(),
    source: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.phone !== undefined ||
      v.email !== undefined ||
      v.assignedUserId !== undefined ||
      v.tagIds !== undefined ||
      v.source !== undefined ||
      v.notes !== undefined,
    { message: "Informe ao menos um campo" },
  );

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    ensureValidId(id);
    const contact = await getContact({
      workspaceId: session.user.workspaceId,
      id,
    });
    return ok(contact);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    ensureValidId(id);
    const body = patchSchema.parse(await request.json());
    const updated = await updateContact({
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
    const { id } = await ctx.params;
    ensureValidId(id);
    await deleteContact({ workspaceId: session.user.workspaceId, id });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
