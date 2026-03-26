import type { Category, Feed, FeedItem } from "@/types/feed";

export interface GuestSeedCategory {
  name: string;
  feeds: Array<{
    title: string;
    feedUrl: string;
    siteUrl: string;
    description: string;
  }>;
}

/** The 19 curated feeds as static guest seed data */
export const GUEST_CATEGORIES: GuestSeedCategory[] = [
  {
    name: "Frontend",
    feeds: [
      { title: "CSS-Tricks", feedUrl: "https://css-tricks.com/feed/", siteUrl: "https://css-tricks.com/", description: "Tips, Tricks, and Techniques on using Cascading Style Sheets." },
      { title: "Smashing Magazine", feedUrl: "https://www.smashingmagazine.com/feed/", siteUrl: "https://www.smashingmagazine.com/", description: "For web designers and developers." },
      { title: "Josh W. Comeau", feedUrl: "https://www.joshwcomeau.com/rss.xml", siteUrl: "https://www.joshwcomeau.com/", description: "Friendly tutorials for developers." },
      { title: "Kent C. Dodds", feedUrl: "https://kentcdodds.com/blog/rss.xml", siteUrl: "https://kentcdodds.com/", description: "Helping people make the world a better place through quality software." },
      { title: "web.dev", feedUrl: "https://web.dev/feed.xml", siteUrl: "https://web.dev/", description: "Building a better web, together." },
      { title: "MDN Blog", feedUrl: "https://developer.mozilla.org/en-US/blog/rss.xml", siteUrl: "https://developer.mozilla.org/en-US/blog/", description: "The MDN Web Docs blog." },
    ],
  },
  {
    name: "Design",
    feeds: [
      { title: "Sidebar.io", feedUrl: "https://sidebar.io/feed.xml", siteUrl: "https://sidebar.io/", description: "The five best design links, every day." },
      { title: "Nielsen Norman Group", feedUrl: "https://www.nngroup.com/feed/rss/", siteUrl: "https://www.nngroup.com/", description: "Evidence-based user experience research, training, and consulting." },
      { title: "Figma Blog", feedUrl: "https://www.figma.com/blog/feed/", siteUrl: "https://www.figma.com/blog/", description: "Stories about how products are designed at Figma and beyond." },
      { title: "A List Apart", feedUrl: "https://alistapart.com/main/feed/", siteUrl: "https://alistapart.com/", description: "For people who make websites." },
      { title: "UX Collective", feedUrl: "https://uxdesign.cc/feed", siteUrl: "https://uxdesign.cc/", description: "Curated stories on user experience, usability, and product design." },
    ],
  },
  {
    name: "Backend & DevOps",
    feeds: [
      { title: "Cloudflare Blog", feedUrl: "https://blog.cloudflare.com/rss/", siteUrl: "https://blog.cloudflare.com/", description: "The Cloudflare Blog." },
      { title: "Vercel Blog", feedUrl: "https://vercel.com/atom", siteUrl: "https://vercel.com/blog", description: "Updates from Vercel." },
      { title: "The GitHub Blog", feedUrl: "https://github.blog/feed/", siteUrl: "https://github.blog/", description: "Updates, ideas, and inspiration from GitHub." },
      { title: "Netlify Blog", feedUrl: "https://www.netlify.com/blog/index.xml", siteUrl: "https://www.netlify.com/blog/", description: "News and posts from Netlify." },
    ],
  },
  {
    name: "General Tech",
    feeds: [
      { title: "The Pragmatic Engineer", feedUrl: "https://blog.pragmaticengineer.com/rss/", siteUrl: "https://blog.pragmaticengineer.com/", description: "Observations across the software engineering industry." },
      { title: "Hacker News Best", feedUrl: "https://hnrss.org/best", siteUrl: "https://news.ycombinator.com/", description: "Best stories on Hacker News." },
    ],
  },
  {
    name: "AI & ML",
    feeds: [
      { title: "Simon Willison's Weblog", feedUrl: "https://simonwillison.net/atom/everything/", siteUrl: "https://simonwillison.net/", description: "Simon Willison's weblog, covering AI, Python, and web development." },
      { title: "Hugging Face Blog", feedUrl: "https://huggingface.co/blog/feed.xml", siteUrl: "https://huggingface.co/blog", description: "The latest news from Hugging Face." },
    ],
  },
];

/** Build static Category and Feed objects from seed data (no DB, no network) */
export function buildGuestStructure(): { categories: Category[]; feeds: Feed[] } {
  const categories: Category[] = [];
  const feeds: Feed[] = [];
  const now = new Date().toISOString();

  for (let ci = 0; ci < GUEST_CATEGORIES.length; ci++) {
    const cat = GUEST_CATEGORIES[ci];
    const catId = `guest-cat-${ci}`;
    categories.push({
      id: catId,
      user_id: "guest",
      name: cat.name,
      sort_order: ci,
      created_at: now,
      updated_at: now,
    });

    for (let fi = 0; fi < cat.feeds.length; fi++) {
      const f = cat.feeds[fi];
      const feedId = `guest-feed-${ci}-${fi}`;
      feeds.push({
        id: feedId,
        user_id: "guest",
        category_id: catId,
        feed_url: f.feedUrl,
        site_url: f.siteUrl,
        title: f.title,
        custom_title: null,
        description: f.description,
        favicon_url: `https://www.google.com/s2/favicons?domain=${new URL(f.siteUrl).hostname}&sz=32`,
        format: null,
        status: "active",
        last_fetched_at: null,
        last_error: null,
        error_count: 0,
        etag: null,
        last_modified: null,
        effective_url: null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return { categories, feeds };
}

/** Map API-returned items to FeedItem format for guest store */
export function mapItemsToFeedItems(
  apiItems: Array<{
    feedId: string;
    guid: string;
    url: string | null;
    title: string;
    description: string | null;
    content_html: string | null;
    author: string | null;
    image_url: string | null;
    published_at: string | null;
  }>
): FeedItem[] {
  const now = new Date().toISOString();
  return apiItems.map((item, idx) => ({
    id: `guest-item-${item.feedId}-${idx}`,
    feed_id: item.feedId,
    guid: item.guid,
    url: item.url,
    title: item.title,
    description: item.description,
    content_html: item.content_html,
    author: item.author,
    image_url: item.image_url,
    published_at: item.published_at,
    fetched_at: now,
    created_at: now,
  }));
}
