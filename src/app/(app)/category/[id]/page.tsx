"use client";
import { use, useMemo } from "react";
import { useFeedItems } from "@/hooks/useFeedItems";
import { useCategories, useUnreadCounts } from "@/hooks/useFeeds";
import { FeedList } from "@/components/feed/FeedList";
import { FeedPageHeader } from "@/components/feed/FeedPageHeader";
import { notFound } from "next/navigation";

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: categories = [] } = useCategories();
  const category = categories.find((c) => c.id === id);
  const { data: unread } = useUnreadCounts();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFeedItems({ categoryId: id });
  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  if (!isLoading && categories.length > 0 && !category) notFound();

  return (
    <div>
      <FeedPageHeader
        title={category?.name ?? "Category"}
        subtitle={unread?.byCategory[id] ? `${unread.byCategory[id]} unread` : undefined}
        categoryId={id}
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
