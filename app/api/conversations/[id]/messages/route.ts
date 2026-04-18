import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { listMessages, sendMessage } from "@/lib/services/message.service";

const textSchema = z.object({
  type: z.literal("TEXT"),
  content: z.string().trim().min(1, "Conteúdo obrigatório").max(4096),
  replyToMessageId: z.string().optional(),
});

const mediaSchema = z.object({
  type: z.enum(["IMAGE", "AUDIO", "VIDEO", "DOCUMENT"]),
  // URL pública ou data URI base64 — storage R2 (passo 14) cuida de subir arquivos.
  mediaUrl: z.string().min(1).max(4096),
  caption: z.string().trim().max(1024).optional(),
  mediaFileName: z.string().trim().max(255).optional(),
  mediaMimeType: z.string().trim().max(120).optional(),
  replyToMessageId: z.string().optional(),
});

const sendSchema = z.discriminatedUnion("type", [textSchema, mediaSchema]);

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const body = sendSchema.parse(await request.json());
    const message = await sendMessage({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      conversationId: id,
      input: body,
    });
    return ok(message, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const result = await listMessages({
      workspaceId: session.user.workspaceId,
      conversationId: id,
      cursor,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
