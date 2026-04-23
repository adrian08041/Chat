import { requireAuth } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { listWorkspaceUsers } from "@/lib/services/team.service";

// Lista leve dos usuários ativos do workspace (sem email) — acessível a qualquer
// role autenticada. Usada em dropdowns como "Responsável" no cadastro de contatos.
// Pra gestão de equipe com emails, use GET /api/team (restrito a ADMIN/SUPERVISOR).
export async function GET() {
  try {
    const session = await requireAuth();
    const users = await listWorkspaceUsers(session.user.workspaceId);
    return ok(users);
  } catch (error) {
    return handleRouteError(error);
  }
}
