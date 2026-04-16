export type QuickReplyCategory = "boas-vindas" | "vendas" | "suporte";

export interface QuickReply {
  id: string;
  workspaceId: string;
  shortcut: string;
  category: QuickReplyCategory | null;
  title: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
}
