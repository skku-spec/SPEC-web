import { unstable_cache } from "next/cache";

import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { Partner } from "@/lib/actions/partners";

export const ACTIVE_PARTNERS_CACHE_TAG = "active-partners";

async function fetchActivePartners(): Promise<Partner[]> {
  try {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    return (data ?? []) as unknown as Partner[];
  } catch {
    return [];
  }
}

export const getCachedActivePartners = unstable_cache(
  fetchActivePartners,
  ["active-partners"],
  {
    revalidate: 300,
    tags: [ACTIVE_PARTNERS_CACHE_TAG],
  },
);
