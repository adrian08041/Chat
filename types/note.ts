export interface InternalNote {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  content: string;
  mentionedUserIds: string[];
  createdAt: string;
}
