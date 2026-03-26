import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchFeed } from "@/lib/feed-parser/fetch-feed";
import { parseFeedXml } from "@/lib/feed-parser";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: feed, error: feedError } = await supabase
    .from("feeds").select("*").eq("id", id).eq("user_id", user.id).single();
  if (feedError || !feed) return NextResponse.json({ error: "Feed not found" }, { status: 404 });

  const feedUrl = feed.effective_url || feed.feed_url;

  try {
    const { xml, etag, lastModified, effectiveUrl, notModified } = await fetchFeed(feedUrl, {
      etag: feed.etag,
      lastModified: feed.last_modified,
    });

    const updateData: Record<string, unknown> = {
      last_fetched_at: new Date().toISOString(),
      status: "active",
      error_count: 0,
      last_error: null,
      updated_at: new Date().toISOString(),
    };

    if (etag) updateData.etag = etag;
    if (lastModified) updateData.last_modified = lastModified;
    if (effectiveUrl && effectiveUrl !== feedUrl) updateData.effective_url = effectiveUrl;

    if (!notModified) {
      const parsed = await parseFeedXml(xml, effectiveUrl);
      if (parsed.items.length > 0) {
        const rows = parsed.items.map((item) => ({
          feed_id: id,
          guid: item.guid,
          url: item.url,
          title: item.title,
          description: item.description,
          content_html: item.content_html,
          author: item.author,
          image_url: item.image_url,
          published_at: item.published_at?.toISOString() ?? null,
        }));
        await serviceClient.from("feed_items").upsert(rows, { onConflict: "feed_id,guid", ignoreDuplicates: false });
      }
    }

    await supabase.from("feeds").update(updateData).eq("id", id);
    return NextResponse.json({ success: true, notModified });
  } catch (err) {
    const lastFetched = feed.last_fetched_at;
    const isStale = lastFetched && (Date.now() - new Date(lastFetched).getTime()) > 30 * 24 * 60 * 60 * 1000;
    await supabase.from("feeds").update({
      status: isStale ? "stale" : "error",
      last_error: err instanceof Error ? err.message : "Unknown error",
      error_count: (feed.error_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
