import type { Feed, Category } from "@/types/feed";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateOPML(feeds: Feed[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const grouped = new Map<string | null, Feed[]>();

  for (const feed of feeds) {
    const key = feed.category_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(feed);
  }

  const feedToOutline = (feed: Feed) => {
    const title = escapeXml(feed.custom_title || feed.title);
    const xmlUrl = escapeXml(feed.feed_url);
    const htmlUrl = feed.site_url ? ` htmlUrl="${escapeXml(feed.site_url)}"` : "";
    return `      <outline type="rss" text="${title}" title="${title}" xmlUrl="${xmlUrl}"${htmlUrl} />`;
  };

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<opml version=\"2.0\">",
    "  <head>",
    `    <title>Frontpage Subscriptions</title>`,
    `    <dateCreated>${new Date().toUTCString()}</dateCreated>`,
    "  </head>",
    "  <body>",
  ];

  // Uncategorized feeds first
  const uncategorized = grouped.get(null) || [];
  for (const feed of uncategorized) {
    lines.push(`    ${feedToOutline(feed).trim()}`);
  }

  // Categorized feeds
  for (const [catId, catFeeds] of grouped) {
    if (catId === null) continue;
    const catName = escapeXml(catMap.get(catId) || "Uncategorized");
    lines.push(`    <outline text="${catName}" title="${catName}">`);
    for (const feed of catFeeds) {
      lines.push(feedToOutline(feed));
    }
    lines.push("    </outline>");
  }

  lines.push("  </body>");
  lines.push("</opml>");

  return lines.join("\n");
}
