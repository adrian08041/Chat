import type { NextRequest } from "next/server";
import { z } from "zod";
import { ConversationStatus } from "@prisma/client";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { listConversations } from "@/lib/services/conversation.service";

const querySchema = z.object({
  status: z.enum(ConversationStatus).optional(),
  assignedUserId: z.string().trim().min(1).optional(),
  instanceId: z.string().trim().min(1).optional(),
  search: z.string().trim().max(120).optional(),
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(url.searchParams));
    // `assignedUserId=me` = filtro pelo usuário logado (atalho comum).
    const assignedUserId =
      params.assignedUserId === "me"
        ? session.user.id
        : params.assignedUserId;

    const result = await listConversations({
      workspaceId: session.user.workspaceId,
      status: params.status,
      assignedUserId,
      instanceId: params.instanceId,
      search: params.search,
      cursor: params.cursor,
      limit: params.limit,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
