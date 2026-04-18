// Implementação HTTP do UazApiClient.
// Base: https://{subdomain}.uazapi.com (um subdomínio por cliente do UazApi).
// Auth: header `admintoken` pra rotas admin; `token` pra rotas por instância.
// Ver Neuronios/Referencias/UazApi.md.

import {
  type ConnectInstanceResult,
  type CreateInstanceParams,
  type CreateInstanceResult,
  type InstanceStatusResult,
  type SendMediaParams,
  type SendResult,
  type SendTextParams,
  type SetWebhookParams,
  type UazApiClient,
  type UazApiInstanceCredentials,
  UazApiError,
  type UpdateDelayParams,
} from "../uazapi";
import type { WhatsAppConnectionStatus } from "../whatsapp/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(source: unknown, ...keys: string[]): string | null {
  if (!isObject(source)) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function pick(source: unknown, ...keys: string[]): unknown {
  if (!isObject(source)) return undefined;
  for (const key of keys) {
    if (key in source && source[key] !== undefined) return source[key];
  }
  return undefined;
}

function normalizeConnectionStatus(value: unknown): WhatsAppConnectionStatus {
  if (typeof value !== "string") return "disconnected";
  const normalized = value.toLowerCase();
  // Ordem importa: "disconnected".includes("connected") === true. Checar desconectado primeiro.
  if (normalized.startsWith("disconnect") || normalized === "close")
    return "disconnected";
  if (normalized === "connecting" || normalized === "qr") return "connecting";
  if (normalized === "connected" || normalized === "open") return "connected";
  return "disconnected";
}

function stripJidSuffix(value: string | null): string | null {
  if (!value) return null;
  const at = value.indexOf("@");
  return at >= 0 ? value.slice(0, at) : value;
}

export interface HttpUazApiClientConfig {
  adminSubdomain: string;
  adminToken: string;
  fetchImpl?: typeof fetch;
}

