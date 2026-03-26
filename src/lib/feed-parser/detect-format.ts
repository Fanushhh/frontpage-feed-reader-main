export type FeedFormat = "rss2" | "atom" | "rdf";

export function detectFormat(parsed: Record<string, unknown>): FeedFormat {
  // Atom: root element is <feed>
  if ("feed" in parsed) return "atom";

  // RDF: root element is <rdf:RDF> or <rss> with RDF namespace
  if ("rdf:RDF" in parsed || "RDF" in parsed) return "rdf";

  // RSS 2.0: root element is <rss>
  if ("rss" in parsed) return "rss2";

  // Fallback: check for channel element (RSS-like)
  if ("channel" in parsed) return "rss2";

  throw new Error("Unknown feed format — could not detect RSS/Atom/RDF");
}
