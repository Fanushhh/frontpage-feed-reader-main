"use client";
import { useBookmarks } from "@/hooks/useBookmarks";
import { FeedList } from "@/components/feed/FeedList";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
  const { data: items = [], isLoading } = useBookmarks();

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg-primary border-b border-border px-4 py-3">
        <h1 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Bookmark className="h-4 w-4" /> Saved Articles
        </h1>
      </div>
      {!isLoading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Bookmark className="h-10 w-10 text-text-tertiary mb-3" />
          <p className="text-text-secondary text-sm">No saved articles yet.</p>
          <p className="text-text-tertiary text-xs mt-1">Bookmark articles to read them later.</p>
        </div>
      ) : (
        <FeedList items={items} isLoading={isLoading} />
      )}
    </div>
  );
}
