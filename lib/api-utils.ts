import { NextResponse } from "next/server";
import { ZodError, type ZodIssue } from "zod";

export type ApiOk<T> = { success: true; data: T };
export type ApiFail = {
  success: false;
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiOk<T> | ApiFail;

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiOk<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  error: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiFail> {
  const body: ApiFail = { success: false, error };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function zodDetails(error: ZodError): Array<Pick<ZodIssue, "path" | "message">> {
  return error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));
}

export function handleRouteError(error: unknown): NextResponse<ApiFail> {
  if (error instanceof ApiError) {
    return fail(error.message, error.status, error.details);
  }
  if (error instanceof ZodError) {
    return fail("Dados inválidos", 422, zodDetails(error));
  }
  console.error("[api] erro não tratado:", error);
  return fail("Erro interno do servidor", 500);
}
