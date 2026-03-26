import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: feeds } = await supabase.from("feeds").select("id").eq("user_id", user.id);
  if (!feeds || feeds.length === 0) return NextResponse.json({ refreshed: 0 });

  // Fire off refreshes in parallel (best-effort)
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXTAUTH_URL || "http://localhost:3000" : "http://localhost:3000";
  const results = await Promise.allSettled(
    feeds.map((f) =>
      fetch(`${baseUrl}/api/feeds/${f.id}/refresh`, { method: "POST" })
    )
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ refreshed: succeeded, total: feeds.length });
}
