// Instance service — passo 8 do Backend Plan.
// Gerencia Instance = número WhatsApp amarrado a uma instância UazApi.
// uazapiToken nunca sai deste módulo (§10.4). Envio real (`/send/*`) fica
// em message.service (passo 11).

import { randomBytes } from "node:crypto";
import type { Instance, InstanceStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getUazApiClient, UazApiError } from "@/lib/uazapi";
import type { WhatsAppConnectionStatus } from "@/lib/whatsapp/types";

// DTO público — omite segredos (uazapiToken, webhookSecret).
export type InstancePublic = Omit<
  Instance,
  "uazapiToken" | "webhookSecret" | "deletedAt"
>;

export function toPublicInstance(row: Instance): InstancePublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { uazapiToken, webhookSecret, deletedAt, ...rest } = row;
  return rest;
}

function mapConnectionStatus(status: WhatsAppConnectionStatus): InstanceStatus {
  switch (status) {
    case "connected":
      return "CONNECTED";
    case "connecting":
      return "CONNECTING";
    case "disconnected":
      return "DISCONNECTED";
  }
}

function generateWebhookSecret(): string {
  return randomBytes(24).toString("hex");
}

function resolveSubdomain(input: string | undefined): string {
  const fallback = process.env.UAZAPI_DEFAULT_SUBDOMAIN;
  const chosen = (input ?? fallback ?? "").trim();
  if (!chosen) {
    throw new ApiError(
      "UAZAPI_DEFAULT_SUBDOMAIN não configurado e nenhum subdomínio informado",
      500,
    );
  }
  return chosen;
}

function requireOwned(instance: Instance | null, workspaceId: string): Instance {
  if (!instance || instance.workspaceId !== workspaceId || instance.deletedAt) {
    throw new ApiError("Instância não encontrada", 404);
  }
  return instance;
}

export async function listInstances(
  workspaceId: string,
): Promise<InstancePublic[]> {
  const rows = await prisma.instance.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toPublicInstance);
}

export async function getInstance(
  workspaceId: string,
  id: string,
): Promise<InstancePublic> {
  const row = await prisma.instance.findUnique({ where: { id } });
  return toPublicInstance(requireOwned(row, workspaceId));
}

export type CreateInstanceInput = {
  workspaceId: string;
  name: string;
  color?: string;
  subdomain?: string;
  msgDelayMin?: number;
  msgDelayMax?: number;
};

export async function createInstance(
  input: CreateInstanceInput,
): Promise<InstancePublic> {
  const subdomain = resolveSubdomain(input.subdomain);
  const client = getUazApiClient();

  const created = await client.createInstance({ name: input.name });

  try {
    const row = await prisma.instance.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name.trim(),
        color: input.color ?? "#075E54",
        uazapiSubdomain: subdomain,
        uazapiToken: created.token,
        uazapiInstanceId: created.instanceId,
        webhookSecret: generateWebhookSecret(),
        msgDelayMin: input.msgDelayMin ?? 2,
        msgDelayMax: input.msgDelayMax ?? 6,
      },
    });
    return toPublicInstance(row);
  } catch (error) {
    // Rollback best-effort: remove a instância criada no UazApi se a persistência falhou.
    await client
      .deleteInstance({ subdomain, token: created.token })
      .catch(() => undefined);
    throw error;
  }
}

export type UpdateInstanceInput = {
  name?: string;
  color?: string;
  msgDelayMin?: number;
  msgDelayMax?: number;
  proxyUrl?: string | null;
};

export async function updateInstance(
  workspaceId: string,
  id: string,
  patch: UpdateInstanceInput,
): Promise<InstancePublic> {
  const existing = requireOwned(
    await prisma.instance.findUnique({ where: { id } }),
    workspaceId,
  );

  const delaysChanged =
    (patch.msgDelayMin !== undefined &&
      patch.msgDelayMin !== existing.msgDelayMin) ||
    (patch.msgDelayMax !== undefined &&
      patch.msgDelayMax !== existing.msgDelayMax);

  const row = await prisma.instance.update({
    where: { id },
    data: {
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.color !== undefined && { color: patch.color }),
      ...(patch.msgDelayMin !== undefined && {
        msgDelayMin: patch.msgDelayMin,
      }),
      ...(patch.msgDelayMax !== undefined && {
        msgDelayMax: patch.msgDelayMax,
      }),
      ...(patch.proxyUrl !== undefined && { proxyUrl: patch.proxyUrl }),
    },
  });

  if (delaysChanged) {
    // Propaga pro UazApi. Falha não reverte DB — delay no DB é a verdade local.
    await getUazApiClient()
      .updateDelaySettings(
        { subdomain: row.uazapiSubdomain, token: row.uazapiToken },
        { min: row.msgDelayMin, max: row.msgDelayMax },
      )
      .catch((error) => {
        console.error(
          `[instance] updateDelaySettings falhou pra ${row.id}:`,
          error,
        );
      });
  }

  return toPublicInstance(row);
}

