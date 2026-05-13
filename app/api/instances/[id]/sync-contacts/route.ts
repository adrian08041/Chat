import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import {
  cancelSyncContacts,
  getSyncStatus,
  startSyncContacts,
} from "@/lib/services/instance-sync.service";

type RouteContext = { params: Promise<{ id: string }> };

// POST inicia o sync (idempotente: se já tem job running pra mesma instance,
// retorna o existente com alreadyRunning=true). Qualquer role do workspace.
export async function POST(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const result = await startSyncContacts({
      workspaceId: session.user.workspaceId,
      instanceId: id,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

// GET retorna estado atual do job ou null se nunca rodou pra essa instance.
export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const job = getSyncStatus({
      workspaceId: session.user.workspaceId,
      instanceId: id,
    });
    return ok({ job });
  } catch (error) {
    return handleRouteError(error);
  }
}

// DELETE cancela o job em andamento. No-op se nenhum job estiver running.
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const result = cancelSyncContacts({
      workspaceId: session.user.workspaceId,
      instanceId: id,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
