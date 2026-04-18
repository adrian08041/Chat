import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { markConversationRead } from "@/lib/services/conversation.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const result = await markConversationRead({
      workspaceId: session.user.workspaceId,
      conversationId: id,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
