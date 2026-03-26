export type FeedStatus = "active" | "stale" | "error";
export type Layout = "list" | "card";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export interface Feed {
  id: string;
  user_id: string;
  category_id: string | null;
  feed_url: string;
  site_url: string | null;
  title: string;
  custom_title: string | null;
  description: string | null;
  favicon_url: string | null;
  format: "rss2" | "atom" | "rdf" | null;
  status: FeedStatus;
  last_fetched_at: string | null;
  last_error: string | null;
  error_count: number;
  etag: string | null;
  last_modified: string | null;
  effective_url: string | null;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  // joined
  category?: Category | null;
}

export interface FeedItem {
  id: string;
  feed_id: string;
  guid: string;
  url: string | null;
  title: string;
  description: string | null;
  content_html: string | null;
  author: string | null;
  image_url: string | null;
  published_at: string | null;
  fetched_at: string;
  created_at: string;
  // computed from joins
  is_read?: boolean;
  is_bookmarked?: boolean;
  // joined
  feed?: Pick<Feed, "id" | "title" | "custom_title" | "favicon_url" | "site_url">;
}

export interface Bookmark {
  user_id: string;
  item_id: string;
  saved_at: string;
  item?: FeedItem;
}

export interface UserPreferences {
  user_id: string;
  layout: Layout;
  refresh_interval: number;
  theme: "light" | "dark" | "system";
  font_size: "sm" | "base" | "lg";
  mark_read_on_open: boolean;
  show_read_items: boolean;
}

export interface ItemSummary {
  item_id: string;
  summary: string;
  model: string;
  generated_at: string;
  token_count: number | null;
}

/** Normalized output from feed parser */
export interface NormalizedFeedItem {
  guid: string;
  url: string | null;
  title: string;
  description: string | null;
  content_html: string | null;
  author: string | null;
  image_url: string | null;
  published_at: Date | null;
}

export interface ParsedFeed {
  title: string;
  description: string | null;
  site_url: string | null;
  favicon_url: string | null;
  format: "rss2" | "atom" | "rdf";
  items: NormalizedFeedItem[];
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UnreadCounts {
  total: number;
  byFeed: Record<string, number>;
  byCategory: Record<string, number>;
}