export class HttpUazApiClient implements UazApiClient {
  private readonly adminSubdomain: string;
  private readonly adminToken: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: HttpUazApiClientConfig) {
    this.adminSubdomain = config.adminSubdomain;
    this.adminToken = config.adminToken;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private baseUrl(subdomain: string): string {
    // Aceita "nutrisorry" (bare subdomain) ou "https://nutrisorry.uazapi.com"
    // (URL completa). Tolerância pra quem cola o link inteiro do painel UazApi.
    const trimmed = subdomain.trim().replace(/\/$/, "");
    if (trimmed.includes("://")) return trimmed;
    return `https://${trimmed}.uazapi.com`;
  }

  private async request(
    subdomain: string,
    path: string,
    init: {
      method: "GET" | "POST" | "DELETE";
      headers: Record<string, string>;
      body?: unknown;
    },
  ): Promise<unknown> {
    const url = `${this.baseUrl(subdomain)}${path}`;
    const response = await this.fetchImpl(url, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    const text = await response.text();
    const parsed = text ? safeJson(text) : null;

    if (!response.ok) {
      const message =
        pickString(parsed, "error", "message") ??
        `UazApi ${init.method} ${path} falhou (${response.status})`;
      throw new UazApiError(message, response.status, parsed ?? text);
    }
    return parsed;
  }

  private adminRequest(
    path: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request(this.adminSubdomain, path, {
      method: "POST",
      headers: { admintoken: this.adminToken },
      body,
    });
  }

  private instanceRequest(
    creds: UazApiInstanceCredentials,
    path: string,
    init: {
      method: "GET" | "POST" | "DELETE";
      body?: Record<string, unknown>;
    },
  ): Promise<unknown> {
    return this.request(creds.subdomain, path, {
      method: init.method,
      headers: { token: creds.token },
      body: init.body,
    });
  }

  async createInstance(
    params: CreateInstanceParams,
  ): Promise<CreateInstanceResult> {
    const result = await this.adminRequest("/instance/create", {
      name: params.name,
    });

    const instance = pick(result, "instance") ?? result;
    const instanceId = pickString(instance, "id", "instanceId");
    const token = pickString(instance, "token");

    if (!instanceId || !token) {
      throw new UazApiError(
        "Resposta inválida de /instance/create (id/token ausente)",
        502,
        result,
      );
    }
    return { instanceId, token };
  }

  async connectInstance(
    creds: UazApiInstanceCredentials,
  ): Promise<ConnectInstanceResult> {
    const result = await this.instanceRequest(creds, "/instance/connect", {
      method: "POST",
      body: {},
    });

    return {
      status: normalizeConnectionStatus(
        pickString(result, "status") ??
          pickString(pick(result, "instance"), "status"),
      ),
      qrCode:
        pickString(result, "qrcode", "qrCode", "qr_code") ??
        pickString(pick(result, "instance"), "qrcode", "qrCode"),
      pairingCode:
        pickString(result, "paircode", "pairingCode", "pairing_code") ??
        pickString(pick(result, "instance"), "paircode", "pairingCode"),
    };
  }

  async disconnectInstance(creds: UazApiInstanceCredentials): Promise<void> {
    await this.instanceRequest(creds, "/instance/disconnect", {
      method: "POST",
      body: {},
    });
  }

  async deleteInstance(creds: UazApiInstanceCredentials): Promise<void> {
    await this.instanceRequest(creds, "/instance", { method: "DELETE" });
  }

  async getInstanceStatus(
    creds: UazApiInstanceCredentials,
  ): Promise<InstanceStatusResult> {
    const result = await this.instanceRequest(creds, "/instance/status", {
      method: "GET",
    });
    const instance = pick(result, "instance") ?? result;

    return {
      status: normalizeConnectionStatus(pickString(instance, "status")),
      phone: stripJidSuffix(pickString(instance, "phone", "wid", "owner")),
    };
  }

  async sendText(
    creds: UazApiInstanceCredentials,
    params: SendTextParams,
  ): Promise<SendResult> {
    // UazApi: `track_id` e `replyid` (minúsculas, inconsistente com o resto).
    const body: Record<string, unknown> = {
      number: params.to,
      text: params.text,
    };
    if (params.async !== undefined) body.async = params.async;
    if (params.delay !== undefined) body.delay = params.delay;
    if (params.trackId !== undefined) body.track_id = params.trackId;
    if (params.replyId !== undefined) body.replyid = params.replyId;
    if (params.linkPreview !== undefined) body.linkPreview = params.linkPreview;

    const result = await this.instanceRequest(creds, "/send/text", {
      method: "POST",
      body,
    });
    return extractSendResult(result);
  }

  async sendMedia(
    creds: UazApiInstanceCredentials,
    params: SendMediaParams,
  ): Promise<SendResult> {
    const body: Record<string, unknown> = {
      number: params.to,
      type: params.type,
      file: params.file,
    };
    if (params.caption !== undefined) body.text = params.caption;
    if (params.fileName !== undefined) body.docName = params.fileName;
    if (params.mimeType !== undefined) body.mimetype = params.mimeType;
    if (params.async !== undefined) body.async = params.async;
    if (params.delay !== undefined) body.delay = params.delay;
    if (params.trackId !== undefined) body.track_id = params.trackId;
    if (params.replyId !== undefined) body.replyid = params.replyId;

    const result = await this.instanceRequest(creds, "/send/media", {
      method: "POST",
      body,
    });
    return extractSendResult(result);
  }

  async setWebhook(
    creds: UazApiInstanceCredentials,
    params: SetWebhookParams,
  ): Promise<void> {
    await this.instanceRequest(creds, "/webhook", {
      method: "POST",
      body: {
        url: params.url,
        events: params.events,
        // UazApi loop infinito se não excluir wasSentByApi — default defensivo.
        excludeMessages: params.excludeMessages ?? ["wasSentByApi"],
        addUrlEvents: params.addUrlEvents ?? false,
        addUrlTypesMessages: params.addUrlTypesMessages ?? false,
        // Default true — sem isso a UazApi salva enabled=false e nunca dispara.
        enabled: params.enabled ?? true,
      },
    });
  }

  async getWebhook(creds: UazApiInstanceCredentials): Promise<unknown> {
    return this.instanceRequest(creds, "/webhook", { method: "GET" });
  }

  async updateDelaySettings(
    creds: UazApiInstanceCredentials,
    params: UpdateDelayParams,
  ): Promise<void> {
    await this.instanceRequest(creds, "/instance/updateDelaySettings", {
      method: "POST",
      body: {
        msg_delay_min: params.min,
        msg_delay_max: params.max,
      },
    });
  }
}

function extractSendResult(result: unknown): SendResult {
  const messageId =
    pickString(result, "messageId", "id", "key_id", "wamid") ??
    pickString(pick(result, "key"), "id") ??
    pickString(pick(result, "message"), "id");

  if (!messageId) {
    throw new UazApiError(
      "Resposta de /send/* sem messageId",
      502,
      result,
    );
  }
  return {
    messageId,
    trackId: pickString(result, "track_id", "trackId", "uazapiTrackId"),
    queued:
      pick(result, "queued") === true ||
      pickString(result, "status", "state") === "queued",
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
