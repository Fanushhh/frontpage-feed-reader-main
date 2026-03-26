"use client";
import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/store/ui";
import type { Layout } from "@/types/feed";

export function LayoutToggle() {
  const { layout, setLayout } = useUIStore();

  const options: { value: Layout; icon: React.ReactNode; label: string }[] = [
    { value: "list", icon: <List className="h-4 w-4" />, label: "List view" },
    { value: "card", icon: <LayoutGrid className="h-4 w-4" />, label: "Card view" },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-bg-tertiary rounded-lg p-0.5" role="group" aria-label="Layout options">
      {options.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => setLayout(value)}
          aria-label={label}
          aria-pressed={layout === value}
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
            layout === value
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-tertiary hover:text-text-secondary"
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
