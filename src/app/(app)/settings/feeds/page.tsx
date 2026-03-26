"use client";
import { useState } from "react";
import { useFeeds, useCategories, useDeleteFeed, useUpdateFeed, useCreateCategory, useDeleteCategory } from "@/hooks/useFeeds";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Trash2, RefreshCw, Plus, Download, Upload, Edit2, Check, X } from "lucide-react";
import Image from "next/image";
import type { Feed, FeedStatus } from "@/types/feed";

function statusVariant(s: FeedStatus): "success" | "warning" | "error" {
  if (s === "active") return "success";
  if (s === "stale") return "warning";
  return "error";
}

function AddFeedForm({ onAdd }: { onAdd: () => void }) {
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: categories = [] } = useCategories();
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl: url.trim(), categoryId: categoryId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add feed"); return; }
      toast("Feed added successfully", "success");
      setUrl("");
      setCategoryId("");
      qc.invalidateQueries({ queryKey: ["feeds"] });
      qc.invalidateQueries({ queryKey: ["feed-items"] });
      onAdd();
    } catch {
      setError("Failed to add feed. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-bg-secondary rounded-xl border border-border">
      <h3 className="text-sm font-semibold text-text-primary">Add Feed</h3>
      <Input
        placeholder="https://example.com/feed.xml"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        type="url"
        required
        error={error || undefined}
      />
      {categories.length > 0 && (
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      <Button type="submit" loading={loading} className="w-full">
        <Plus className="h-4 w-4" /> Add Feed
      </Button>
    </form>
  );
}

function FeedRow({ feed }: { feed: Feed }) {
  const [editing, setEditing] = useState(false);
  const [customTitle, setCustomTitle] = useState(feed.custom_title || "");
  const { mutate: deleteFeed, isPending: deleting } = useDeleteFeed();
  const { mutate: updateFeed, isPending: updating } = useUpdateFeed();
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleRefresh = async () => {
    await fetch(`/api/feeds/${feed.id}/refresh`, { method: "POST" });
    qc.invalidateQueries({ queryKey: ["feeds"] });
    qc.invalidateQueries({ queryKey: ["feed-items"] });
    toast("Feed refreshed", "success");
  };

  const handleDelete = () => {
    if (!confirm(`Remove "${feed.custom_title || feed.title}"?`)) return;
    deleteFeed(feed.id, {
      onSuccess: () => toast("Feed removed", "success"),
      onError: () => toast("Failed to remove feed", "error"),
    });
  };

  const handleSaveTitle = () => {
    updateFeed({ id: feed.id, custom_title: customTitle || null }, {
      onSuccess: () => { setEditing(false); toast("Title updated", "success"); },
    });
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border-subtle hover:bg-bg-secondary/50 transition-colors">
      {feed.favicon_url && (
        <Image src={feed.favicon_url} alt="" width={16} height={16} className="rounded-sm mt-0.5 shrink-0" unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="flex-1 h-7 px-2 text-sm border border-border rounded-md focus:outline-none focus:border-accent"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={handleSaveTitle} disabled={updating} className="text-success hover:opacity-80"><Check className="h-4 w-4" /></button>
            <button onClick={() => setEditing(false)} className="text-text-tertiary hover:text-text-secondary"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-text-primary truncate">{feed.custom_title || feed.title}</p>
            <button onClick={() => setEditing(true)} className="text-text-tertiary hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-3 w-3" /></button>
          </div>
        )}
        <p className="text-xs text-text-tertiary truncate mt-0.5">{feed.feed_url}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={statusVariant(feed.status)}>{feed.status}</Badge>
          {feed.last_fetched_at && (
            <span className="text-xs text-text-tertiary">
              Last fetched: {new Date(feed.last_fetched_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={handleRefresh} title="Refresh" className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} disabled={deleting} title="Remove" className="p-1.5 text-text-tertiary hover:text-error rounded-lg hover:bg-error/10 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function SettingsFeedsPage() {
  const { data: feeds = [], isLoading } = useFeeds();
  const { data: categories = [] } = useCategories();
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { toast } = useToast();
  const [newCatName, setNewCatName] = useState("");

  const handleCreateCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createCategory(newCatName.trim(), {
      onSuccess: () => { setNewCatName(""); toast("Category created", "success"); },
      onError: () => toast("Category name already exists", "error"),
    });
  };

  const handleExportOPML = () => { window.location.href = "/api/opml/export"; };

  return (
    <div className="max-w-[var(--container-feed)] mx-auto px-4 py-6 space-y-8">
      <h1 className="text-xl font-bold text-text-primary">Feed Settings</h1>

      <AddFeedForm onAdd={() => {}} />

      {/* Categories */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">Categories</h2>
        <form onSubmit={handleCreateCat} className="flex gap-2 mb-3">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name"
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent"
          />
          <Button type="submit" variant="secondary" size="sm">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
              <span className="flex-1 text-sm text-text-primary">{cat.name}</span>
              <button
                onClick={() => { if (confirm(`Delete "${cat.name}"? Feeds will become uncategorized.`)) deleteCategory(cat.id); }}
                className="text-text-tertiary hover:text-error transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-text-tertiary">No categories yet.</p>}
        </div>
      </section>

      {/* Feeds list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">
            My Feeds <span className="text-text-tertiary font-normal text-sm">({feeds.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleExportOPML}>
              <Download className="h-4 w-4" /> Export OPML
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-text-tertiary">Loading…</div>
          ) : feeds.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-tertiary">No feeds yet. Add one above.</div>
          ) : (
            <div className="group">
              {feeds.map((feed) => (
                <FeedRow key={feed.id} feed={feed} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
