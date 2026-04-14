import { create } from "zustand";

interface ConversationState {
  selectedConversationId: string | null;
  activeFilter: "all" | "mine" | "unassigned" | "resolved";
  searchTerm: string;
  filterByInstanceId: string | null;
  filterByTagId: string | null;

  setSelectedConversation: (id: string | null) => void;
  setActiveFilter: (filter: ConversationState["activeFilter"]) => void;
  setSearchTerm: (term: string) => void;
  setFilterByInstanceId: (id: string | null) => void;
  setFilterByTagId: (id: string | null) => void;
  resetFilters: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  selectedConversationId: null,
  activeFilter: "all",
  searchTerm: "",
  filterByInstanceId: null,
  filterByTagId: null,

  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilterByInstanceId: (id) => set({ filterByInstanceId: id }),
  setFilterByTagId: (id) => set({ filterByTagId: id }),
  resetFilters: () =>
    set({
      activeFilter: "all",
      searchTerm: "",
      filterByInstanceId: null,
      filterByTagId: null,
    }),
}));
