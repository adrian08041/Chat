import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, requireRole } from "@/lib/api-auth";
import { handleRouteError, ok } from "@/lib/api-utils";
import { getReportStats } from "@/lib/services/report.service";

const querySchema = z.object({
  range: z.enum(["today", "7d", "30d"]).default("30d"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, "ADMIN", "SUPERVISOR");

    const url = new URL(request.url);
    const { range } = querySchema.parse({
      range: url.searchParams.get("range") ?? undefined,
    });

    const stats = await getReportStats({
      workspaceId: session.user.workspaceId,
      range,
    });

    return ok(stats);
  } catch (error) {
    return handleRouteError(error);
  }
}
