import type { NextRequest } from "next/server";

import { requireAuth, requireRole } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { buildObjectKey, uploadFile } from "@/lib/storage";

const SCOPES = new Set(["chat", "quick-reply"]);

// Limites alinhados com WhatsApp. Document é o maior (100MB); mantenho teto
// único de 20MB no MVP (cobre imagem/áudio/vídeo/PDF leve). Amplia depois se
// precisar anexar docs grandes.
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/", "audio/", "video/"];
const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/plain",
  "text/csv",
]);

function isMimeAllowed(mime: string): boolean {
  if (ALLOWED_MIME_EXACT.has(mime)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const form = await request.formData();
    const file = form.get("file");
    const scopeRaw = form.get("scope");

    if (!(file instanceof File)) {
      throw new ApiError("Arquivo ausente (campo `file`)", 400);
    }

    const scope = typeof scopeRaw === "string" ? scopeRaw : "chat";
    if (!SCOPES.has(scope)) {
      throw new ApiError(`Scope inválido: ${scope}`, 400);
    }
    // Scope quick-reply só é acessível a quem pode criar/editar a entidade —
    // AGENT uploadar aqui só spamaria R2 com orphans (rota CRUD bloqueia).
    if (scope === "quick-reply") {
      requireRole(session, "ADMIN", "SUPERVISOR");
    }

    if (file.size === 0) {
      throw new ApiError("Arquivo vazio", 400);
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new ApiError(
        `Arquivo excede ${MAX_SIZE_BYTES / 1024 / 1024}MB`,
        413,
      );
    }

    const mime = file.type || "application/octet-stream";
    if (!isMimeAllowed(mime)) {
      throw new ApiError(`Tipo não permitido: ${mime}`, 415);
    }

    const key = buildObjectKey({
      workspaceId: session.user.workspaceId,
      scope: scope as "chat" | "quick-reply",
      fileName: file.name || "upload",
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile({
      key,
      body: buffer,
      contentType: mime,
      // RFC 5987: filename* permite nomes com unicode sem escapar %XX no viewer.
      contentDisposition: file.name
        ? `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`
        : undefined,
    });

    return ok(
      {
        url: result.url,
        key: result.key,
        mimeType: mime,
        fileName: file.name || null,
        size: result.size,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
