import { XMLParser } from "fast-xml-parser";
import { detectFormat } from "./detect-format";
import { normalizeRss2Item, normalizeAtomEntry } from "./normalize-item";
import { sanitizeHtml, stripHtml } from "./sanitize-html";
import { getFaviconUrl } from "@/lib/utils/favicon";
import type { ParsedFeed } from "@/types/feed";

const XML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  allowBooleanAttributes: true,
  processEntities: { enabled: true, maxTotalExpansions: 50_000 },
  htmlEntities: true,
};

function unwrap(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    if ("__cdata" in o) return String(o.__cdata ?? "");
    if ("#text" in o) return String(o["#text"] ?? "");
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export async function parseFeedXml(xml: string, feedUrl: string): Promise<ParsedFeed> {
  const parser = new XMLParser(XML_PARSER_OPTIONS);
  let parsed: Record<string, unknown>;

  try {
    parsed = parser.parse(xml);
  } catch (err) {
    throw new Error(`XML parse error: ${err}`);
  }

  const format = detectFormat(parsed);
  const feedId = feedUrl; // Use URL as stable synthetic ID for deduplication

  if (format === "atom") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feed = (parsed as any).feed;
    const title = stripHtml(unwrap(feed.title?.["#text"] ?? feed.title)) || "Untitled Feed";
    const description = stripHtml(unwrap(feed.subtitle?.["#text"] ?? feed.subtitle)) || null;

    let site_url: string | null = null;
    const links = ensureArray(feed.link);
    const altLink = links.find((l: Record<string, string>) => l["@_rel"] === "alternate" || !l["@_rel"]);
    if (altLink) site_url = altLink["@_href"] || null;

    const entries = ensureArray(feed.entry);
    const items = entries.map((e: unknown) => normalizeAtomEntry(e, feedId));

    return {
      title,
      description,
      site_url,
      favicon_url: getFaviconUrl(site_url || feedUrl),
      format: "atom",
      items,
    };
  }

  if (format === "rdf") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rdf = (parsed as any)["rdf:RDF"] || (parsed as any).RDF;
    const channel = rdf.channel || {};
    const title = stripHtml(unwrap(channel.title)) || "Untitled Feed";
    const description = stripHtml(unwrap(channel.description)) || null;
    const site_url = unwrap(channel.link) || null;
    const rawItems = ensureArray(rdf.item);
    const items = rawItems.map((i: unknown) => normalizeRss2Item(i, feedId));
    return {
      title,
      description,
      site_url,
      favicon_url: getFaviconUrl(site_url || feedUrl),
      format: "rdf",
      items,
    };
  }

  // RSS 2.0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rss = (parsed as any).rss;
  const channel = rss?.channel || parsed;
  const title = stripHtml(unwrap(channel.title)) || "Untitled Feed";
  const description = stripHtml(unwrap(channel.description)) || null;
  const site_url = unwrap(channel.link) || null;
  const rawItems = ensureArray(channel.item);
  const items = rawItems.map((i: unknown) => normalizeRss2Item(i, feedId));

  return {
    title,
    description,
    site_url,
    favicon_url: getFaviconUrl(site_url || feedUrl),
    format: "rss2",
    items,
  };
}
