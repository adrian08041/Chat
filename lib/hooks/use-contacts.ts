"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ContactListItem, ContactsPage, ContactProfile } from "@/types/contact";

export const CONTACTS_QUERY_KEY: QueryKey = ["contacts"];

export type ContactSavedFilter = "saved" | "unsaved";

export type ContactsFilters = {
  search?: string;
  tagId?: string;
  savedFilter?: ContactSavedFilter;
};

function buildListUrl(filters: ContactsFilters, cursor?: string): string {
  const qs = new URLSearchParams();
  if (filters.search) qs.set("search", filters.search);
  if (filters.tagId) qs.set("tagId", filters.tagId);
  if (filters.savedFilter) qs.set("saved", filters.savedFilter);
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

export function useContactProfile(id: string | null) {
  return useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, "profile", id],
    queryFn: () => apiFetch<ContactProfile>(`/api/contacts/${id}/profile`),
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
  notes?: string | null;
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

export type CheckSkipReason = "no_instance" | "api_error";

export type CheckPhoneResult = {
  validated: boolean;
  skipReason: CheckSkipReason | null;
  isInWhatsapp: boolean;
  verifiedName: string | null;
  jid: string | null;
};

// Mínimo defensivo pra não chamar a API com fragmentos curtos (ex.: "55" do
// código do país). 8 dígitos é menor que qualquer telefone celular real (BR
// usa 10-13 com DDI/DDD; internacional varia, mas 8 é um piso seguro).
export const CHECK_PHONE_MIN_DIGITS = 8;

// Valida `phone` no WhatsApp via /api/contacts/check. Mutation (não query)
// porque o disparo é explícito — botão "Validar" no NewContactSheet — pra
// evitar enumeração de números via digitação automática.
export function useCheckWhatsappNumber() {
  return useMutation({
    mutationFn: (phone: string) => {
      const digits = phone.replace(/\D/g, "");
      return apiFetch<CheckPhoneResult>("/api/contacts/check", {
        method: "POST",
        body: JSON.stringify({ phone: digits }),
      });
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
