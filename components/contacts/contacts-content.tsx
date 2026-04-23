"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Upload, Download, Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { TagBadge } from "@/components/ui/tag-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactProfileDrawer } from "@/components/contacts/contact-profile-drawer";
import { NewContactSheet } from "@/components/contacts/new-contact-sheet";
import { formatRelativeTime } from "@/lib/format";
import { useContacts, useDeleteContact } from "@/lib/hooks/use-contacts";
import { useTags } from "@/lib/hooks/use-tags";
import { ApiClientError } from "@/lib/api-client";
import type { ContactListItem } from "@/types/contact";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

interface ContactRowProps {
  item: ContactListItem;
  onOpenProfile: (item: ContactListItem) => void;
  onStartChat: (contactId: string) => void;
  onDelete: (item: ContactListItem) => void;
  isDeleting: boolean;
}

function ContactRow({ item, onOpenProfile, onStartChat, onDelete, isDeleting }: ContactRowProps) {
  const responsavel = item.assignedUser?.name ?? "Não atribuído";
  const canDelete = item.conversasCount === 0 && !isDeleting;
  const deleteTooltip =
    item.conversasCount > 0
      ? "Contato possui conversas e não pode ser excluído"
      : "Excluir contato";

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <AvatarInitials name={item.name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-txt-primary truncate">
              {item.name ?? "Contato sem nome"}
            </p>
            {item.email && (
              <p className="text-xs text-txt-muted truncate">{item.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-txt-secondary">{item.phone}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-txt-secondary">
          {item.ultimoContato ? formatRelativeTime(item.ultimoContato) : "—"}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <AvatarInitials name={responsavel} size="sm" />
          <span className="text-sm text-txt-primary">{responsavel}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-medium text-txt-primary">{item.conversasCount}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenProfile(item)}
            className="text-xs text-primary-600 hover:text-primary-400 font-medium transition-colors whitespace-nowrap mr-1"
          >
            Ver perfil
          </button>
          <button
            onClick={() => onStartChat(item.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
            aria-label="Enviar mensagem"
          >
            <MessageSquare className="w-4 h-4 text-primary-600" />
          </button>
          <button
            onClick={() => onDelete(item)}
            disabled={!canDelete}
            title={deleteTooltip}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-light hover:bg-danger-light/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Excluir contato"
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TableRowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-border-subtle">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="py-3 px-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ContactsContent() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeTagId, setActiveTagId] = useState<string | "todos">("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createdExtra, setCreatedExtra] = useState<ContactListItem | null>(null);
  const [newContactOpen, setNewContactOpen] = useState(false);

  const debouncedSearch = useDebounced(searchInput.trim(), 300);

  const { data: tags = [] } = useTags();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useContacts({
    search: debouncedSearch || undefined,
    tagId: activeTagId === "todos" ? undefined : activeTagId,
  });

  const deleteMutation = useDeleteContact();

  const items = useMemo<ContactListItem[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  // Drawer lê item fresco do cache (mantém conversasCount/tags atualizados após
  // mutação). Fallback para o recém-criado até invalidação retornar a nova página.
  const selected = useMemo<ContactListItem | null>(() => {
    if (!selectedId) return null;
    const fromList = items.find((i) => i.id === selectedId);
    if (fromList) return fromList;
    if (createdExtra && createdExtra.id === selectedId) return createdExtra;
    return null;
  }, [selectedId, items, createdExtra]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleStartChat = useCallback(
    (contactId: string) => router.push(`/conversas?contact=${contactId}`),
    [router],
  );

  const handleDelete = useCallback(
    (item: ContactListItem) => {
      deleteMutation.mutate(item.id, {
        onSuccess: () => {
          if (selectedId === item.id) setSelectedId(null);
          toast.success(`${item.name ?? "Contato"} excluído`);
        },
        onError: (err) => {
          if (err instanceof ApiClientError && err.status === 409) {
            const details = err.details as { code?: string } | undefined;
            if (details?.code === "has_conversations") {
              toast.error("Este contato possui conversas e não pode ser excluído");
              return;
            }
          }
          const msg = err instanceof ApiClientError ? err.message : "Falha ao excluir";
          toast.error(msg);
        },
      });
    },
    [deleteMutation, selectedId],
  );

  const handleCreated = useCallback((created: ContactListItem) => {
    setNewContactOpen(false);
    setCreatedExtra(created);
    setSelectedId(created.id);
  }, []);

  const hasFilter = debouncedSearch.length > 0 || activeTagId !== "todos";

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-txt-primary">Contatos</h2>
          <p className="text-sm text-txt-muted mt-1">Gerencie seus contatos e leads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled
            title="Em breve"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary opacity-50 cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            disabled
            title="Em breve"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary opacity-50 cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setNewContactOpen(true)}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          aria-label="Buscar contatos"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body"
        />
      </div>

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtros de contatos">
        <button
          role="tab"
          aria-selected={activeTagId === "todos"}
          onClick={() => setActiveTagId("todos")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTagId === "todos"
              ? "bg-primary-600 text-txt-on-primary"
              : "bg-surface-elevated text-txt-secondary hover:bg-surface-card"
          }`}
        >
          Todos
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            role="tab"
            aria-selected={activeTagId === tag.id}
            onClick={() => setActiveTagId(tag.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTagId === tag.id
                ? "bg-primary-600 text-txt-on-primary"
                : "bg-surface-elevated text-txt-secondary hover:bg-surface-card"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <div className="bg-surface-card rounded-xl border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Contato</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Telefone</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Tags</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Último Contato</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Responsável</th>
                <th className="text-center text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Conversas</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowsSkeleton />}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm">
                    <p className="text-danger mb-3">Não foi possível carregar os contatos.</p>
                    <button
                      onClick={() => refetch()}
                      className="inline-flex items-center gap-2 px-3 h-8 rounded-lg border border-border-default text-xs font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && items.map((item) => (
                <ContactRow
                  key={item.id}
                  item={item}
                  onOpenProfile={(row) => setSelectedId(row.id)}
                  onStartChat={handleStartChat}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
                />
              ))}

              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-txt-muted">
                    {hasFilter
                      ? "Nenhum contato encontrado para este filtro."
                      : "Nenhum contato ainda. Clique em \u201CNovo Contato\u201D para começar."}
                  </td>
                </tr>
              )}

              {isFetchingNextPage && <TableRowsSkeleton count={2} />}
            </tbody>
          </table>
        </div>
        {hasNextPage && !isFetchingNextPage && (
          <div ref={sentinelRef} className="h-1" aria-hidden />
        )}
      </div>

      <ContactProfileDrawer
        item={selected}
        onClose={() => setSelectedId(null)}
        onStartChat={() => {
          if (!selected) return;
          const id = selected.id;
          setSelectedId(null);
          router.push(`/conversas?contact=${id}`);
        }}
        onDelete={() => {
          if (selected) handleDelete(selected);
        }}
      />

      <NewContactSheet
        open={newContactOpen}
        onClose={() => setNewContactOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
