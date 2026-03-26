"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { GUEST_CATEGORIES } from "@/lib/guest/seed";
import { Check, ArrowRight } from "lucide-react";

const SUGGESTIONS = GUEST_CATEGORIES.map((cat) => ({
  category: cat.name,
  feeds: cat.feeds.map((f) => ({ title: f.title, feedUrl: f.feedUrl })),
}));

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const toggle = (url: string) =>
    setSelectedFeeds((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );

  const handleImport = async () => {
    if (selectedFeeds.length === 0) { router.push("/feed"); return; }
    setImporting(true);
    try {
      // Add each feed in sequence (could be parallelized but we want to avoid rate limits)
      for (const feedUrl of selectedFeeds) {
        await fetch("/api/feeds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedUrl }),
        });
      }
      qc.invalidateQueries({ queryKey: ["feeds"] });
      qc.invalidateQueries({ queryKey: ["feed-items"] });
    } finally {
      setImporting(false);
      router.push("/feed");
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">What do you want to read?</h1>
          <p className="text-text-secondary text-sm">Select some feeds to get started. You can always add more later.</p>
        </div>

        <div className="space-y-6">
          {SUGGESTIONS.map(({ category, feeds }) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {feeds.map((feed) => {
                  const selected = selectedFeeds.includes(feed.feedUrl);
                  return (
                    <button
                      key={feed.feedUrl}
                      onClick={() => toggle(feed.feedUrl)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-accent bg-accent-subtle text-accent"
                          : "border-border bg-surface text-text-primary hover:border-accent/50 hover:bg-bg-tertiary"
                      }`}
                    >
                      <span className="flex-1 text-sm font-medium">{feed.title}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => router.push("/feed")}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip for now
          </button>
          <Button onClick={handleImport} loading={importing} disabled={importing}>
            {selectedFeeds.length > 0 ? `Add ${selectedFeeds.length} feed${selectedFeeds.length !== 1 ? "s" : ""}` : "Start with empty feed"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
