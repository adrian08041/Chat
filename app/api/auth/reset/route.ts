import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api-utils";
import { resetPassword } from "@/lib/services/password-reset.service";

const resetSchema = z.object({
  token: z.string().min(1, "Token inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .regex(/[A-Za-z]/, "A senha deve conter letras")
    .regex(/\d/, "A senha deve conter números"),
});

export async function POST(request: NextRequest) {
  try {
    const body = resetSchema.parse(await request.json());
    await resetPassword(body.token, body.password);
    return ok({ updated: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
