"use client";

import { useMutation } from "@tanstack/react-query";

import { ApiClientError } from "@/lib/api-client";

export type UploadScope = "chat" | "quick-reply";

export interface UploadResult {
  url: string;
  key: string;
  mimeType: string;
  fileName: string | null;
  size: number;
}

async function uploadToServer(params: {
  file: File;
  scope: UploadScope;
}): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", params.file);
  body.append("scope", params.scope);

  const res = await fetch("/api/uploads", { method: "POST", body });
  const payload = (await res.json()) as
    | { success: true; data: UploadResult }
    | { success: false; error: string; details?: unknown };

  if (!res.ok || !payload.success) {
    const message = !payload.success ? payload.error : "Falha no upload";
    const details = !payload.success ? payload.details : undefined;
    throw new ApiClientError(message, res.status, details);
  }

  return payload.data;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: (params: { file: File; scope: UploadScope }) =>
      uploadToServer(params),
  });
}
