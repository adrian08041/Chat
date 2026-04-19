import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { ApiError, handleRouteError, ok } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import {
  assignConversation,
  getConversationById,
  reopenConversation,
  resolveConversation,
} from "@/lib/services/conversation.service";
import { setConversationTags } from "@/lib/services/tag.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const conversation = await getConversationById({
      workspaceId: session.user.workspaceId,
      conversationId: id,
    });
    return ok(conversation);
  } catch (error) {
    return handleRouteError(error);
  }
}

// PATCH body aceita:
//   { assignedUserId: string | null } → assign/transfer/unassign
//   { status: "RESOLVED" | "REOPENED" } → resolver/reabrir
//   { tagIds: string[] } → set completo de tags (substitui)
//   combináveis: assign primeiro, status depois, tags por fim.
// RBAC: ADMIN/SUPERVISOR sem restrição. AGENT só pode atribuir a si mesmo e só
// pode resolver/reabrir/etiquetar conversa em que ele próprio é o assignee.
const patchSchema = z
  .object({
    assignedUserId: z.string().trim().min(1).nullable().optional(),
    status: z.enum(["RESOLVED", "REOPENED"]).optional(),
    tagIds: z.array(z.string().trim().min(1)).optional(),
  })
  .refine(
    (v) =>
      v.assignedUserId !== undefined ||
      v.status !== undefined ||
      v.tagIds !== undefined,
    { message: "Informe assignedUserId, status ou tagIds" },
  );

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await request.json());
    const { role, id: actorId, workspaceId } = session.user;
    const isManager = role === "ADMIN" || role === "SUPERVISOR";

    // AGENT só mexe em conversas suas (ou ainda-não-atribuídas, pra assumir).
    // Manager (ADMIN/SUPERVISOR) não tem essas restrições.
    if (!isManager) {
      const current = await prisma.conversation.findFirst({
        where: { id, workspaceId },
        select: { assignedUserId: true },
      });
      if (!current) {
        throw new ApiError("Conversa não encontrada", 404);
      }

      if (body.assignedUserId !== undefined) {
        if (body.assignedUserId !== actorId) {
          throw new ApiError(
            "Você só pode atribuir a conversa a si mesmo",
            403,
          );
        }
        // Só assume UNASSIGNED ou conversa que já é sua. Bloqueia roubo de
        // conversa de outro AGENT.
        if (
          current.assignedUserId !== null &&
          current.assignedUserId !== actorId
        ) {
          throw new ApiError(
            "Conversa já está atribuída a outro atendente",
            403,
          );
        }
      }
      if (body.status !== undefined) {
        // Status alterado a partir do estado atual: AGENT precisa ser o
        // assignee atual OU estar assumindo nesta mesma request.
        const willBeAssignee =
          body.assignedUserId === actorId ||
          current.assignedUserId === actorId;
        if (!willBeAssignee) {
          throw new ApiError(
            "Você só pode atualizar o status das suas conversas",
            403,
          );
        }
      }
      if (body.tagIds !== undefined) {
        const willBeAssignee =
          body.assignedUserId === actorId ||
          current.assignedUserId === actorId;
        if (!willBeAssignee) {
          throw new ApiError(
            "Você só pode etiquetar as suas conversas",
            403,
          );
        }
      }
    }

    if (body.assignedUserId !== undefined) {
      await assignConversation({
        workspaceId,
        conversationId: id,
        actorId,
        newAssigneeId: body.assignedUserId,
      });
    }

    if (body.status === "RESOLVED") {
      await resolveConversation({
        workspaceId,
        conversationId: id,
        actorId,
      });
    } else if (body.status === "REOPENED") {
      await reopenConversation({
        workspaceId,
        conversationId: id,
        actorId,
      });
    }

    if (body.tagIds !== undefined) {
      await setConversationTags({
        workspaceId,
        conversationId: id,
        actorId,
        tagIds: body.tagIds,
      });
    }

    const detail = await getConversationById({
      workspaceId,
      conversationId: id,
    });
    return ok(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}
