import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { summarizeArticle } from "@/lib/ai/summarize";
import { stripHtml } from "@/lib/feed-parser/sanitize-html";

// Simple in-memory rate limit (per user, 10 req/hour)
const rateLimits = new Map<string, { count: number; reset: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.reset) {
    rateLimits.set(userId, { count: 1, reset: now + 3600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in an hour." }, { status: 429 });
  }

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  // Check cache first
  const { data: cached } = await serviceClient.from("item_summaries").select("summary").eq("item_id", itemId).single();
  if (cached) return NextResponse.json({ summary: cached.summary, cached: true });

  // Fetch item
  const { data: item, error } = await supabase
    .from("feed_items")
    .select("title, description, content_html, feed:feeds!feed_id(user_id)")
    .eq("id", itemId)
    .single();

  if (error || !item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Extract text content
  const content = item.content_html
    ? stripHtml(item.content_html)
    : item.description || "";

  if (!content.trim()) {
    return NextResponse.json({ error: "No content to summarize" }, { status: 422 });
  }

  const { summary, tokenCount } = await summarizeArticle(item.title, content);

  // Cache the summary
  await serviceClient.from("item_summaries").upsert({
    item_id: itemId,
    summary,
    model: "claude-haiku-4-5-20251001",
    token_count: tokenCount,
  });

  return NextResponse.json({ summary, cached: false });
}
