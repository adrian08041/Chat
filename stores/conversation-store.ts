import { create } from "zustand";

interface ConversationState {
  selectedConversationId: string | null;
  activeFilter: "all" | "mine" | "unassigned" | "resolved";
  searchTerm: string;

  setSelectedConversation: (id: string | null) => void;
  setActiveFilter: (filter: ConversationState["activeFilter"]) => void;
  setSearchTerm: (term: string) => void;
  resetFilters: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  selectedConversationId: null,
  activeFilter: "all",
  searchTerm: "",

  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  resetFilters: () =>
    set({
      activeFilter: "all",
      searchTerm: "",
    }),
}));
