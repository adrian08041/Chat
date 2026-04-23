"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type WorkspaceUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export const WORKSPACE_USERS_QUERY_KEY: QueryKey = ["workspace-users"];

export function useWorkspaceUsers() {
  return useQuery({
    queryKey: WORKSPACE_USERS_QUERY_KEY,
    queryFn: () => apiFetch<WorkspaceUser[]>("/api/users"),
  });
}
