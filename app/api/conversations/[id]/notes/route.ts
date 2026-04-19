import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import {
  createConversationNote,
  listConversationNotes,
} from "@/lib/services/note.service";

type RouteContext = { params: Promise<{ id: string }> };

const postSchema = z.object({
  content: z.string().trim().min(1, "Conteúdo obrigatório").max(4000),
});

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const { role, id: actorId, workspaceId } = session.user;
    const isManager = role === "ADMIN" || role === "SUPERVISOR";
    const notes = await listConversationNotes({
      workspaceId,
      conversationId: id,
      actorId,
      isManager,
    });
    return ok(notes);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const body = postSchema.parse(await request.json());
    const { role, id: actorId, workspaceId } = session.user;
    const isManager = role === "ADMIN" || role === "SUPERVISOR";
    const note = await createConversationNote({
      workspaceId,
      conversationId: id,
      userId: actorId,
      isManager,
      content: body.content,
    });
    return ok(note, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
