"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarInitials } from "./avatar-initials";
import { useConversationStore } from "@/stores/conversation-store";
import type { Conversation } from "@/types/conversation";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
}

const FILTER_TABS = [
  { key: "all", label: "Todas" },
  { key: "mine", label: "Minhas" },
  { key: "unassigned", label: "Não atribuídas" },
  { key: "resolved", label: "Resolvidas" },
] as const;

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const {
    selectedConversationId,
    activeFilter,
    searchTerm,
    setSelectedConversation,
    setActiveFilter,
    setSearchTerm,
  } = useConversationStore();

  const filtered = conversations.filter((conv) => {
    if (activeFilter === "mine") return conv.assignedUserId === currentUserId;
    if (activeFilter === "unassigned") return conv.status === "UNASSIGNED";
    if (activeFilter === "resolved") return conv.status === "RESOLVED";
    return true;
  }).filter((conv) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      conv.contact?.name?.toLowerCase().includes(q) ||
      conv.contact?.phone?.toLowerCase().includes(q) ||
      conv.lastMessagePreview?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="hidden sm:flex w-[380px] flex-shrink-0 border-r border-border-default bg-surface-card flex-col h-full">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
        <h2 className="font-headline font-bold text-xl text-txt-primary">Conversas</h2>
        <button
          aria-label="Filtros avançados"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-elevated transition-colors"
        >
          <SlidersHorizontal className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="px-5 pb-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            placeholder="Pesquisar ou começar uma nova conversa"
            aria-label="Pesquisar conversas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body"
          />
        </div>
      </div>

      <div className="px-5 pb-3 flex gap-1 flex-shrink-0" role="tablist" aria-label="Filtros de conversas">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeFilter === tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200",
              activeFilter === tab.key
                ? "bg-primary-50 text-primary-600"
                : "text-txt-muted hover:text-txt-secondary hover:bg-surface-elevated"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => {
          const isSelected = selectedConversationId === conv.id;

          return (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={cn(
                "w-full flex items-start gap-3 px-5 py-3.5 text-left transition-all duration-150 border-b border-border-subtle",
                isSelected
                  ? "bg-primary-50/60"
                  : "hover:bg-surface-elevated"
              )}
            >
              <div className="relative flex-shrink-0">
                <AvatarInitials name={conv.contact?.name ?? null} size="lg" />
                {conv.status !== "RESOLVED" && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-headline font-semibold text-sm text-txt-primary truncate">
                    {conv.contact?.name ?? conv.contact?.phone ?? "Sem nome"}
                  </span>
                  <span className="text-xs text-txt-muted font-body flex-shrink-0 ml-2">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-txt-secondary truncate pr-2 font-body">
                    {conv.lastMessagePreview || "Sem mensagens"}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
