"use client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { FeedItem } from "@/types/feed";

const PAGE_SIZE = 25;

interface FeedItemsFilter {
  feedId?: string;
  categoryId?: string;
  bookmarked?: boolean;
  search?: string;
}

export function useFeedItems(filter: FeedItemsFilter = {}) {
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: ["feed-items", filter],
    queryFn: async ({ pageParam }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Build feed IDs list based on filter
      let feedIds: string[] | null = null;

      if (filter.feedId) {
        feedIds = [filter.feedId];
      } else if (filter.categoryId) {
        const { data: catFeeds } = await supabase
          .from("feeds")
          .select("id")
          .eq("category_id", filter.categoryId)
          .eq("user_id", user.user.id);
        feedIds = (catFeeds || []).map((f: { id: string }) => f.id);
        if (feedIds.length === 0) return { items: [], nextCursor: null };
      }

      let query = supabase
        .from("feed_items")
        .select(`
          *,
          feed:feeds!feed_id(id, title, custom_title, favicon_url, site_url, category_id)
        `)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);

      if (feedIds) {
        query = query.in("feed_id", feedIds);
      } else {
        // All feeds for this user
        const { data: userFeeds } = await supabase
          .from("feeds")
          .select("id")
          .eq("user_id", user.user.id);
        const allFeedIds = (userFeeds || []).map((f: { id: string }) => f.id);
        if (allFeedIds.length === 0) return { items: [], nextCursor: null };
        query = query.in("feed_id", allFeedIds);
      }

      if (pageParam) {
        const [cursorDate, cursorId] = (pageParam as string).split("|");
        query = query.or(
          `published_at.lt.${cursorDate},and(published_at.eq.${cursorDate},id.lt.${cursorId})`
        );
      }

      const { data: items, error } = await query;
      if (error) throw error;

      // Get read/bookmark state for these items
      const itemIds = (items || []).map((i: FeedItem) => i.id);
      const [readData, bookmarkData] = await Promise.all([
        itemIds.length
          ? supabase.from("read_items").select("item_id").eq("user_id", user.user.id).in("item_id", itemIds)
          : { data: [] },
        itemIds.length
          ? supabase.from("bookmarks").select("item_id").eq("user_id", user.user.id).in("item_id", itemIds)
          : { data: [] },
      ]);

      const readSet = new Set((readData.data || []).map((r: { item_id: string }) => r.item_id));
      const bookmarkSet = new Set((bookmarkData.data || []).map((b: { item_id: string }) => b.item_id));

      const enriched: FeedItem[] = (items || []).map((item: FeedItem) => ({
        ...item,
        is_read: readSet.has(item.id),
        is_bookmarked: bookmarkSet.has(item.id),
      }));

      const last = enriched[enriched.length - 1];
      const nextCursor =
        enriched.length === PAGE_SIZE && last
          ? `${last.published_at}|${last.id}`
          : null;

      return { items: enriched, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useFeedItem(itemId: string) {
  const supabase = createClient();
  return useInfiniteQuery({
    queryKey: ["feed-item", itemId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("feed_items")
        .select("*, feed:feeds!feed_id(id, title, custom_title, favicon_url, site_url)")
        .eq("id", itemId)
        .single();
      if (error) throw error;
      const [readData, bookmarkData] = await Promise.all([
        supabase.from("read_items").select("item_id").eq("user_id", user.user?.id).eq("item_id", itemId),
        supabase.from("bookmarks").select("item_id").eq("user_id", user.user?.id).eq("item_id", itemId),
      ]);
      return {
        ...data,
        is_read: (readData.data?.length || 0) > 0,
        is_bookmarked: (bookmarkData.data?.length || 0) > 0,
      } as FeedItem;
    },
    initialPageParam: null,
    getNextPageParam: () => null,
  });
}
