/** Extract the first usable image URL from feed item XML data */
export function extractImage(
  contentHtml: string | null,
  mediaContent?: string | null,
  enclosureUrl?: string | null,
  enclosureType?: string | null
): string | null {
  // 1. media:content or media:thumbnail
  if (mediaContent) return mediaContent;

  // 2. enclosure with image MIME type
  if (enclosureUrl && enclosureType?.startsWith("image/")) return enclosureUrl;

  // 3. First <img> in content HTML
  if (contentHtml) {
    const match = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) {
      const src = match[1];
      // Skip data URIs and tracking pixels
      if (!src.startsWith("data:") && !src.includes("pixel") && !src.includes("tracker")) {
        return src;
      }
    }
  }

  return null;
}
