import { unstable_cache } from "next/cache";

import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { RecruitmentSettings } from "@/lib/types/recruitment";

export const ACTIVE_RECRUITMENT_CACHE_TAG = "active-recruitment";

async function fetchActiveRecruitment(): Promise<RecruitmentSettings | null> {
  try {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("recruitment_settings")
      .select("*")
      .neq("status", "closed")
      .limit(1)
      .maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}

export const getCachedActiveRecruitment = unstable_cache(
  fetchActiveRecruitment,
  ["active-recruitment"],
  {
    revalidate: 300,
    tags: [ACTIVE_RECRUITMENT_CACHE_TAG],
  },
);
