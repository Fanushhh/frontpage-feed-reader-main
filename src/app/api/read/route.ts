import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, feedId, categoryId, all } = await req.json();

  if (all || feedId || categoryId) {
    let feedIds: string[] = [];
    if (feedId) feedIds = [feedId];
    else if (categoryId) {
      const { data } = await supabase.from("feeds").select("id").eq("category_id", categoryId).eq("user_id", user.id);
      feedIds = (data || []).map((f: { id: string }) => f.id);
    } else {
      const { data } = await supabase.from("feeds").select("id").eq("user_id", user.id);
      feedIds = (data || []).map((f: { id: string }) => f.id);
    }
    if (feedIds.length) {
      const { data: items } = await supabase.from("feed_items").select("id").in("feed_id", feedIds);
      if (items?.length) {
        const rows = items.map((i: { id: string }) => ({ user_id: user.id, item_id: i.id }));
        await supabase.from("read_items").upsert(rows, { ignoreDuplicates: true });
      }
    }
    return NextResponse.json({ success: true });
  }

  if (itemId) {
    await supabase.from("read_items").upsert({ user_id: user.id, item_id: itemId }, { ignoreDuplicates: true });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "itemId, feedId, categoryId, or all required" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await req.json();
  await supabase.from("read_items").delete().eq("user_id", user.id).eq("item_id", itemId);
  return NextResponse.json({ success: true });
}
