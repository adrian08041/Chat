export interface QuickReply {
  id: string;
  workspaceId: string;
  shortcut: string;
  category: string | null;
  title: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
}
