/** Get favicon URL for a domain, falling back to Google S2 service */
export function getFaviconUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}
