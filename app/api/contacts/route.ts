import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import {
  createContact,
  listContacts,
} from "@/lib/services/contact.service";

const postSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200).nullable().optional(),
  assignedUserId: z.string().trim().min(1).nullable().optional(),
  tagIds: z.array(z.string().trim().min(1)).max(20).optional(),
  source: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? undefined;
    const tagId = url.searchParams.get("tagId") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const page = await listContacts({
      workspaceId: session.user.workspaceId,
      search,
      tagId,
      cursor,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return ok(page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = postSchema.parse(await request.json());
    const created = await createContact({
      workspaceId: session.user.workspaceId,
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      assignedUserId: body.assignedUserId ?? null,
      tagIds: body.tagIds,
      source: body.source ?? null,
      notes: body.notes ?? null,
    });
    return ok(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
