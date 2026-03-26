"use client";
import { use, useMemo } from "react";
import { useFeedItems } from "@/hooks/useFeedItems";
import { useFeeds, useUnreadCounts } from "@/hooks/useFeeds";
import { FeedList } from "@/components/feed/FeedList";
import { FeedPageHeader } from "@/components/feed/FeedPageHeader";
import { useQueryClient } from "@tanstack/react-query";

export default function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: feeds = [] } = useFeeds();
  const feed = feeds.find((f) => f.id === id);
  const { data: unread } = useUnreadCounts();
  const qc = useQueryClient();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFeedItems({ feedId: id });
  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const handleRefresh = async () => {
    await fetch(`/api/feeds/${id}/refresh`, { method: "POST" });
    qc.invalidateQueries({ queryKey: ["feed-items"] });
    qc.invalidateQueries({ queryKey: ["unread-counts"] });
  };

  return (
    <div>
      <FeedPageHeader
        title={feed?.custom_title || feed?.title || "Feed"}
        subtitle={unread?.byFeed[id] ? `${unread.byFeed[id]} unread` : undefined}
        feedId={id}
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
