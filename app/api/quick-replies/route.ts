import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import {
  createQuickReply,
  listQuickReplies,
} from "@/lib/services/quick-reply.service";

const postSchema = z.object({
  shortcut: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(40).nullable().optional(),
  mediaUrl: z.string().trim().max(500).nullable().optional(),
  mediaType: z.string().trim().max(100).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const rows = await listQuickReplies({
      workspaceId: session.user.workspaceId,
      search,
      category,
    });
    return ok(rows);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN", "SUPERVISOR");
    const body = postSchema.parse(await request.json());
    const created = await createQuickReply({
      workspaceId: session.user.workspaceId,
      shortcut: body.shortcut,
      title: body.title,
      content: body.content,
      category: body.category ?? null,
      mediaUrl: body.mediaUrl ?? null,
      mediaType: body.mediaType ?? null,
    });
    return ok(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
