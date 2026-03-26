"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { FeedItem } from "@/types/feed";

export function useBookmarks() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*, item:feed_items!item_id(*, feed:feeds!feed_id(id,title,custom_title,favicon_url,site_url))")
        .eq("user_id", user.user.id)
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((b: { item: FeedItem; saved_at: string }) => ({
        ...b.item,
        is_bookmarked: true,
        saved_at: b.saved_at,
      })) as FeedItem[];
    },
  });
}

export function useToggleBookmark() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, bookmarked }: { itemId: string; bookmarked: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      if (bookmarked) {
        await supabase.from("bookmarks").upsert({ user_id: user.user.id, item_id: itemId });
      } else {
        await supabase.from("bookmarks").delete().eq("user_id", user.user.id).eq("item_id", itemId);
      }
    },
    onMutate: async ({ itemId, bookmarked }) => {
      // Optimistic update in feed-items queries
      const queryCache = qc.getQueryCache();
      queryCache.findAll({ queryKey: ["feed-items"] }).forEach((query) => {
        qc.setQueryData(query.queryKey, (old: unknown) => {
          if (!old || !("pages" in (old as object))) return old;
          const pages = (old as { pages: { items: Array<{ id: string; is_bookmarked?: boolean }> }[] }).pages;
          return {
            ...(old as object),
            pages: pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === itemId ? { ...item, is_bookmarked: bookmarked } : item
              ),
            })),
          };
        });
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });
}
