const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parse a date string from RSS/Atom feeds robustly */
export function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const s = raw.trim();

  // ISO 8601 / standard JS parse
  const direct = new Date(s);
  if (!isNaN(direct.getTime())) return direct;

  // RFC 822 / RFC 2822: "Mon, 01 Jan 2024 12:00:00 +0000" or "01 Jan 2024 12:00:00 GMT"
  const rfc = s.match(
    /(?:\w+,\s*)?(\d{1,2})\s+(\w{3})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s*(?:([+-]\d{4})|(\w+))?/
  );
  if (rfc) {
    const [, day, mon, year, hh, mm, ss, tz, tzName] = rfc;
    const month = MONTHS[mon.toLowerCase()];
    if (month !== undefined) {
      const tzStr = tz || (tzName === "GMT" || tzName === "UTC" ? "+0000" : "");
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${hh}:${mm}:${ss}${tzStr || "Z"}`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Last resort: strip non-standard suffixes and try again
  const cleaned = s.replace(/\s*\(.*\)$/, "").trim();
  const fallback = new Date(cleaned);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}
