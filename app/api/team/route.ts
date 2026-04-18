import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { listTeamMembers } from "@/lib/services/team.service";

export async function GET() {
  try {
    const session = await requireAuth();
    // Lista expõe emails dos membros — restrito a quem gerencia equipe.
    requireRole(session, "ADMIN", "SUPERVISOR");
    const members = await listTeamMembers(session.user.workspaceId);
    return ok(members);
  } catch (error) {
    return handleRouteError(error);
  }
}
