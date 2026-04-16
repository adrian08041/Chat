export type NotificationType =
  | "CONVERSATION_ASSIGNED"
  | "NEW_CONTACT"
  | "TEAM_INVITE_ACCEPTED"
  | "MENTION"
  | "NUMBER_DISCONNECTED";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string | null;
  createdAt: string;
  read: boolean;
  actionUrl: string | null;
  actorName: string | null;
}
