import { XMLParser } from "fast-xml-parser";

export interface OPMLFeed {
  title: string;
  feedUrl: string;
  siteUrl: string | null;
  category: string | null;
}

export interface OPMLParseResult {
  feeds: OPMLFeed[];
  title: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
});

function extractOutlines(outlines: unknown[], parentCategory: string | null): OPMLFeed[] {
  const results: OPMLFeed[] = [];
  for (const outline of outlines) {
    if (!outline || typeof outline !== "object") continue;
    const o = outline as Record<string, unknown>;
    const type = (o["@_type"] || "").toString().toLowerCase();
    const xmlUrl = (o["@_xmlUrl"] || o["@_xmlurl"] || o["@_xmlURL"] || "").toString();
    const htmlUrl = (o["@_htmlUrl"] || o["@_htmlurl"] || o["@_htmlURL"] || "").toString();
    const text = (o["@_text"] || o["@_title"] || "").toString();

    if (xmlUrl) {
      // This is a feed outline
      results.push({
        title: text || xmlUrl,
        feedUrl: xmlUrl,
        siteUrl: htmlUrl || null,
        category: parentCategory,
      });
    } else if (type === "folder" || o.outline) {
      // This is a category folder — recurse
      const children = o.outline ? (Array.isArray(o.outline) ? o.outline : [o.outline]) : [];
      results.push(...extractOutlines(children, text || parentCategory));
    }
  }
  return results;
}

export function parseOPML(xml: string): OPMLParseResult {
  const parsed = parser.parse(xml);
  const opml = parsed?.opml || parsed;
  const head = opml?.head || {};
  const body = opml?.body || {};
  const title = head?.title?.toString() || null;

  const topOutlines = body.outline
    ? Array.isArray(body.outline)
      ? body.outline
      : [body.outline]
    : [];

  const feeds = extractOutlines(topOutlines, null);
  return { feeds, title };
}
