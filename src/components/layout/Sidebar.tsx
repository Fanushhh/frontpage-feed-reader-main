"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bookmark, Search, Settings, Rss, LogOut, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFeeds, useCategories, useUnreadCounts } from "@/hooks/useFeeds";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Image from "next/image";

interface NavItemProps {
  href: string;
  icon?: React.ReactNode;
  label: string;
  count?: number;
  favicon?: string | null;
  indent?: boolean;
}

function NavItem({ href, icon, label, count, favicon, indent }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors group",
        indent && "pl-7",
        isActive
          ? "bg-accent-subtle text-accent font-medium"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
      )}
    >
      {favicon ? (
        <Image
          src={favicon}
          alt=""
          width={14}
          height={14}
          className="rounded-sm shrink-0 opacity-80"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          unoptimized
        />
      ) : icon ? (
        <span className={cn("shrink-0", isActive ? "text-accent" : "text-text-tertiary group-hover:text-text-secondary")}>
          {icon}
        </span>
      ) : null}
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className={cn(
          "text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center",
          isActive ? "bg-accent/20 text-accent" : "bg-bg-tertiary text-text-tertiary"
        )}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

interface CategorySectionProps {
  categoryId: string;
  name: string;
  unreadCount: number;
  feeds: Array<{ id: string; title: string; custom_title: string | null; favicon_url: string | null; unread?: number }>;
}

function CategorySection({ categoryId, name, unreadCount, feeds }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1 group">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 flex-1 text-xs font-semibold text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Link href={`/category/${categoryId}`} className="flex-1 text-left hover:text-accent">
            {name}
          </Link>
          {unreadCount > 0 && (
            <span className="text-xs text-text-tertiary ml-1">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>
      </div>
      {expanded && (
        <div className="space-y-0.5">
          {feeds.map((feed) => (
            <NavItem
              key={feed.id}
              href={`/source/${feed.id}`}
              label={feed.custom_title || feed.title}
              favicon={feed.favicon_url}
              count={feed.unread}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { data: feeds = [] } = useFeeds();
  const { data: categories = [] } = useCategories();
  const { data: unreadCounts } = useUnreadCounts();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const uncategorized = feeds.filter((f) => !f.category_id);

  return (
    <aside
      className="flex flex-col h-full bg-bg-secondary border-r border-border"
      style={{ width: "var(--spacing-sidebar)" }}
      aria-label="Navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border-subtle">
        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Rss className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-text-primary">Frontpage</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Main nav */}
        <div className="space-y-0.5">
          <NavItem href="/feed" icon={<Home className="h-4 w-4" />} label="All Articles" count={unreadCounts?.total} />
          <NavItem href="/saved" icon={<Bookmark className="h-4 w-4" />} label="Saved" />
          <NavItem href="/search" icon={<Search className="h-4 w-4" />} label="Search" />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-2">
            {categories.map((cat) => {
              const catFeeds = feeds.filter((f) => f.category_id === cat.id);
              return (
                <CategorySection
                  key={cat.id}
                  categoryId={cat.id}
                  name={cat.name}
                  unreadCount={unreadCounts?.byCategory[cat.id] || 0}
                  feeds={catFeeds.map((f) => ({
                    id: f.id,
                    title: f.title,
                    custom_title: f.custom_title,
                    favicon_url: f.favicon_url,
                    unread: unreadCounts?.byFeed[f.id],
                  }))}
                />
              );
            })}
          </div>
        )}

        {/* Uncategorized */}
        {uncategorized.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-3 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Uncategorized
            </p>
            {uncategorized.map((feed) => (
              <NavItem
                key={feed.id}
                href={`/source/${feed.id}`}
                label={feed.custom_title || feed.title}
                favicon={feed.favicon_url}
                count={unreadCounts?.byFeed[feed.id]}
              />
            ))}
          </div>
        )}

        {/* Add feed shortcut */}
        <Link
          href="/settings/feeds"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add feed
        </Link>
      </nav>

      {/* Footer */}
      <div className="border-t border-border-subtle px-2 py-2 space-y-0.5">
        <NavItem href="/settings/feeds" icon={<Settings className="h-4 w-4" />} label="Settings" />
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <LogOut className="h-4 w-4 text-text-tertiary" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
