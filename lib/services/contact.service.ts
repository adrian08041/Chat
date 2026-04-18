// Contact service — passo 10 do Backend Plan.
// Upsert atômico por (workspaceId, phone) @@unique. Nome só preenche se o
// contato existente estiver sem nome — protege edições manuais no CRM.

import type { Contact } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function upsertContactFromInbound(params: {
  workspaceId: string;
  phone: string;
  fallbackName: string | null;
}): Promise<Contact> {
  const phone = params.phone.trim();
  if (!phone) throw new Error("upsertContactFromInbound requer phone não-vazio");

  const fallbackName = params.fallbackName?.trim() || null;

  // Prisma.upsert é atômico no @@unique — resolve corrida entre webhooks
  // simultâneos do mesmo contato. Não seta nome no update pra não sobrescrever
  // dado curado; backfill só acontece se o existente estava null.
  const upserted = await prisma.contact.upsert({
    where: { workspaceId_phone: { workspaceId: params.workspaceId, phone } },
    create: {
      workspaceId: params.workspaceId,
      phone,
      name: fallbackName,
    },
    update: {},
  });

  if (!upserted.name && fallbackName) {
    return prisma.contact.update({
      where: { id: upserted.id },
      data: { name: fallbackName },
    });
  }
  return upserted;
}
