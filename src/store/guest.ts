"use client";
import { create } from "zustand";
import type { Category, Feed, FeedItem } from "@/types/feed";

interface GuestState {
  isGuest: boolean;
  categories: Category[];
  feeds: Feed[];
  items: FeedItem[];
  readItemIds: Set<string>;
  bookmarkedItemIds: Set<string>;
  initialized: boolean;
  setGuestData: (data: { categories: Category[]; feeds: Feed[]; items: FeedItem[] }) => void;
  markRead: (itemId: string) => void;
  markUnread: (itemId: string) => void;
  markAllRead: (feedId?: string, categoryId?: string) => void;
  toggleBookmark: (itemId: string) => void;
  clearGuest: () => void;
}

function loadFromSession(): Partial<GuestState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("frontpage_guest");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      readItemIds: new Set(parsed.readItemIds || []),
      bookmarkedItemIds: new Set(parsed.bookmarkedItemIds || []),
    };
  } catch {
    return {};
  }
}

function saveToSession(state: GuestState) {
  if (typeof window === "undefined") return;
  try {
    const { isGuest, categories, feeds, items, readItemIds, bookmarkedItemIds } = state;
    sessionStorage.setItem(
      "frontpage_guest",
      JSON.stringify({
        isGuest,
        categories,
        feeds,
        items,
        readItemIds: Array.from(readItemIds),
        bookmarkedItemIds: Array.from(bookmarkedItemIds),
      })
    );
  } catch {}
}

export const useGuestStore = create<GuestState>((set, get) => ({
  isGuest: false,
  categories: [],
  feeds: [],
  items: [],
  readItemIds: new Set(),
  bookmarkedItemIds: new Set(),
  initialized: false,

  setGuestData: (data) => {
    const next = {
      isGuest: true,
      initialized: true,
      ...data,
      readItemIds: get().readItemIds,
      bookmarkedItemIds: get().bookmarkedItemIds,
    };
    set(next);
    saveToSession({ ...get(), ...next });
  },

  markRead: (itemId) => {
    const readItemIds = new Set(get().readItemIds);
    readItemIds.add(itemId);
    set({ readItemIds });
    saveToSession(get());
  },

  markUnread: (itemId) => {
    const readItemIds = new Set(get().readItemIds);
    readItemIds.delete(itemId);
    set({ readItemIds });
    saveToSession(get());
  },

  markAllRead: (feedId, categoryId) => {
    const { items, feeds } = get();
    const readItemIds = new Set(get().readItemIds);
    for (const item of items) {
      if (feedId && item.feed_id !== feedId) continue;
      if (categoryId) {
        const feed = feeds.find((f) => f.id === item.feed_id);
        if (feed?.category_id !== categoryId) continue;
      }
      readItemIds.add(item.id);
    }
    set({ readItemIds });
    saveToSession(get());
  },

  toggleBookmark: (itemId) => {
    const bookmarkedItemIds = new Set(get().bookmarkedItemIds);
    if (bookmarkedItemIds.has(itemId)) {
      bookmarkedItemIds.delete(itemId);
    } else {
      bookmarkedItemIds.add(itemId);
    }
    set({ bookmarkedItemIds });
    saveToSession(get());
  },

  clearGuest: () => {
    sessionStorage.removeItem("frontpage_guest");
    set({
      isGuest: false,
      categories: [],
      feeds: [],
      items: [],
      readItemIds: new Set(),
      bookmarkedItemIds: new Set(),
      initialized: false,
    });
  },
}));

/** Call once on app init to rehydrate guest state from sessionStorage */
export function initGuestStore() {
  const stored = loadFromSession();
  if (stored.isGuest) {
    useGuestStore.setState({ ...stored, initialized: true });
  }
}
