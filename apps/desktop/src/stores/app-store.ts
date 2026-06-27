import { create } from "zustand";
import type { PreviewCard, TimelineSection, Collection } from "@memora/shared-types";
import * as api from "@/lib/api";

interface AppState {
  quickPasteOpen: boolean;
  trayOpen: boolean;
  query: string;
  mode: "history" | "snippets";
  results: PreviewCard[];
  timeline: TimelineSection[];
  collections: Collection[];
  selectedIndex: number;
  loading: boolean;
  setQuickPasteOpen: (open: boolean) => void;
  setTrayOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setMode: (mode: "history" | "snippets") => void;
  setSelectedIndex: (index: number) => void;
  refresh: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  quickPasteOpen: false,
  trayOpen: false,
  query: "",
  mode: "history",
  results: [],
  timeline: [],
  collections: [],
  selectedIndex: 0,
  loading: false,

  setQuickPasteOpen: (open) => set({ quickPasteOpen: open }),
  setTrayOpen: (open) => set({ trayOpen: open }),
  setQuery: (query) => set({ query }),
  setMode: (mode) => set({ mode }),
  setSelectedIndex: (index) => set({ selectedIndex: index }),

  refresh: async () => {
    set({ loading: true });
    try {
      const [timeline, collections] = await Promise.all([
        api.getTimeline(),
        api.getCollections(),
      ]);
      set({ timeline, collections, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  search: async (query: string) => {
    const { mode } = get();
    if (!query.trim()) {
      await get().refresh();
      set({ results: [], selectedIndex: 0 });
      return;
    }

    set({ loading: true, query });
    try {
      const results = await api.searchItems({
        query,
        isSnippet: mode === "snippets" ? true : undefined,
      });
      set({ results, selectedIndex: 0, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
