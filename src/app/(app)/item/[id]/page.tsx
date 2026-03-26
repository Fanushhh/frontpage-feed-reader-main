import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/time";
import { ArticleContent } from "@/components/reader/ArticleContent";
import { AISummary } from "@/components/reader/AISummary";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("feed_items")
    .select("*, feed:feeds!feed_id(id, title, custom_title, favicon_url, site_url, category_id)")
    .eq("id", id)
    .single();

  if (error || !item) notFound();

  // Check for existing AI summary
  const { data: summaryData } = await supabase
    .from("item_summaries")
    .select("summary")
    .eq("item_id", id)
    .single();

  // Mark as read
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("read_items").upsert(
      { user_id: user.id, item_id: id },
      { ignoreDuplicates: true }
    );
  }

  const feedTitle = item.feed?.custom_title || item.feed?.title || "Unknown Source";
  const categoryId = item.feed?.category_id;

  return (
    <div className="max-w-[var(--container-content)] mx-auto px-4 py-6 sm:py-10">
      {/* Back navigation */}
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={categoryId ? `/category/${categoryId}` : "/feed"}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      {/* Article header */}
      <header className="mb-8 space-y-3">
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Link
            href={item.feed ? `/source/${item.feed.id}` : "/feed"}
            className="hover:text-accent transition-colors font-medium"
          >
            {feedTitle}
          </Link>
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

      {/* AI Summary */}
      {(item.content_html || item.description) && (
        <div className="mb-8">
          <AISummary itemId={id} initialSummary={summaryData?.summary} />
        </div>
      )}

      {/* Article content */}
      {item.content_html ? (
        <ArticleContent html={item.content_html} />
      ) : item.description ? (
        <p className="text-text-secondary leading-relaxed">{item.description}</p>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">No content available.</p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mt-2"
            >
              Read on original site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
