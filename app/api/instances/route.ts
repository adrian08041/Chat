import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import {
  createInstance,
  listInstances,
} from "@/lib/services/instance.service";

// subdomain: bare "meuservidor" OU URL "https://meuservidor.uazapi.com".
// Regex bloqueia hosts arbitrários — ADMIN é trusted, mas não abrir porta de
// SSRF pra rede interna caso input venha de lugar não revisado.
const SUBDOMAIN_PATTERN =
  /^(?:[a-z0-9][a-z0-9-]{0,62}|https:\/\/[a-z0-9][a-z0-9-]{0,62}\.uazapi\.com\/?)$/i;

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(60),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hex #RRGGBB")
    .optional(),
  subdomain: z
    .string()
    .trim()
    .regex(SUBDOMAIN_PATTERN, "subdomain inválido (bare ou https://*.uazapi.com)")
    .optional(),
  msgDelayMin: z.number().int().min(0).max(60).optional(),
  msgDelayMax: z.number().int().min(0).max(120).optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const instances = await listInstances(session.user.workspaceId);
    return ok(instances);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");
    const body = createSchema.parse(await request.json());
    const instance = await createInstance({
      workspaceId: session.user.workspaceId,
      ...body,
    });
    return ok(instance, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
