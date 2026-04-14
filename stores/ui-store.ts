import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  contactPanelOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleContactPanel: () => void;
  setContactPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  contactPanelOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileSidebar: () =>
    set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleContactPanel: () =>
    set((s) => ({ contactPanelOpen: !s.contactPanelOpen })),
  setContactPanelOpen: (open) => set({ contactPanelOpen: open }),
}));
