import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { getDashboardOverview } from "@/lib/services/report.service";

const querySchema = z.object({
  range: z.enum(["today", "7d", "30d"]).default("7d"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN", "SUPERVISOR");

    const url = new URL(request.url);
    const { range } = querySchema.parse({
      range: url.searchParams.get("range") ?? undefined,
    });

    const overview = await getDashboardOverview({
      workspaceId: session.user.workspaceId,
      range,
    });

    return ok(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
