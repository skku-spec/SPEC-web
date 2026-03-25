"use server";

import { createClient } from "@/lib/supabase/server";

export async function incrementViewCount(postId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_post_view_count", { post_id: postId });
}
