import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchFeed } from "@/lib/feed-parser/fetch-feed";
import { parseFeedXml } from "@/lib/feed-parser";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("feeds")
    .select("*, category:categories(id,name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { feedUrl, categoryId } = body;

  if (!feedUrl) return NextResponse.json({ error: "feedUrl is required" }, { status: 400 });

  // Check duplicate
  const { data: existing } = await supabase.from("feeds").select("id").eq("user_id", user.id).eq("feed_url", feedUrl).single();
  if (existing) return NextResponse.json({ error: "Feed already subscribed" }, { status: 409 });

  // Fetch and parse feed
  let xml: string;
  let effectiveUrl: string;
  let parsed: Awaited<ReturnType<typeof parseFeedXml>>;
  try {
    ({ xml, effectiveUrl } = await fetchFeed(feedUrl));
    parsed = await parseFeedXml(xml, effectiveUrl);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 422 });
  }

  // Insert feed
  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .insert({
      user_id: user.id,
      feed_url: feedUrl,
      effective_url: effectiveUrl !== feedUrl ? effectiveUrl : null,
      site_url: parsed.site_url,
      title: parsed.title,
      description: parsed.description,
      favicon_url: parsed.favicon_url,
      format: parsed.format,
      status: "active",
      last_fetched_at: new Date().toISOString(),
      category_id: categoryId || null,
    })
    .select()
    .single();

  if (feedError) return NextResponse.json({ error: feedError.message }, { status: 500 });

  // Upsert items using service role (bypasses RLS)
  if (parsed.items.length > 0) {
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

  return NextResponse.json(feed, { status: 201 });
}
