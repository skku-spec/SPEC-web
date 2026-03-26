"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { isValidUUID } from "@/lib/validators";

export async function incrementViewCount(postId: string): Promise<void> {
  if (!isValidUUID(postId)) return;

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rl = rateLimit(`view:${postId}:${ip}`, {
    maxRequests: 1,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) return;

  const supabase = await createClient();
  await supabase.rpc("increment_post_view_count", { post_id: postId });
}
