import { NextRequest, NextResponse } from "next/server";
import { fetchFeed } from "@/lib/feed-parser/fetch-feed";
import { parseFeedXml } from "@/lib/feed-parser";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let feedUrl: string;
    try {
      feedUrl = new URL(url).toString();
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const { xml, effectiveUrl } = await fetchFeed(feedUrl);
    const feed = await parseFeedXml(xml, effectiveUrl);

    return NextResponse.json({
      title: feed.title,
      description: feed.description,
      site_url: feed.site_url,
      favicon_url: feed.favicon_url,
      format: feed.format,
      effectiveUrl,
      itemCount: feed.items.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch feed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
