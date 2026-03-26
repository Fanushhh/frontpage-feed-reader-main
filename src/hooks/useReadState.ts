"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useMarkRead() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, read }: { itemId: string; read: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      if (read) {
        await supabase.from("read_items").upsert({ user_id: user.user.id, item_id: itemId });
      } else {
        await supabase.from("read_items").delete().eq("user_id", user.user.id).eq("item_id", itemId);
      }
    },
    onMutate: async ({ itemId, read }) => {
      // Optimistic update: update all feed-items query caches
      const queryCache = qc.getQueryCache();
      const feedItemQueries = queryCache.findAll({ queryKey: ["feed-items"] });
      feedItemQueries.forEach((query) => {
        qc.setQueryData(query.queryKey, (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in (old as object))) return old;
          const pages = (old as { pages: { items: Array<{ id: string; is_read?: boolean }> }[] }).pages;
          return {
            ...(old as object),
            pages: pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === itemId ? { ...item, is_read: read } : item
              ),
            })),
          };
        });
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });
}

export function useMarkAllRead() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedId, categoryId }: { feedId?: string; categoryId?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Get all item IDs for the given scope
      let feedIds: string[] = [];

      if (feedId) {
        feedIds = [feedId];
      } else if (categoryId) {
        const { data } = await supabase.from("feeds").select("id").eq("category_id", categoryId).eq("user_id", user.user.id);
        feedIds = (data || []).map((f: { id: string }) => f.id);
      } else {
        const { data } = await supabase.from("feeds").select("id").eq("user_id", user.user.id);
        feedIds = (data || []).map((f: { id: string }) => f.id);
      }

      if (feedIds.length === 0) return;

      const { data: items } = await supabase.from("feed_items").select("id").in("feed_id", feedIds);
      if (!items || items.length === 0) return;

      const rows = items.map((i: { id: string }) => ({ user_id: user.user!.id, item_id: i.id }));
      await supabase.from("read_items").upsert(rows, { ignoreDuplicates: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed-items"] });
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });
}
