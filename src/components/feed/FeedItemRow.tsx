"use client";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, BookmarkCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/time";
import { useMarkRead } from "@/hooks/useReadState";
import { useToggleBookmark } from "@/hooks/useBookmarks";
import type { FeedItem } from "@/types/feed";

interface FeedItemRowProps {
  item: FeedItem;
  href: string;
  isGuest?: boolean;
  guestMarkRead?: (id: string) => void;
  guestToggleBookmark?: (id: string) => void;
}

export function FeedItemRow({ item, href, isGuest, guestMarkRead, guestToggleBookmark }: FeedItemRowProps) {
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
        "group flex items-start gap-3 px-4 py-3.5 border-b border-border-subtle hover:bg-bg-secondary transition-colors",
        item.is_read && "opacity-60"
      )}
    >
      {/* Unread indicator */}
      <div className="shrink-0 pt-1.5">
        {!item.is_read ? (
          <Circle className="h-2 w-2 fill-unread text-unread" />
        ) : (
          <div className="h-2 w-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {item.feed?.favicon_url && (
            <Image
              src={item.feed.favicon_url}
              alt=""
              width={12}
              height={12}
              className="rounded-sm opacity-70"
              unoptimized
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span className="text-xs text-text-tertiary truncate">{feedTitle}</span>
          <span className="text-xs text-text-tertiary">·</span>
          <time className="text-xs text-text-tertiary shrink-0" dateTime={item.published_at || ""}>
            {formatRelativeTime(item.published_at)}
          </time>
        </div>

        <Link href={href} onClick={handleClick} className="block group/link">
          <h3 className={cn(
            "text-sm font-medium text-text-primary leading-snug group-hover/link:text-accent transition-colors line-clamp-2 mb-1",
          )}>
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </Link>
      </div>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        aria-label={item.is_bookmarked ? "Remove bookmark" : "Bookmark"}
        className={cn(
          "shrink-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
          item.is_bookmarked
            ? "text-accent opacity-100"
            : "text-text-tertiary hover:text-accent"
        )}
      >
        {item.is_bookmarked
          ? <BookmarkCheck className="h-4 w-4" />
          : <Bookmark className="h-4 w-4" />
        }
      </button>
    </article>
  );
}
