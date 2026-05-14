import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { normalizeContactPhone } from "@/lib/services/contact.service";
import { getUazApiClient, UazApiError } from "@/lib/uazapi";

const postSchema = z.object({
  phone: z.string().trim().min(1).max(40),
});

// `validated:false` significa que não conseguimos consultar a UazApi.
// `skipReason` distingue por quê — o front renderiza copy específico:
//  - "no_instance": workspace não tem nenhuma instance CONNECTED.
//  - "api_error":   UazApi indisponível ou retornou erro (transitório).
// Quando `validated:true`, `skipReason` é null.
export type CheckSkipReason = "no_instance" | "api_error";

export type CheckPhoneResult = {
  validated: boolean;
  skipReason: CheckSkipReason | null;
  isInWhatsapp: boolean;
  verifiedName: string | null;
  jid: string | null;
};

// Rate limit per-user pra coibir enumeração de números via /chat/check.
// Janela deslizante simples (reset a cada 60s) — não é "sliding window" puro,
// mas é barato, suficiente pra UI controlada por clique e não exige Redis.
// Limitação: state in-memory perde em restart e não é compartilhado entre
// workers; vale só pra single-instance do Node (mesmo que instance-sync).
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;

const rateState = new Map<string, { count: number; windowStart: number }>();

function consumeRateLimit(userId: string): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateState.get(userId);
  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    rateState.set(userId, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (entry.count >= RATE_MAX) {
    return { ok: false, retryAfterMs: RATE_WINDOW_MS - (now - entry.windowStart) };
  }
  entry.count++;
  return { ok: true };
}

function skipped(reason: CheckSkipReason): CheckPhoneResult {
  return {
    validated: false,
    skipReason: reason,
    isInWhatsapp: false,
    verifiedName: null,
    jid: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const rate = consumeRateLimit(session.user.id);
    if (!rate.ok) {
      const seconds = Math.ceil(rate.retryAfterMs / 1000);
      throw new ApiError(
        `Muitas verificações em pouco tempo. Aguarde ${seconds}s e tente de novo.`,
        429,
        { retryAfterMs: rate.retryAfterMs },
      );
    }

    const body = postSchema.parse(await request.json());
    const phone = normalizeContactPhone(body.phone);
    if (!phone) {
      throw new ApiError("Número de telefone inválido", 422);
    }

    // Primeira CONNECTED (orderBy createdAt asc) — escolha estável, mesma
    // instance entre requests do mesmo workspace evita drift de resposta.
    const instance = await prisma.instance.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        status: "CONNECTED",
        deletedAt: null,
      },
      select: { uazapiSubdomain: true, uazapiToken: true },
      orderBy: { createdAt: "asc" },
    });

    if (!instance) return ok(skipped("no_instance"));

    const client = getUazApiClient();
    let checks;
    try {
      checks = await client.checkNumbers(
        { subdomain: instance.uazapiSubdomain, token: instance.uazapiToken },
        [phone],
      );
    } catch (err) {
      if (err instanceof UazApiError) {
        // UazApi indisponível ou erro transitório: degrada como "não validado"
        // pra não bloquear o cadastro do usuário.
        return ok(skipped("api_error"));
      }
      throw err;
    }

    const first = checks[0];
    const result: CheckPhoneResult = {
      validated: true,
      skipReason: null,
      isInWhatsapp: first?.isInWhatsapp ?? false,
      verifiedName: first?.verifiedName ?? null,
      jid: first?.jid ?? null,
    };
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
