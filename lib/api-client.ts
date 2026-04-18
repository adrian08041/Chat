// Helper de cliente — desembrulha o envelope { success, data?, error? } do
// backend. Uso: const members = await apiFetch<TeamMember[]>("/api/team").

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(hasBody && { "Content-Type": "application/json" }),
    ...init?.headers,
  };

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (error) {
    // Network / offline / CORS — chega como TypeError. Empacota pra caller
    // distinguir de erro de negócio via status 0.
    const message = error instanceof Error ? error.message : "Erro de rede";
    throw new ApiClientError(message, 0);
  }

  let body: ApiEnvelope<T> | null = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      body = null;
    }
  }

  if (!response.ok || !body || body.success === false) {
    const error = body && "error" in body ? body.error : `HTTP ${response.status}`;
    const details = body && "details" in body ? body.details : undefined;
    throw new ApiClientError(error, response.status, details);
  }

  return body.data;
}
