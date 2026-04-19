export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export const TAG_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#0EA5E9",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];
