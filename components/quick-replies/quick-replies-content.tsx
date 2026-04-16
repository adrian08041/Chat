"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { QuickReplyCard } from "@/components/quick-replies/quick-reply-card";
import { QuickReplySheet } from "@/components/quick-replies/quick-reply-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MOCK_QUICK_REPLIES } from "@/lib/mock-data";
import { QUICK_REPLY_CATEGORIES } from "@/lib/constants";
import type { QuickReply, QuickReplyCategory } from "@/types/quick-reply";

type FilterKey = "todos" | QuickReplyCategory;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "todos", label: "Todas" },
  ...QUICK_REPLY_CATEGORIES.map((c) => ({ key: c.key as FilterKey, label: c.label })),
];

type SheetState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; target: QuickReply };

export function QuickRepliesContent() {
  const [replies, setReplies] = useState<QuickReply[]>(MOCK_QUICK_REPLIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const [sheetState, setSheetState] = useState<SheetState>({ mode: "closed" });
  const [deleteTarget, setDeleteTarget] = useState<QuickReply | null>(null);

  const existingShortcuts = useMemo(() => {
    const excludeId = sheetState.mode === "edit" ? sheetState.target.id : null;
    return new Set(
      replies.filter((r) => r.id !== excludeId).map((r) => r.shortcut)
    );
  }, [replies, sheetState]);

  const filteredReplies = useMemo(() => {
    return replies.filter((r) => {
      if (activeFilter !== "todos" && r.category !== activeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          r.shortcut.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [replies, activeFilter, searchTerm]);

  const handleOpenCreate = useCallback(() => setSheetState({ mode: "create" }), []);
  const handleOpenEdit = useCallback(
    (reply: QuickReply) => setSheetState({ mode: "edit", target: reply }),
    []
  );
  const handleCloseSheet = useCallback(() => setSheetState({ mode: "closed" }), []);

  const handleSubmit = useCallback(
    (data: {
      shortcut: string;
      title: string;
      content: string;
      category: QuickReplyCategory;
      hasMedia: boolean;
    }) => {
      if (sheetState.mode === "create") {
        const now = new Date().toISOString();
        const newReply: QuickReply = {
          id: `qr-${Date.now()}`,
          workspaceId: "w1",
          shortcut: data.shortcut,
          title: data.title,
          content: data.content,
          category: data.category,
          mediaUrl: data.hasMedia ? "/placeholder-media.png" : null,
          mediaType: data.hasMedia ? "image/png" : null,
          createdAt: now,
        };
        setReplies((prev) => [newReply, ...prev]);
      } else if (sheetState.mode === "edit") {
        setReplies((prev) =>
          prev.map((r) =>
            r.id === sheetState.target.id
              ? {
                  ...r,
                  shortcut: data.shortcut,
                  title: data.title,
                  content: data.content,
                  category: data.category,
                  mediaUrl: data.hasMedia ? r.mediaUrl ?? "/placeholder-media.png" : null,
                  mediaType: data.hasMedia ? r.mediaType ?? "image/png" : null,
                }
              : r
          )
        );
      }
      setSheetState({ mode: "closed" });
    },
    [sheetState]
  );

  const handleRequestDelete = useCallback((reply: QuickReply) => {
    setDeleteTarget(reply);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setReplies((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleCancelDelete = useCallback(() => setDeleteTarget(null), []);

  const sheetInitial = sheetState.mode === "edit" ? sheetState.target : null;
  const sheetMode = sheetState.mode === "edit" ? "edit" : "create";

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-txt-primary">
            Respostas Rápidas
          </h2>
          <p className="text-sm text-txt-muted mt-1">
            Crie e gerencie mensagens pré-definidas para agilizar o atendimento
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Resposta
        </button>
      </div>

      {/* Busca + filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            placeholder="Buscar respostas..."
            aria-label="Buscar respostas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body"
          />
        </div>

        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtros de categoria">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeFilter === tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 h-10 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-primary-600 text-txt-on-primary"
                  : "bg-surface-elevated text-txt-secondary hover:bg-surface-card"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de cards */}
      <div className="flex flex-col gap-3">
        {filteredReplies.map((reply) => (
          <QuickReplyCard
            key={reply.id}
            reply={reply}
            onEdit={handleOpenEdit}
            onDelete={handleRequestDelete}
          />
        ))}
        {filteredReplies.length === 0 && (
          <div className="bg-surface-card rounded-xl border border-border-default py-12 text-center">
            <p className="text-sm text-txt-muted">Nenhuma resposta encontrada.</p>
          </div>
        )}
      </div>

      {/* Sheet criar/editar */}
      <QuickReplySheet
        open={sheetState.mode !== "closed"}
        mode={sheetMode}
        initial={sheetInitial}
        existingShortcuts={existingShortcuts}
        onClose={handleCloseSheet}
        onSubmit={handleSubmit}
      />

      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir resposta"
        description={
          <>
            Tem certeza que deseja excluir a resposta{" "}
            <strong>/{deleteTarget?.shortcut}</strong>? Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
