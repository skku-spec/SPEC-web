import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
