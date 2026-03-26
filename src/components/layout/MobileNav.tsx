"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUnreadCounts } from "@/hooks/useFeeds";

const items = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/settings/feeds", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: unreadCounts } = useUnreadCounts();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex"
      aria-label="Mobile navigation"
    >
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        const showBadge = href === "/feed" && (unreadCounts?.total || 0) > 0;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors relative",
              isActive ? "text-accent" : "text-text-tertiary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {showBadge && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-unread rounded-full" />
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
