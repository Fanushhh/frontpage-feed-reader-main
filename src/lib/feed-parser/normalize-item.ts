import { parseDate } from "./parse-date";
import { extractImage } from "./extract-image";
import { sanitizeHtml, stripHtml } from "./sanitize-html";
import { toExcerpt } from "@/lib/utils/excerpt";
import type { NormalizedFeedItem } from "@/types/feed";
import crypto from "crypto";

function unwrapCdata(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if ("__cdata" in obj) return String(obj.__cdata ?? "");
    if ("#text" in obj) return String(obj["#text"] ?? "");
  }
  return "";
}

function makeGuid(feedId: string, url: string | null, fallback: string): string {
  const base = url || fallback || String(Math.random());
  return crypto.createHash("sha256").update(feedId + base).digest("hex").slice(0, 32);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeRss2Item(raw: any, feedId: string): NormalizedFeedItem {
  const title = stripHtml(unwrapCdata(raw.title)) || "(untitled)";
  const link = unwrapCdata(raw.link) || unwrapCdata(raw["@_rdf:about"]) || null;
  const guid = unwrapCdata(raw.guid) || link || makeGuid(feedId, link, title);
  const description = unwrapCdata(raw.description) || null;
  const contentEncoded = unwrapCdata(raw["content:encoded"]) || null;
  const content_html = contentEncoded
    ? sanitizeHtml(contentEncoded)
    : description && description.includes("<")
    ? sanitizeHtml(description)
    : null;
  const plainDescription = content_html
    ? toExcerpt(stripHtml(content_html))
    : description
    ? toExcerpt(stripHtml(description))
    : null;

  const mediaUrl =
    unwrapCdata(raw["media:content"]?.["@_url"]) ||
    unwrapCdata(raw["media:thumbnail"]?.["@_url"]) ||
    null;
  const enclosureUrl = unwrapCdata(raw.enclosure?.["@_url"]) || null;
  const enclosureType = unwrapCdata(raw.enclosure?.["@_type"]) || null;
  const image_url = extractImage(content_html || description, mediaUrl, enclosureUrl, enclosureType);

  const author =
    stripHtml(unwrapCdata(raw["dc:creator"])) ||
    stripHtml(unwrapCdata(raw.author)) ||
    null;

  const pubDate = parseDate(
    unwrapCdata(raw.pubDate) || unwrapCdata(raw["dc:date"]) || unwrapCdata(raw.published)
  );

  return {
    guid,
    url: link,
    title,
    description: plainDescription,
    content_html,
    author,
    image_url,
    published_at: pubDate,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAtomEntry(raw: any, feedId: string): NormalizedFeedItem {
  const title = stripHtml(unwrapCdata(raw.title?.["#text"] ?? raw.title)) || "(untitled)";

  let link: string | null = null;
  if (Array.isArray(raw.link)) {
    const alternate = raw.link.find((l: Record<string, string>) => l["@_rel"] === "alternate" || !l["@_rel"]);
    link = alternate?.["@_href"] || raw.link[0]?.["@_href"] || null;
  } else if (raw.link) {
    link = raw.link["@_href"] || unwrapCdata(raw.link) || null;
  }

  const id = unwrapCdata(raw.id) || link || makeGuid(feedId, link, title);
  const contentRaw = raw.content;
  const summaryRaw = raw.summary;
  const contentText = unwrapCdata(contentRaw?.["#text"] ?? contentRaw);
  const summaryText = unwrapCdata(summaryRaw?.["#text"] ?? summaryRaw);
  const contentType = contentRaw?.["@_type"] || "text";
  const isHtmlContent = contentType === "html" || contentType === "xhtml";

  const content_html = isHtmlContent && contentText ? sanitizeHtml(contentText) : null;
  const description = summaryText
    ? toExcerpt(stripHtml(summaryText))
    : content_html
    ? toExcerpt(stripHtml(content_html))
    : null;

  const mediaUrl = raw["media:content"]?.["@_url"] || raw["media:thumbnail"]?.["@_url"] || null;
  const image_url = extractImage(content_html, mediaUrl, null, null);

  let author: string | null = null;
  if (raw.author) {
    author =
      stripHtml(unwrapCdata(raw.author.name)) ||
      stripHtml(unwrapCdata(raw.author)) ||
      null;
  }

  const published_at = parseDate(
    unwrapCdata(raw.published) || unwrapCdata(raw.updated)
  );

  return {
    guid: id,
    url: link,
    title,
    description,
    content_html,
    author,
    image_url,
    published_at,
  };
}
