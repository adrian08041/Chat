"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ContactListItem, ContactsPage } from "@/types/contact";

export const CONTACTS_QUERY_KEY: QueryKey = ["contacts"];

export type ContactsFilters = {
  search?: string;
  tagId?: string;
};

function buildListUrl(filters: ContactsFilters, cursor?: string): string {
  const qs = new URLSearchParams();
  if (filters.search) qs.set("search", filters.search);
  if (filters.tagId) qs.set("tagId", filters.tagId);
  if (cursor) qs.set("cursor", cursor);
  const q = qs.toString();
  return q ? `/api/contacts?${q}` : "/api/contacts";
}

export function useContacts(filters: ContactsFilters) {
  return useInfiniteQuery({
    queryKey: [...CONTACTS_QUERY_KEY, "list", filters],
    queryFn: ({ pageParam }) =>
      apiFetch<ContactsPage>(
        buildListUrl(filters, pageParam as string | undefined),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, "detail", id],
    queryFn: () => apiFetch<ContactListItem>(`/api/contacts/${id}`),
    enabled: id !== null,
  });
}

export type ContactUpsertPayload = {
  name: string;
  phone: string;
  email?: string | null;
  assignedUserId?: string | null;
  tagIds?: string[];
  source?: string | null;
};

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactUpsertPayload) =>
      apiFetch<ContactListItem>("/api/contacts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<ContactUpsertPayload>) => {
      const { id, ...body } = input;
      return apiFetch<ContactListItem>(`/api/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/contacts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
}
