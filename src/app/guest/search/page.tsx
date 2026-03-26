"use client";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useGuestStore } from "@/store/guest";
import { FeedItemRow } from "@/components/feed/FeedItemRow";
import type { FeedItem } from "@/types/feed";

export default function GuestSearchPage() {
  const [query, setQuery] = useState("");
  const { items, feeds, readItemIds, bookmarkedItemIds, markRead, toggleBookmark } = useGuestStore();
  const feedMap = new Map(feeds.map((f) => [f.id, f]));

  const results: FeedItem[] = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return items
      .filter((item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q))
      )
      .slice(0, 20)
      .map((item) => ({
        ...item,
        is_read: readItemIds.has(item.id),
        is_bookmarked: bookmarkedItemIds.has(item.id),
        feed: feedMap.get(item.feed_id)
          ? {
              id: feedMap.get(item.feed_id)!.id,
              title: feedMap.get(item.feed_id)!.title,
              custom_title: feedMap.get(item.feed_id)!.custom_title,
              favicon_url: feedMap.get(item.feed_id)!.favicon_url,
              site_url: feedMap.get(item.feed_id)!.site_url,
            }
          : undefined,
      }));
  }, [query, items, readItemIds, bookmarkedItemIds]);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg-primary border-b border-border px-4 py-3">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            placeholder="Search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>
      {query.length >= 2 && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-text-secondary text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}
      {results.length > 0 && (
        <div>
          <p className="px-4 py-2 text-xs text-text-tertiary border-b border-border-subtle">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((item) => (
            <FeedItemRow
              key={item.id}
              item={item}
              href={`/guest/item/${item.id}`}
              isGuest
              guestMarkRead={markRead}
              guestToggleBookmark={toggleBookmark}
            />
          ))}
        </div>
      )}
      {!query && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="h-10 w-10 text-text-tertiary mb-3" />
          <p className="text-text-secondary text-sm">Search across all guest feeds</p>
        </div>
      )}
    </div>
  );
}
