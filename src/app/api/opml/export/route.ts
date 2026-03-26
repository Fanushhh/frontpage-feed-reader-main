import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOPML } from "@/lib/opml/generate";
import type { Feed, Category } from "@/types/feed";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [feedsRes, catsRes] = await Promise.all([
    supabase.from("feeds").select("*").eq("user_id", user.id),
    supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order"),
  ]);

  const opml = generateOPML(feedsRes.data as Feed[] || [], catsRes.data as Category[] || []);

  return new NextResponse(opml, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="frontpage-feeds.opml"',
    },
  });
}
