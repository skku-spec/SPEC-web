import { createClient } from "@/lib/supabase/server";
import type { TimelineStep } from "@/lib/types/recruitment";

export async function getRecruitmentConfig(): Promise<{
  batch: {
    value: string;
    learnerLabel: string;
    shortLabel: string;
    bannerLabel: string;
    heroBadgeLabel: string;
    showBanner: boolean;
  };
  isOpen: boolean;
  status: string;
  timelineSteps: TimelineStep[];
} | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("recruitment_settings")
      .select("*")
      .neq("status", "closed")
      .limit(1)
      .single();

    if (!data) return null;

    return {
      batch: {
        value: data.batch,
        learnerLabel: data.batch_label,
        shortLabel: data.short_label,
        bannerLabel: data.banner_label,
        heroBadgeLabel: data.hero_badge,
        showBanner: data.show_banner,
      },
      isOpen: data.status === "recruiting",
      status: data.status,
      timelineSteps: (data.timeline_steps ?? []) as TimelineStep[],
    };
  } catch {
    return null;
  }
}

export async function isRecruitmentOpen(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("recruitment_settings")
      .select("status")
      .eq("status", "recruiting")
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}
