"use client";
import { useMemo } from "react";
import { useGuestStore } from "@/store/guest";
import { FeedList } from "@/components/feed/FeedList";
import { LayoutToggle } from "@/components/feed/LayoutToggle";
import type { FeedItem } from "@/types/feed";

export default function GuestFeedPage() {
  const { items, feeds, readItemIds, bookmarkedItemIds, markRead, toggleBookmark } = useGuestStore();

  const enriched: FeedItem[] = useMemo(() => {
    const feedMap = new Map(feeds.map((f) => [f.id, f]));
    return items
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
      }))
      .sort((a, b) => {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0;
        const db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return db - da;
      });
  }, [items, feeds, readItemIds, bookmarkedItemIds]);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg-primary border-b border-border px-4 py-3 flex items-center gap-3">
        <h1 className="flex-1 text-base font-semibold text-text-primary">All Articles</h1>
        <LayoutToggle />
      </div>
      <FeedList
        items={enriched}
        isGuest
        guestMarkRead={markRead}
        guestToggleBookmark={toggleBookmark}
        itemHref={(item) => `/guest/item/${encodeURIComponent(item.id)}`}
      />
    </div>
  );
}
