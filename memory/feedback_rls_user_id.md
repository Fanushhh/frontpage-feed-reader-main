---
name: Always include user_id in Supabase client-side inserts
description: RLS policies require user_id on insert; omitting it causes 403 Forbidden
type: feedback
---

Always include `user_id: user.id` when inserting into tables with RLS policies from client-side hooks. Fetch the user first with `supabase.auth.getUser()`.

**Why:** The `categories` table (and others) have `for all using (auth.uid() = user_id)` RLS policies. Inserting without `user_id` causes a 403 Forbidden from Supabase because the with-check clause fails on null.

**How to apply:** In any client-side mutation that inserts into a user-owned table, always do `const { data: { user } } = await supabase.auth.getUser()` first and include `user_id: user.id` in the insert payload.
