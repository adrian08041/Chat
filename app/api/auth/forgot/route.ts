import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api-utils";
import { requestPasswordReset } from "@/lib/services/password-reset.service";

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

export async function POST(request: NextRequest) {
  try {
    const body = forgotSchema.parse(await request.json());
    await requestPasswordReset(body.email);
    return ok({ received: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