export async function deleteInstance(
  workspaceId: string,
  id: string,
): Promise<void> {
  const existing = requireOwned(
    await prisma.instance.findUnique({ where: { id } }),
    workspaceId,
  );

  // Soft-delete primeiro; depois tenta UazApi. Se UazApi falhar, a instância
  // some da UI mas pode ficar órfã no servidor — aceitável (orgânico a limpar).
  await prisma.instance.update({
    where: { id },
    data: { deletedAt: new Date(), status: "DISCONNECTED" },
  });

  await getUazApiClient()
    .deleteInstance({
      subdomain: existing.uazapiSubdomain,
      token: existing.uazapiToken,
    })
    .catch((error) => {
      console.error(`[instance] deleteInstance UazApi falhou pra ${id}:`, error);
    });
}

export type ConnectResult = {
  status: InstanceStatus;
  qrCode: string | null;
  pairingCode: string | null;
};

export async function connectInstance(
  workspaceId: string,
  id: string,
): Promise<ConnectResult> {
  const existing = requireOwned(
    await prisma.instance.findUnique({ where: { id } }),
    workspaceId,
  );

  try {
    const result = await getUazApiClient().connectInstance({
      subdomain: existing.uazapiSubdomain,
      token: existing.uazapiToken,
    });
    const status = mapConnectionStatus(result.status);
    await prisma.instance.update({
      where: { id },
      data: {
        status,
        ...(status === "CONNECTED" && { lastConnectedAt: new Date() }),
      },
    });
    return {
      status,
      qrCode: result.qrCode,
      pairingCode: result.pairingCode,
    };
  } catch (error) {
    await prisma.instance
      .update({ where: { id }, data: { status: "ERROR" } })
      .catch(() => undefined);
    if (error instanceof UazApiError) {
      throw new ApiError(error.message, 502, error.body);
    }
    throw error;
  }
}

export async function disconnectInstance(
  workspaceId: string,
  id: string,
): Promise<InstancePublic> {
  const existing = requireOwned(
    await prisma.instance.findUnique({ where: { id } }),
    workspaceId,
  );

  await getUazApiClient()
    .disconnectInstance({
      subdomain: existing.uazapiSubdomain,
      token: existing.uazapiToken,
    })
    .catch((error) => {
      if (error instanceof UazApiError) {
        throw new ApiError(error.message, 502, error.body);
      }
      throw error;
    });

  const row = await prisma.instance.update({
    where: { id },
    data: { status: "DISCONNECTED" },
  });
  return toPublicInstance(row);
}

export async function refreshInstanceStatus(
  workspaceId: string,
  id: string,
): Promise<InstancePublic> {
  const existing = requireOwned(
    await prisma.instance.findUnique({ where: { id } }),
    workspaceId,
  );

  try {
    const result = await getUazApiClient().getInstanceStatus({
      subdomain: existing.uazapiSubdomain,
      token: existing.uazapiToken,
    });
    const status = mapConnectionStatus(result.status);

    const row = await prisma.instance.update({
      where: { id },
      data: {
        status,
        phone: result.phone ?? existing.phone,
        lastHealthCheckAt: new Date(),
        ...(status === "CONNECTED" &&
          !existing.lastConnectedAt && { lastConnectedAt: new Date() }),
      },
    });
    return toPublicInstance(row);
  } catch (error) {
    if (error instanceof UazApiError) {
      throw new ApiError(error.message, 502, error.body);
    }
    throw error;
  }
}

// Helper interno — usado pelo webhook handler (passo 9) pra lookup por secret.
export async function findInstanceByWebhookSecret(
  secret: string,
): Promise<Instance | null> {
  try {
    return await prisma.instance.findUnique({ where: { webhookSecret: secret } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) return null;
    throw error;
  }
}
