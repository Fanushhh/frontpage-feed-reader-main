"use client";
import { RefreshCw, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LayoutToggle } from "./LayoutToggle";
import { Button } from "@/components/ui/Button";
import { useMarkAllRead } from "@/hooks/useReadState";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";

interface FeedPageHeaderProps {
  title: string;
  subtitle?: string;
  feedId?: string;
  categoryId?: string;
  onRefresh?: () => Promise<void>;
}

export function FeedPageHeader({ title, subtitle, feedId, categoryId, onRefresh }: FeedPageHeaderProps) {
  const { mutate: markAllRead, isPending: marking } = useMarkAllRead();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleMarkAllRead = () => {
    markAllRead(
      { feedId, categoryId },
      { onSuccess: () => toast("Marked all as read", "success") }
    );
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
      toast("Feed refreshed", "success");
    } catch {
      toast("Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-bg-primary border-b border-border px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-text-primary truncate">{title}</h1>
        {subtitle && <p className="text-xs text-text-tertiary truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            aria-label="Refresh feed"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} loading={marking} aria-label="Mark all as read">
          <CheckCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Mark read</span>
        </Button>
        <LayoutToggle />
      </div>
    </div>
  );
}
