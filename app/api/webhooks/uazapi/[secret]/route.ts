// Webhook inbound UazApi. Rota pública — autenticação = secret único por
// Instance no path (Backend Plan §4 + §8). Sempre responde rápido: UazApi tem
// timeout e re-entrega em erro, então o handler é idempotente por design.

import type { NextRequest } from "next/server";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { handleWebhookEvent } from "@/lib/services/webhook.service";

type RouteContext = { params: Promise<{ secret: string }> };

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { secret } = await ctx.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("Body JSON inválido", 400);
    }

    const eventType =
      typeof body === "object" && body !== null && "EventType" in body
        ? (body as { EventType: unknown }).EventType
        : undefined;
    console.log(
      `[webhook] recebido secret=${secret.slice(0, 8)}... EventType=${String(eventType)}`,
    );

    const result = await handleWebhookEvent(secret, body);
    console.log(`[webhook] processado:`, result);
    return ok(result);
  } catch (error) {
    console.error(`[webhook] erro:`, error);
    return handleRouteError(error);
  }
}
