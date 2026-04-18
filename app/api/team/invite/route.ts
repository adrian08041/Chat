import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { createInvite } from "@/lib/services/invite.service";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  role: z.enum(UserRole),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN");

    const body = inviteSchema.parse(await request.json());

    const invite = await createInvite({
      workspaceId: session.user.workspaceId,
      invitedById: session.user.id,
      email: body.email,
      role: body.role,
    });

    return ok({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
