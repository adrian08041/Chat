// Storage — Cloudflare R2 via S3-compatible API.
// Backend Plan §1.4 + passo 14. Usa credenciais em R2_* env vars.
// Interface é provider-agnostic — trocar R2 por S3/Spaces vira swap de client.

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { ApiError } from "./api-utils";

export interface UploadParams {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  contentDisposition?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

type R2Env = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

let cachedEnv: R2Env | null = null;

function readEnv(): R2Env {
  if (cachedEnv) return cachedEnv;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new ApiError(
      "Storage não configurado (R2_* ausentes no .env)",
      500,
    );
  }

  cachedEnv = { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
  return cachedEnv;
}

let cachedClient: S3Client | null = null;

function getClient(accountId: string, accessKeyId: string, secretAccessKey: string): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

export async function uploadFile(params: UploadParams): Promise<UploadResult> {
  const env = readEnv();
  const client = getClient(env.accountId, env.accessKeyId, env.secretAccessKey);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        ContentDisposition: params.contentDisposition,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no upload";
    throw new ApiError(`Upload falhou: ${message}`, 502);
  }

  const normalizedPublicUrl = env.publicUrl.replace(/\/+$/, "");
  return {
    key: params.key,
    url: `${normalizedPublicUrl}/${params.key}`,
    size: params.body.byteLength,
  };
}

export async function deleteFile(key: string): Promise<void> {
  const env = readEnv();
  const client = getClient(env.accountId, env.accessKeyId, env.secretAccessKey);

  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: env.bucket, Key: key }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no delete";
    throw new ApiError(`Delete falhou: ${message}`, 502);
  }
}

export function buildObjectKey(params: {
  workspaceId: string;
  scope: "chat" | "quick-reply";
  fileName: string;
}): string {
  const ext = params.fileName.includes(".")
    ? params.fileName.slice(params.fileName.lastIndexOf("."))
    : "";
  // Limita extensão pra evitar key inflada com nomes tipo ".aaa...".
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 16);
  const uuid = crypto.randomUUID();
  return `${params.workspaceId}/${params.scope}/${uuid}${safeExt}`;
}
