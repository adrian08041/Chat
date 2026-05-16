// Cliente HTTP UazApi — contrato provider-agnostic.
// Passo 7 do Backend Plan. A implementação (stub vs UazApi real) entra em
// lib/uazapi/*.ts. Callers dependem só desta interface, que casa com a
// normalização em lib/whatsapp/* (Backend Plan §10.2).

import { HttpUazApiClient } from "./uazapi/http";
import type {
  WhatsAppConnectionStatus,
  WhatsAppEventKind,
} from "./whatsapp/types";

// Credenciais por instância. Subdomínio + token vivem em Instance no banco.
export interface UazApiInstanceCredentials {
  subdomain: string;
  token: string;
}

export interface CreateInstanceParams {
  name: string;
}

export interface CreateInstanceResult {
  instanceId: string;
  token: string;
}

export interface ConnectInstanceResult {
  status: WhatsAppConnectionStatus;
  qrCode: string | null;
  pairingCode: string | null;
}

export interface InstanceStatusResult {
  status: WhatsAppConnectionStatus;
  phone: string | null;
}

export type UazApiMediaType =
  | "image"
  | "video"
  | "audio"
  | "ptt"
  | "document"
  | "sticker";

export interface SendTextParams {
  to: string;
  text: string;
  delay?: number;
  trackId?: string;
  replyId?: string;
  async?: boolean;
  linkPreview?: boolean;
}

export interface SendMediaParams {
  to: string;
  type: UazApiMediaType;
  file: string;
  caption?: string;
  fileName?: string;
  mimeType?: string;
  delay?: number;
  trackId?: string;
  replyId?: string;
  async?: boolean;
}

export interface SendResult {
  messageId: string;
  trackId: string | null;
  queued: boolean;
}

export type WebhookExcludeFilter =
  | "wasSentByApi"
  | "wasNotSentByApi"
  | "fromMeYes"
  | "fromMeNo"
  | "isGroupYes"
  | "isGroupNo";

export interface SetWebhookParams {
  url: string;
  events: WhatsAppEventKind[];
  excludeMessages?: WebhookExcludeFilter[];
  addUrlEvents?: boolean;
  addUrlTypesMessages?: boolean;
  // UazApi salva `enabled:false` por default — sem isso o webhook é cadastrado
  // mas nunca dispara. Gotcha descoberto em diagnóstico.
  enabled?: boolean;
}

export interface UpdateDelayParams {
  min: number;
  max: number;
}

// /chat/find — busca paginada de chats da instância.
// Sort default no nosso uso: "-wa_lastMsgTimestamp" (mais recentes primeiro).
export interface ListChatsParams {
  limit: number;
  offset: number;
  sort?: string;
  operator?: "AND" | "OR";
  // Filtros adicionais aceitos pelo /chat/find (ex.: `wa_isGroup: false`).
  // Mantido como Record permissivo porque o endpoint aceita muitos campos.
  filters?: Record<string, unknown>;
}

// Subset do schema Chat do UazApi (63 campos no total). Mantemos só o que
// importa pro sync de contatos. Tudo opcional porque a UazApi pode omitir.
export interface UazApiChat {
  wa_chatid?: string | null;
  phone?: string | null;
  wa_contactName?: string | null;
  wa_name?: string | null;
  name?: string | null;
  image?: string | null;
  imagePreview?: string | null;
  wa_isGroup?: boolean | null;
  wa_lastMsgTimestamp?: number | null;
}

export interface ListChatsResult {
  chats: UazApiChat[];
  pagination: {
    totalRecords: number;
    limit: number;
    offset: number;
  };
}

// /chat/check — valida se números existem no WhatsApp.
// Subset do schema oficial; mantemos só o que aplicamos no UI.
export interface UazApiNumberCheck {
  query: string;
  jid: string | null;
  isInWhatsapp: boolean;
  verifiedName: string | null;
  groupName: string | null;
  error: string | null;
}

// /contacts/list — agenda do aparelho paginada.
// Diferente de /chat/find: traz contatos sem conversa (lead salvo no celular).
export type ContactScope = "address_book" | "outside_address_book" | "all";

export interface ListContactsParams {
  limit: number;   // <= 1000
  offset: number;
  contactScope: ContactScope;
}

// Os nomes dos campos refletem o schema documentado da UazApi
// (`contact_name`, `contact_FirstName`). Se houver divergência de casing/nome
// no response real, mapear no HTTP client em vez de propagar pro contrato.
export interface UazApiAddressBookContact {
  jid: string;
  contact_name: string | null;
  contact_FirstName: string | null;
}

export interface ListContactsResult {
  contacts: UazApiAddressBookContact[];
  pagination: {
    totalRecords: number;
    limit: number;
    offset: number;
  };
  totalDeviceContacts: number;
}

export interface UazApiClient {
  // Admin (precisa UAZAPI_ADMIN_TOKEN)
  createInstance(params: CreateInstanceParams): Promise<CreateInstanceResult>;

  // Ciclo de vida (por instância)
  connectInstance(
    creds: UazApiInstanceCredentials,
  ): Promise<ConnectInstanceResult>;
  disconnectInstance(creds: UazApiInstanceCredentials): Promise<void>;
  deleteInstance(creds: UazApiInstanceCredentials): Promise<void>;
  getInstanceStatus(
    creds: UazApiInstanceCredentials,
  ): Promise<InstanceStatusResult>;

  // Envio
  sendText(
    creds: UazApiInstanceCredentials,
    params: SendTextParams,
  ): Promise<SendResult>;
  sendMedia(
    creds: UazApiInstanceCredentials,
    params: SendMediaParams,
  ): Promise<SendResult>;

  // Chats
  listChats(
    creds: UazApiInstanceCredentials,
    params: ListChatsParams,
  ): Promise<ListChatsResult>;

  // Agenda do aparelho (complementar a listChats — traz contatos sem conversa)
  listContacts(
    creds: UazApiInstanceCredentials,
    params: ListContactsParams,
  ): Promise<ListContactsResult>;

  // Validação de números no WhatsApp
  checkNumbers(
    creds: UazApiInstanceCredentials,
    numbers: string[],
  ): Promise<UazApiNumberCheck[]>;

  // Config
  setWebhook(
    creds: UazApiInstanceCredentials,
    params: SetWebhookParams,
  ): Promise<void>;
  getWebhook(creds: UazApiInstanceCredentials): Promise<unknown>;
  updateDelaySettings(
    creds: UazApiInstanceCredentials,
    params: UpdateDelayParams,
  ): Promise<void>;
}

export class UazApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "UazApiError";
  }
}

// Factory com lazy-init. Primeira chamada lê env e instancia HttpUazApiClient;
// testes podem sobrescrever via setUazApiClient antes do primeiro get.
let clientInstance: UazApiClient | null = null;

export function setUazApiClient(client: UazApiClient): void {
  clientInstance = client;
}

export function getUazApiClient(): UazApiClient {
  if (!clientInstance) {
    const adminToken = process.env.UAZAPI_ADMIN_TOKEN;
    const adminSubdomain = process.env.UAZAPI_DEFAULT_SUBDOMAIN;
    if (!adminToken || !adminSubdomain) {
      throw new Error(
        "UAZAPI_ADMIN_TOKEN e UAZAPI_DEFAULT_SUBDOMAIN são obrigatórios",
      );
    }
    clientInstance = new HttpUazApiClient({ adminSubdomain, adminToken });
  }
  return clientInstance;
}
