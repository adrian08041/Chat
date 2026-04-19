import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { createTag, listTags, TAG_COLORS } from "@/lib/services/tag.service";

const postSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.enum(TAG_COLORS),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const tags = await listTags(session.user.workspaceId);
    return ok(tags);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN", "SUPERVISOR");
    const body = postSchema.parse(await request.json());
    const tag = await createTag({
      workspaceId: session.user.workspaceId,
      name: body.name,
      color: body.color,
    });
    return ok(tag, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
