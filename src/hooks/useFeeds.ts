"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Feed, Category } from "@/types/feed";

export function useFeeds() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["feeds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feeds")
        .select("*, category:categories(id,name,sort_order)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Feed[];
    },
  });
}

export function useCategories() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as Category[];
    },
  });
}

export function useUnreadCounts() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["unread-counts"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return { total: 0, byFeed: {}, byCategory: {} };
      const { data, error } = await supabase.rpc("get_unread_counts", {
        p_user_id: user.user.id,
      });
      if (error) throw error;
      const byFeed: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      let total = 0;
      for (const row of data || []) {
        byFeed[row.feed_id] = (byFeed[row.feed_id] || 0) + Number(row.unread_count);
        if (row.category_id) {
          byCategory[row.category_id] = (byCategory[row.category_id] || 0) + Number(row.unread_count);
        }
        total += Number(row.unread_count);
      }
      return { total, byFeed, byCategory };
    },
    staleTime: 30_000,
  });
}

export function useDeleteFeed() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (feedId: string) => {
      const { error } = await supabase.from("feeds").delete().eq("id", feedId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feeds"] });
      qc.invalidateQueries({ queryKey: ["feed-items"] });
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });
}

export function useUpdateFeed() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Feed> & { id: string }) => {
      const { error } = await supabase.from("feeds").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feeds"] }),
  });
}

export function useCreateCategory() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");
      const { data: existing } = await supabase.from("categories").select("sort_order").eq("user_id", user.id).order("sort_order", { ascending: false }).limit(1);
      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
      const { data, error } = await supabase.from("categories").insert({ user_id: user.id, name, sort_order: nextOrder }).select().single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["feeds"] });
    },
  });
}
