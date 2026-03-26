import Link from "next/link";
import { Rss, LayoutList, Tag, Bookmark, Sparkles, WifiOff, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle">
        <div className="max-w-[var(--container-page)] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <Rss className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-text-primary text-lg">Frontpage</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-accent text-white px-4 py-1.5 rounded-lg hover:bg-accent-hover transition-colors font-medium"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-[var(--container-page)] mx-auto px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" /> Now with AI summaries
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight mb-6 max-w-3xl mx-auto">
            Your personalized front page for tech content
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-10">
            Subscribe to the RSS feeds you care about. One calm, organized home for everything you want to read — your sources, your categories, your pace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent-hover transition-colors shadow-md"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/guest/feed"
              className="inline-flex items-center gap-2 border border-border bg-surface text-text-primary px-6 py-3 rounded-xl font-semibold hover:bg-bg-secondary transition-colors"
            >
              Try as guest
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-tertiary">
            No credit card required · Guest mode loads instantly with 19 real feeds
          </p>
        </section>

        {/* Feature grid */}
        <section className="border-t border-border-subtle bg-bg-secondary">
          <div className="max-w-[var(--container-page)] mx-auto px-6 py-16 sm:py-20">
            <h2 className="text-2xl font-bold text-text-primary text-center mb-12">
              Everything a feed reader should be
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <LayoutList className="h-5 w-5 text-accent" />,
                  title: "List & card layouts",
                  body: "Switch between a dense list view for scanning and a card view for visual browsing. Your preference, persisted.",
                },
                {
                  icon: <Tag className="h-5 w-5 text-accent" />,
                  title: "Category organization",
                  body: "Group feeds into categories like Frontend, Design, AI. See unread counts per category in the sidebar.",
                },
                {
                  icon: <Bookmark className="h-5 w-5 text-accent" />,
                  title: "Save for later",
                  body: "Bookmark any article with one click. Access your reading list anytime from the Saved section.",
                },
                {
                  icon: <Sparkles className="h-5 w-5 text-accent" />,
                  title: "AI-powered summaries",
                  body: "Get a 2-3 sentence summary of any article on demand. Powered by Claude — cached so you're never charged twice.",
                },
                {
                  icon: <WifiOff className="h-5 w-5 text-accent" />,
                  title: "Works offline",
                  body: "Recent articles are cached for offline reading. Mark items as read and bookmark — they sync when you're back online.",
                },
                {
                  icon: <Rss className="h-5 w-5 text-accent" />,
                  title: "RSS, Atom & RDF",
                  body: "Parses all major feed formats with real-world edge case handling. Add any feed URL and it just works.",
                },
              ].map(({ icon, title, body }) => (
                <div
                  key={title}
                  className="bg-surface rounded-xl border border-border p-6 space-y-3"
                >
                  <div className="h-9 w-9 rounded-lg bg-accent-subtle flex items-center justify-center">
                    {icon}
                  </div>
                  <h3 className="font-semibold text-text-primary">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[var(--container-page)] mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to declutter your reading?
          </h2>
          <p className="text-text-secondary mb-8 max-w-sm mx-auto">
            Start with the 19 curated tech feeds or bring your own. No email confirmation, no onboarding friction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent-hover transition-colors"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/guest/feed"
              className="text-sm text-accent hover:underline font-medium"
            >
              Or browse as guest →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6 px-6 text-center text-xs text-text-tertiary">
        Built with Next.js, Supabase, and the Claude API
      </footer>
    </div>
  );
}
