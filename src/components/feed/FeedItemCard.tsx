"use client";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, BookmarkCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/time";
import { useMarkRead } from "@/hooks/useReadState";
import { useToggleBookmark } from "@/hooks/useBookmarks";
import type { FeedItem } from "@/types/feed";

interface FeedItemCardProps {
  item: FeedItem;
  href: string;
  isGuest?: boolean;
  guestMarkRead?: (id: string) => void;
  guestToggleBookmark?: (id: string) => void;
}

export function FeedItemCard({ item, href, isGuest, guestMarkRead, guestToggleBookmark }: FeedItemCardProps) {
  const { mutate: markRead } = useMarkRead();
  const { mutate: toggleBookmark } = useToggleBookmark();
  const feedTitle = item.feed?.custom_title || item.feed?.title || "";

  const handleClick = () => {
    if (!item.is_read) {
      if (isGuest) guestMarkRead?.(item.id);
      else markRead({ itemId: item.id, read: true });
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) guestToggleBookmark?.(item.id);
    else toggleBookmark({ itemId: item.id, bookmarked: !item.is_bookmarked });
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-surface hover:border-border hover:shadow-md transition-all overflow-hidden",
        item.is_read && "opacity-60"
      )}
    >
      {/* Image */}
      {item.image_url && (
        <div className="aspect-video overflow-hidden bg-bg-tertiary shrink-0">
          <Image
            src={item.image_url}
            alt=""
            width={400}
            height={225}
            className="w-full h-full object-cover"
            unoptimized
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-2">
        {/* Source + date */}
        <div className="flex items-center gap-1.5">
          {!item.is_read && <Circle className="h-1.5 w-1.5 fill-unread text-unread shrink-0" />}
          {item.feed?.favicon_url && (
            <Image src={item.feed.favicon_url} alt="" width={12} height={12} className="rounded-sm opacity-70" unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <span className="text-xs text-text-tertiary truncate flex-1">{feedTitle}</span>
          <time className="text-xs text-text-tertiary shrink-0">{formatRelativeTime(item.published_at)}</time>
        </div>

        {/* Title + excerpt */}
        <Link href={href} onClick={handleClick} className="block">
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">{item.description}</p>
          )}
        </Link>

        {/* Bookmark */}
        <div className="flex items-center justify-end mt-auto pt-1">
          <button
            onClick={handleBookmark}
            aria-label={item.is_bookmarked ? "Remove bookmark" : "Bookmark"}
            className={cn(
              "p-1 rounded transition-colors",
              item.is_bookmarked ? "text-accent" : "text-text-tertiary hover:text-accent opacity-0 group-hover:opacity-100"
            )}
          >
            {item.is_bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
