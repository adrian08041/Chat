import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { deleteConversationNote } from "@/lib/services/note.service";

type RouteContext = { params: Promise<{ id: string; noteId: string }> };

const CUID_PATTERN = /^[a-z0-9]{20,40}$/;

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { noteId } = await ctx.params;
    if (!CUID_PATTERN.test(noteId)) {
      throw new ApiError("noteId inválido", 400);
    }
    const { role, id: actorId, workspaceId } = session.user;
    const isManager = role === "ADMIN" || role === "SUPERVISOR";
    await deleteConversationNote({
      workspaceId,
      noteId,
      actorId,
      isManager,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
