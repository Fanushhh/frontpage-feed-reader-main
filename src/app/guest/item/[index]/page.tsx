"use client";
import { use } from "react";
import { useGuestStore } from "@/store/guest";
import { ArrowLeft, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/time";
import { ArticleContent } from "@/components/reader/ArticleContent";
import { notFound } from "next/navigation";

export default function GuestItemPage({ params }: { params: Promise<{ index: string }> }) {
  const { index } = use(params);
  const { items, feeds, bookmarkedItemIds, toggleBookmark, markRead } = useGuestStore();

  const item = items.find((i) => i.id === index);
  if (!item) notFound();

  const feed = feeds.find((f) => f.id === item.feed_id);
  const isBookmarked = bookmarkedItemIds.has(item.id);

  // Mark as read
  markRead(item.id);

  return (
    <div className="max-w-[var(--container-content)] mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/guest/feed"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <button
          onClick={() => toggleBookmark(item.id)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          {isBookmarked ? (
            <><BookmarkCheck className="h-4 w-4 text-accent" /> Saved</>
          ) : (
            <><Bookmark className="h-4 w-4" /> Save</>
          )}
        </button>
      </div>

      <header className="mb-8 space-y-3">
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <span className="font-medium text-text-secondary">{feed?.custom_title || feed?.title}</span>
          {item.published_at && (
            <>
              <span>·</span>
              <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
            </>
          )}
          {item.author && (
            <>
              <span>·</span>
              <span>{item.author}</span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
          {item.title}
        </h1>

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            Read original article
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </header>

      {item.content_html ? (
        <ArticleContent html={item.content_html} />
      ) : item.description ? (
        <p className="text-text-secondary leading-relaxed">{item.description}</p>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm mb-3">No content available in this feed.</p>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
              Read on original site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-border-subtle text-center">
        <p className="text-sm text-text-secondary mb-3">Enjoying Frontpage?</p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          Create a free account to save your feeds
        </Link>
      </div>
    </div>
  );
}
