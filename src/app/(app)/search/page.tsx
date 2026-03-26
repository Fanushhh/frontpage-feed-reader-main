"use client";
import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FeedItemRow } from "@/components/feed/FeedItemRow";
import { FeedItemSkeleton } from "@/components/ui/Skeleton";
import type { FeedItem } from "@/types/feed";

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-warning/20 text-text-primary rounded px-0.5">{part}</mark>
      : part
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg-primary border-b border-border px-4 py-3">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            placeholder="Search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            aria-label="Search articles"
          />
        </div>
      </div>

      {loading && (
        <div>{Array.from({ length: 5 }).map((_, i) => <FeedItemSkeleton key={i} />)}</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Search className="h-10 w-10 text-text-tertiary mb-3" />
          <p className="text-text-secondary text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p className="px-4 py-2 text-xs text-text-tertiary border-b border-border-subtle">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          {results.map((item) => (
            <FeedItemRow key={item.id} item={item} href={`/item/${item.id}`} />
          ))}
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Search className="h-10 w-10 text-text-tertiary mb-3" />
          <p className="text-text-secondary text-sm">Search across all your feeds</p>
        </div>
      )}
    </div>
  );
}
