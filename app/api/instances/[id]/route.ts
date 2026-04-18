import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import {
  deleteInstance,
  getInstance,
  updateInstance,
} from "@/lib/services/instance.service";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hex #RRGGBB")
    .optional(),
  msgDelayMin: z.number().int().min(0).max(60).optional(),
  msgDelayMax: z.number().int().min(0).max(120).optional(),
  proxyUrl: z.string().url().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const instance = await getInstance(session.user.workspaceId, id);
    return ok(instance);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const { id } = await ctx.params;
    const body = patchSchema.parse(await request.json());
    const instance = await updateInstance(session.user.workspaceId, id, body);
    return ok(instance);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const { id } = await ctx.params;
    await deleteInstance(session.user.workspaceId, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
