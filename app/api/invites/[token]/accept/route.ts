import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api-utils";
import { acceptInvite } from "@/lib/services/invite.service";

const acceptSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto"),
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .regex(/[A-Za-z]/, "A senha deve conter letras")
    .regex(/\d/, "A senha deve conter números"),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const body = acceptSchema.parse(await request.json());

    const result = await acceptInvite({
      token,
      name: body.name,
      password: body.password,
    });

    return ok({ email: result.email });
  } catch (error) {
    return handleRouteError(error);
  }
}
