import { create } from "zustand";

interface UIState {
  contactPanelOpen: boolean;

  toggleContactPanel: () => void;
  setContactPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  contactPanelOpen: true,

  toggleContactPanel: () =>
    set((s) => ({ contactPanelOpen: !s.contactPanelOpen })),
  setContactPanelOpen: (open) => set({ contactPanelOpen: open }),
}));
