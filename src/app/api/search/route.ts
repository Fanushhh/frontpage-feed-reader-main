import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const { data: userFeeds } = await supabase.from("feeds").select("id").eq("user_id", user.id);
  const feedIds = (userFeeds || []).map((f: { id: string }) => f.id);
  if (!feedIds.length) return NextResponse.json([]);

  const like = `%${q}%`;
  const { data, error } = await supabase
    .from("feed_items")
    .select("id, title, description, url, published_at, image_url, feed_id, feed:feeds!feed_id(id,title,custom_title,favicon_url)")
    .in("feed_id", feedIds)
    .or(`title.ilike.${like},description.ilike.${like}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
