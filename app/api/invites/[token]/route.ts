import { handleRouteError, ok } from "@/lib/api-utils";
import { getInviteByToken } from "@/lib/services/invite.service";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const invite = await getInviteByToken(token);
    return ok({
      email: invite.email,
      role: invite.role,
      inviterName: invite.inviterName,
      workspaceName: invite.workspaceName,
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
