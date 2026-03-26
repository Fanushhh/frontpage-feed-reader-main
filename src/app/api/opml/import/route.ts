import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { parseOPML } from "@/lib/opml/parse";
import { fetchFeed } from "@/lib/feed-parser/fetch-feed";
import { parseFeedXml } from "@/lib/feed-parser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const confirm = formData.get("confirm") === "true";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const xml = await file.text();
  const { feeds: opmlFeeds } = parseOPML(xml);

  if (!confirm) {
    // Return preview
    const { data: existing } = await supabase.from("feeds").select("feed_url").eq("user_id", user.id);
    const existingUrls = new Set((existing || []).map((f: { feed_url: string }) => f.feed_url));
    const duplicates = opmlFeeds.filter((f) => existingUrls.has(f.feedUrl)).map((f) => f.feedUrl);
    const toAdd = opmlFeeds.filter((f) => !existingUrls.has(f.feedUrl));
    return NextResponse.json({ preview: opmlFeeds, duplicates, toAdd: toAdd.length });
  }

  // Confirm: actually import
  const { data: existing } = await supabase.from("feeds").select("feed_url").eq("user_id", user.id);
  const existingUrls = new Set((existing || []).map((f: { feed_url: string }) => f.feed_url));
  const toAdd = opmlFeeds.filter((f) => !existingUrls.has(f.feedUrl));

  let added = 0;
  let failed = 0;

  // Create categories for new category names
  const categoryNames = [...new Set(toAdd.map((f) => f.category).filter(Boolean) as string[])];
  const catMap = new Map<string, string>();
  for (const name of categoryNames) {
    const { data: existing } = await supabase.from("categories").select("id").eq("user_id", user.id).eq("name", name).single();
    if (existing) { catMap.set(name, existing.id); continue; }
    const { data: created } = await supabase.from("categories").insert({ user_id: user.id, name, sort_order: catMap.size }).select().single();
    if (created) catMap.set(name, created.id);
  }

  for (const opmlFeed of toAdd) {
    try {
      const { xml: feedXml, effectiveUrl } = await fetchFeed(opmlFeed.feedUrl, { timeoutMs: 8000 });
      const parsed = await parseFeedXml(feedXml, effectiveUrl);
      const { data: feed } = await supabase.from("feeds").insert({
        user_id: user.id,
        feed_url: opmlFeed.feedUrl,
        effective_url: effectiveUrl !== opmlFeed.feedUrl ? effectiveUrl : null,
        site_url: opmlFeed.siteUrl || parsed.site_url,
        title: opmlFeed.title || parsed.title,
        description: parsed.description,
        favicon_url: parsed.favicon_url,
        format: parsed.format,
        status: "active",
        last_fetched_at: new Date().toISOString(),
        category_id: opmlFeed.category ? catMap.get(opmlFeed.category) || null : null,
      }).select().single();

      if (feed && parsed.items.length > 0) {
        const rows = parsed.items.map((item) => ({
          feed_id: feed.id,
          guid: item.guid,
          url: item.url,
          title: item.title,
          description: item.description,
          content_html: item.content_html,
          author: item.author,
          image_url: item.image_url,
          published_at: item.published_at?.toISOString() ?? null,
        }));
        await serviceClient.from("feed_items").upsert(rows, { onConflict: "feed_id,guid", ignoreDuplicates: true });
      }
      added++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ added, failed, skipped: opmlFeeds.length - toAdd.length });
}
