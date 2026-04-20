// SSE endpoint — passo 12 do Backend Plan.
// Cliente conecta via EventSource; stream fica aberto enquanto a request não
// for abortada. Auth obrigatória — filtra eventos pelo workspaceId da session.
//
// Keep-alive a cada 25s previne fechamento por proxies (Cloudflare tem 100s
// idle default; o comment ":" satisfaz o protocolo SSE sem emitir evento).

import type { NextRequest } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { handleRouteError } from "@/lib/api-utils";
import { subscribe, type RealtimeEvent } from "@/lib/realtime";

// Route handler precisa de runtime Node (ReadableStream + setInterval).
// Rodando em edge runtime teria limites de timeout e sem acesso completo.
export const runtime = "nodejs";
// Desabilita qualquer cache — stream de eventos, cada byte importa.
export const dynamic = "force-dynamic";

const KEEP_ALIVE_MS = 25_000;

function formatEvent(event: RealtimeEvent): string {
  // Protocolo SSE: `event:` + `data:` + linha em branco.
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspaceId = session.user.workspaceId;
    const identity = {
      userId: session.user.id,
      role: session.user.role,
    };

    const encoder = new TextEncoder();
    let keepAlive: ReturnType<typeof setInterval> | null = null;
    let unsubscribe: (() => void) | null = null;
    let cleaned = false;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (keepAlive) clearInterval(keepAlive);
      if (unsubscribe) unsubscribe();
    };

    const stream = new ReadableStream({
      start(controller) {
        // Primeiro byte pro browser confirmar a conexão.
        controller.enqueue(encoder.encode(": connected\n\n"));

        unsubscribe = subscribe(workspaceId, identity, (event) => {
          try {
            controller.enqueue(encoder.encode(formatEvent(event)));
          } catch {
            // Controller já fechou — cleanup() idempotente cuida.
          }
        });

        keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            // Ignorado: controller fechado será tratado no cleanup.
          }
        }, KEEP_ALIVE_MS);
      },
      cancel: cleanup,
    });

    // Abort pela client (fechou aba, reconnect) — cleanup idempotente garante
    // que cancel + abort listener não rodem duas vezes a mesma lógica.
    request.signal.addEventListener("abort", cleanup);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
