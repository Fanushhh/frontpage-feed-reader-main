# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `AGENTS.md` for full AI collaboration context, spec locations, and guidance.

## What This Is

A **Frontend Mentor product challenge** — a full-stack RSS/Atom feed aggregator called Frontpage. Built with Next.js 16 (App Router) + Supabase (PostgreSQL + auth).

## Next.js 16 — Important Differences

- `src/middleware.ts` is **deprecated** — use `src/proxy.ts` instead; export a function named `proxy` (not `middleware`)
- Route handler params are now `Promise<{ id: string }>` — always `await params` before using
- `serverActions` must be listed under `experimental` in `next.config.ts`

## Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
```

## Architecture

**Tech stack:** Next.js 14 App Router · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL + auth) · TanStack Query · Zustand · fast-xml-parser · Anthropic Claude API · next-pwa

**Route groups:**
- `(auth)/` — sign-in, sign-up, forgot/reset-password (no shared layout chrome)
- `(app)/` — authenticated app shell with sidebar; feed, category, source, item, saved, search, settings, onboarding
- `guest/` — unauthenticated guest mode using session storage (no Supabase required)
- `api/` — all server-side logic: feed fetching/parsing, refresh, OPML, search, bookmarks, AI summarization

**Key library locations:**
- `src/lib/feed-parser/` — pure TS RSS/Atom/RDF parser; `parseFeedXml(xml, url)` is the main entry point (takes pre-fetched XML); use `fetchFeed(url)` from `fetch-feed.ts` first
- `src/lib/supabase/` — `client.ts` (browser), `server.ts` (server components + service role); proxy auth in `src/proxy.ts`
- `src/lib/guest/` — session storage helpers + seed loader for the 19 curated guest feeds
- `src/lib/ai/summarize.ts` — Claude API call with `item_summaries` cache check
- `src/lib/opml/` — OPML parse and generate
- `src/hooks/` — TanStack Query hooks (`useFeeds`, `useFeedItems`, `useCategories`, `useReadState`, etc.)
- `src/store/` — Zustand stores (`ui.ts` for layout/sidebar, `guest.ts` for guest session)

**Database:** See `supabase/migrations/` for schema. Tables: `categories`, `feeds`, `feed_items`, `read_items`, `bookmarks`, `user_preferences`, `item_summaries`. All tables have RLS enabled. API routes that write `feed_items` use the service role key.

**Guest mode:** Does not touch Supabase at all. `GET /api/guest/feeds` fetches all 19 curated feeds server-side, returns parsed JSON, stored in `sessionStorage` via `store/guest.ts`. `/guest/*` routes read exclusively from the Zustand guest store.

**Feed fetching:** Always server-side (CORS). `POST /api/parse-feed` validates a URL. `POST /api/feeds/[id]/refresh` fetches, parses, and upserts items using `ON CONFLICT (feed_id, guid) DO UPDATE`.

**Design system:** Source of truth is `guidance/brand-kit.md`. CSS custom properties in `starter/tokens.css` are imported in `src/app/globals.css`. Tailwind v4 config in `starter/tailwind.css`.

**Spec files:**
- `spec/core-requirements.md` — 12 core + 6 stretch features with acceptance criteria
- `spec/technical-requirements.md` — DB schema, auth, deployment, perf targets
- `spec/design-challenges.md` — 3 features the developer designs
- `data/sample-feeds.json` — 19 curated guest feeds (5 categories)

## Implementation Progress

### ✅ Done
- **Project bootstrap** — Next.js 16, Tailwind v4 with brand tokens, all dependencies installed
- **Database schema** — `supabase/migrations/0001_initial_schema.sql` (all tables, RLS, indexes, `get_unread_counts` RPC, auto-create preferences trigger)
- **Auth** — sign-in, sign-up, forgot/reset-password pages + forms; proxy-based route protection
- **Feed parser** — `src/lib/feed-parser/`: fetch, detect-format, parse-rss2/atom/rdf, normalize-item, parse-date, sanitize-html, extract-image
- **Feed management API** — `GET/POST /api/feeds`, `PATCH/DELETE /api/feeds/[id]`, `POST /api/feeds/[id]/refresh`, `POST /api/refresh-all`
- **Categories API** — `GET/POST /api/categories`, `PATCH/DELETE /api/categories/[id]`
- **Feed items hook** — cursor-based infinite query with read/bookmark state join
- **Read/unread** — `useMarkRead`, `useMarkAllRead` with optimistic updates; `POST/DELETE /api/read`
- **Bookmarks** — `useBookmarks`, `useToggleBookmark`; `GET/POST/DELETE /api/bookmarks`
- **Search** — `GET /api/search` (ilike trigram); search page with 300ms debounce
- **App shell** — `(app)/layout.tsx` with `Sidebar`, `MobileNav` (responsive)
- **Feed pages** — `/feed`, `/category/[id]`, `/source/[id]` with `FeedList` + list/card layouts + `FeedPageHeader`
- **Article reader** — `/item/[id]` with sanitized HTML, AI summary panel, marks-as-read on open
- **AI summarization** — `POST /api/summarize` with `item_summaries` cache and per-user rate limit (10/hr)
- **Guest mode store** — `store/guest.ts` (Zustand + sessionStorage), `lib/guest/seed.ts` (19 curated feeds)
- **Guest API** — `GET /api/guest/feeds` (parallel fetch of all 19 feeds, edge-cacheable)
- **OPML** — `lib/opml/parse.ts` + `generate.ts`; `POST /api/opml/import` (preview + confirm), `GET /api/opml/export`
- **Onboarding** — `/onboarding` page with category-based feed suggestions (all 19 feeds)
- **Settings/feeds** — `/settings/feeds` page: add feed, manage categories, feed list with health badges, refresh, delete, OPML export
- **Saved page** — `/saved` with bookmarks list
- **UI components** — Button, Input, Badge, Skeleton, Toast (with ToastProvider)
- **Build passing** — `npm run build` succeeds with zero errors
- **Feed parser entity limit** — `processEntities` in `src/lib/feed-parser/index.ts` set to `{ enabled: true, maxTotalExpansions: 50_000 }` (fast-xml-parser v5 default of 1000 was too low for feeds with many HTML-entity-encoded `<content:encoded>` blocks, e.g. joshwcomeau.com)
- **Feed add error handling** — `POST /api/feeds` wraps `fetchFeed`/`parseFeedXml` in try/catch, returns JSON 422 on failure (previously unhandled throws returned HTML 500, breaking client-side `res.json()`)
- **Service client import** — `createServiceClient()` in `src/lib/supabase/server.ts` uses ES module import instead of `require()`
- **Supabase deployed** — schema migrated, env vars configured (all 4 required); `SUPABASE_SERVICE_ROLE_KEY` is critical — without it the `feed_items` upsert fails silently and no articles appear

### 🔲 Still needed
- **PWA icons** — `public/icons/icon-192.png` and `icon-512.png` need to be generated (manifest exists at `public/manifest.json`)
- **Keyboard shortcut overlay** — `?` key should show a help modal listing all shortcuts
- **Keyboard j/k navigation** — select next/prev item in feed list, `o` to open, `m` to mark read
- **Feed items route handler** — `GET /api/feed-items` endpoint exists but the `useFeedItems` hook queries Supabase directly client-side (no route needed; keep as-is)
- **Image assets** — `public/favicon.svg` (placeholder needed)
- **Deploy** — Supabase project live, schema migrated, env vars set ✓; still needs Vercel deployment

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```
