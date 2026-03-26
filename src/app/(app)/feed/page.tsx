"use client";
import { useMemo } from "react";
import { useFeedItems } from "@/hooks/useFeedItems";
import { FeedList } from "@/components/feed/FeedList";
import { FeedPageHeader } from "@/components/feed/FeedPageHeader";
import { useUnreadCounts } from "@/hooks/useFeeds";
import Link from "next/link";
import { Rss } from "lucide-react";
import { useFeeds } from "@/hooks/useFeeds";

export default function FeedPage() {
  const { data: feeds = [] } = useFeeds();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFeedItems();
  const { data: unread } = useUnreadCounts();

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const hasFeeds = feeds.length > 0;

  const handleRefresh = async () => {
    await fetch("/api/refresh-all", { method: "POST" });
  };

  if (!isLoading && !hasFeeds) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-accent-subtle flex items-center justify-center mb-4">
          <Rss className="h-7 w-7 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">No feeds yet</h2>
        <p className="text-text-secondary text-sm mb-6 max-w-xs">
          Add RSS/Atom feeds to start building your personalized front page.
        </p>
        <Link
          href="/settings/feeds"
          className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Add your first feed
        </Link>
      </div>
    );
  }

  return (
    <div>
      <FeedPageHeader
        title="All Articles"
        subtitle={unread?.total ? `${unread.total} unread` : undefined}
        onRefresh={handleRefresh}
      />
      <FeedList
        items={items}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}
