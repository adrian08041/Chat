// Notificações — criação central + entrega via SSE (PR #7a, spec
// 2026-05-16-notifications-realtime-design).
// Best-effort: falha ao notificar NUNCA derruba a ação que a disparou.
// Regra transversal: nunca notificar o próprio autor da ação.

import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/realtime";

type CreateNotificationInput = {
  workspaceId: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  description?: string | null;
  actionUrl?: string | null;
  actorName?: string | null;
};

// Cria uma notificação e dispara o ping SSE. Engole erro (best-effort).
export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        workspaceId: input.workspaceId,
        recipientUserId: input.recipientUserId,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        actionUrl: input.actionUrl ?? null,
        actorName: input.actorName ?? null,
      },
    });
    publish(input.workspaceId, { type: "notification:created" });
  } catch (err) {
    console.error("[notification] createNotification falhou:", err);
  }
}

// CONVERSATION_ASSIGNED — destinatário é o novo assignee; não notifica
// auto-atribuição (assignee === ator).
export async function notifyConversationAssigned(params: {
  workspaceId: string;
  conversationId: string;
  newAssigneeId: string;
  actorId: string;
}): Promise<void> {
  if (params.newAssigneeId === params.actorId) return;
  try {
    const [conv, actor] = await Promise.all([
      prisma.conversation.findFirst({
        where: { id: params.conversationId, workspaceId: params.workspaceId },
        select: { contact: { select: { id: true, name: true } } },
      }),
      prisma.user.findUnique({
        where: { id: params.actorId },
        select: { name: true },
      }),
    ]);
    const contactName = conv?.contact?.name ?? "Novo contato";
    await createNotification({
      workspaceId: params.workspaceId,
      recipientUserId: params.newAssigneeId,
      type: "CONVERSATION_ASSIGNED",
      title: "Nova conversa atribuída",
      description: `${contactName} foi atribuída a você`,
      actionUrl: conv?.contact?.id
        ? `/conversas?contact=${conv.contact.id}`
        : "/conversas",
      actorName: actor?.name ?? null,
    });
  } catch (err) {
    // Captura falhas das queries de lookup acima; erros do createNotification
    // já são capturados dentro dele.
    console.error("[notification] notifyConversationAssigned falhou:", err);
  }
}

// NUMBER_DISCONNECTED — fan-out pros managers (ADMIN/SUPERVISOR) do
// workspace. Um `publish` por destinatário (dentro de createNotification);
// aceitável: evento é vazio, React Query deduplica refetches rápidos e
// desconexões são raras.
export async function notifyNumberDisconnected(params: {
  workspaceId: string;
  instanceName: string;
}): Promise<void> {
  try {
    const managers = await prisma.user.findMany({
      where: {
        workspaceId: params.workspaceId,
        deletedAt: null,
        role: { in: ["ADMIN", "SUPERVISOR"] },
      },
      select: { id: true },
    });
    for (const m of managers) {
      await createNotification({
        workspaceId: params.workspaceId,
        recipientUserId: m.id,
        type: "NUMBER_DISCONNECTED",
        title: "Número desconectado",
        description: `${params.instanceName} perdeu conexão com o WhatsApp`,
        actionUrl: "/numeros",
        actorName: null,
      });
    }
  } catch (err) {
    // Captura falhas do findMany acima; erros do createNotification já são
    // capturados dentro dele.
    console.error("[notification] notifyNumberDisconnected falhou:", err);
  }
}
