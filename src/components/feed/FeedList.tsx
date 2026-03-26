"use client";
import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { FeedItemRow } from "./FeedItemRow";
import { FeedItemCard } from "./FeedItemCard";
import { FeedItemSkeleton } from "@/components/ui/Skeleton";
import { useUIStore } from "@/store/ui";
import type { FeedItem } from "@/types/feed";

interface FeedListProps {
  items: FeedItem[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  itemHref?: (item: FeedItem) => string;
  isGuest?: boolean;
  guestMarkRead?: (id: string) => void;
  guestToggleBookmark?: (id: string) => void;
}

export function FeedList({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  itemHref,
  isGuest,
  guestMarkRead,
  guestToggleBookmark,
}: FeedListProps) {
  const { layout } = useUIStore();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleHref = useCallback(
    (item: FeedItem) => itemHref?.(item) ?? (isGuest ? `/guest/item/${item.id}` : `/item/${item.id}`),
    [itemHref, isGuest]
  );

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !onLoadMore || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasNextPage]);

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />)}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <p className="text-text-secondary text-sm">No articles yet.</p>
      </div>
    );
  }

  if (layout === "card") {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {items.map((item) => (
            <FeedItemCard
              key={item.id}
              item={item}
              href={handleHref(item)}
              isGuest={isGuest}
              guestMarkRead={guestMarkRead}
              guestToggleBookmark={guestToggleBookmark}
            />
          ))}
        </div>
        {(isFetchingNextPage || hasNextPage) && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <FeedItemRow
          key={item.id}
          item={item}
          href={handleHref(item)}
          isGuest={isGuest}
          guestMarkRead={guestMarkRead}
          guestToggleBookmark={guestToggleBookmark}
        />
      ))}
      {(isFetchingNextPage || hasNextPage) && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />}
        </div>
      )}
    </div>
  );
}
