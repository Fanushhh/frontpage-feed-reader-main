"use client";
import { create } from "zustand";
import type { Layout } from "@/types/feed";

interface UIStore {
  sidebarOpen: boolean;
  layout: Layout;
  selectedItemId: string | null;
  commandPaletteOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setLayout: (v: Layout) => void;
  setSelectedItem: (id: string | null) => void;
  setCommandPaletteOpen: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  layout: "list",
  selectedItemId: null,
  commandPaletteOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setLayout: (v) => set({ layout: v }),
  setSelectedItem: (id) => set({ selectedItemId: id }),
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
}));
