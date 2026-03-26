"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, Search, Rss, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useGuestStore } from "@/store/guest";
import { GuestBanner } from "@/components/onboarding/GuestBanner";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-accent-subtle text-accent font-medium"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
      )}
    >
      <span className={cn("shrink-0", isActive ? "text-accent" : "text-text-tertiary")}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function GuestSidebar() {
  const { categories, feeds } = useGuestStore();
  return (
    <aside
      className="hidden md:flex flex-col h-full bg-bg-secondary border-r border-border shrink-0"
      style={{ width: "var(--spacing-sidebar)" }}
    >
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border-subtle">
        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
          <Rss className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-text-primary">Frontpage</span>
        <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded font-medium ml-auto">guest</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div className="space-y-0.5">
          <NavItem href="/guest/feed" icon={<Home className="h-4 w-4" />} label="All Articles" />
          <NavItem href="/guest/search" icon={<Search className="h-4 w-4" />} label="Search" />
        </div>
        {categories.map((cat) => {
          const catFeeds = feeds.filter((f) => f.category_id === cat.id);
          return (
            <div key={cat.id}>
              <p className="px-3 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                {cat.name}
              </p>
              {catFeeds.map((feed) => (
                <Link
                  key={feed.id}
                  href={`/guest/category/${cat.id}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  <span className="truncate">{feed.custom_title || feed.title}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-border-subtle p-4">
        <Link
          href="/sign-up"
          className="flex items-center justify-center gap-2 w-full bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          Sign up to save feeds <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const { initialized, isGuest, setGuestData } = useGuestStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized) return;
    setLoading(true);
    fetch("/api/guest/feeds")
      .then((r) => r.json())
      .then((data) => {
        setGuestData({ categories: data.categories, feeds: data.feeds, items: data.items });
      })
      .catch(() => setError("Failed to load feeds. Please refresh."))
      .finally(() => setLoading(false));
  }, [initialized, setGuestData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-secondary">Loading 19 feeds…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary px-4">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-accent text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-primary">
      <GuestBanner />
      <div className="flex flex-1 overflow-hidden">
        <GuestSidebar />
        <main className="flex-1 overflow-y-auto min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex">
        {[
          { href: "/guest/feed", icon: <Home className="h-5 w-5" />, label: "Feed" },
          { href: "/guest/search", icon: <Search className="h-5 w-5" />, label: "Search" },
          { href: "/sign-up", icon: <ArrowRight className="h-5 w-5" />, label: "Sign Up" },
        ].map(({ href, icon, label }) => (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-text-tertiary">
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
