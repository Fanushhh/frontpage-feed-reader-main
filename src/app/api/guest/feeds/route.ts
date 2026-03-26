import { NextResponse } from "next/server";
import { GUEST_CATEGORIES, buildGuestStructure } from "@/lib/guest/seed";
import { fetchFeed } from "@/lib/feed-parser/fetch-feed";
import { parseFeedXml } from "@/lib/feed-parser";

export async function GET() {
  const { categories, feeds } = buildGuestStructure();

  // Fetch all feeds in parallel (best-effort)
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const { xml, effectiveUrl } = await fetchFeed(feed.feed_url, { timeoutMs: 5000 });
      const parsed = await parseFeedXml(xml, effectiveUrl);
      return {
        feedId: feed.id,
        items: parsed.items.slice(0, 10).map((item) => ({
          id: `${feed.id}:${item.guid}`,
          feed_id: feed.id,
          guid: item.guid,
          url: item.url,
          title: item.title,
          description: item.description,
          author: item.author,
          image_url: item.image_url,
          published_at: item.published_at?.toISOString() ?? null,
        })),
      };
    })
  );

  const allItems = results
    .filter((r) => r.status === "fulfilled")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .flatMap((r) => (r as PromiseFulfilledResult<any>).value.items);

  return NextResponse.json(
    { categories, feeds, items: allItems },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
