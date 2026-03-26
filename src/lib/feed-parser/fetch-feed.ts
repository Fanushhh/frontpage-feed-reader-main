export interface FetchResult {
  xml: string;
  etag: string | null;
  lastModified: string | null;
  effectiveUrl: string;
  notModified: boolean;
}

export async function fetchFeed(
  url: string,
  options?: { etag?: string | null; lastModified?: string | null; timeoutMs?: number }
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 10_000);

  const headers: Record<string, string> = {
    "User-Agent": "Frontpage/1.0 (RSS Reader; +https://frontpage.app)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  };

  if (options?.etag) headers["If-None-Match"] = options.etag;
  if (options?.lastModified) headers["If-Modified-Since"] = options.lastModified;

  let response: Response;
  let effectiveUrl = url;

  try {
    response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: "follow",
    });
    effectiveUrl = response.url || url;
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 304) {
    return {
      xml: "",
      etag: response.headers.get("ETag"),
      lastModified: response.headers.get("Last-Modified"),
      effectiveUrl,
      notModified: true,
    };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const xml = await response.text();

  return {
    xml,
    etag: response.headers.get("ETag"),
    lastModified: response.headers.get("Last-Modified"),
    effectiveUrl,
    notModified: false,
  };
}
