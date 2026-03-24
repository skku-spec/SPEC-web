import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { validateTimelineSteps } from "@/lib/types/recruitment";

type ScheduleDate = {
  year: number;
  month: number;
  day: number;
};

function toUtcDateKey(date: ScheduleDate) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function getKstTodayKey(referenceDate: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(referenceDate);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Date.UTC(year, month - 1, day);
}

function getDdayLabel(timelineSteps: unknown) {
  if (!validateTimelineSteps(timelineSteps) || timelineSteps.length === 0) {
    return "마감";
  }

  const deadline = timelineSteps.reduce<ScheduleDate | null>((latest, step) => {
    const current = step.end ?? step.start;
    if (!latest) return current;
    return toUtcDateKey(current) > toUtcDateKey(latest) ? current : latest;
  }, null);

  if (!deadline) {
    return "마감";
  }

  const todayKey = getKstTodayKey();
  const deadlineKey = toUtcDateKey(deadline);
  const diffDays = Math.floor((deadlineKey - todayKey) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `D-${diffDays}`;
  }

  if (diffDays === 0) {
    return "D-DAY";
  }

  return "마감";
}

export default async function RecruitmentBanner() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("recruitment_settings")
      .select("*")
      .neq("status", "closed")
      .limit(1)
      .maybeSingle();

    if (!data || data.show_banner === false) {
      return null;
    }

    if (data.status === "recruiting") {
      const ddayLabel = getDdayLabel(data.timeline_steps);

      return (
        <div className="bg-[#FF6C0F] px-4 py-2.5 text-center">
          <Link
            href="/apply"
            className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-sm font-normal text-white transition-opacity hover:opacity-80"
          >
            {data.banner_label} — 지원 마감 {ddayLabel}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      );
    }

    if (data.status === "reviewing") {
      return (
        <div className="bg-[#16140f] px-4 py-2.5 text-center">
          <p className="font-['Pretendard',sans-serif] text-sm font-normal text-white/80">
            심사가 진행 중입니다
          </p>
        </div>
      );
    }

    if (data.status === "upcoming") {
      return (
        <div className="bg-[#FF6C0F] px-4 py-2.5 text-center">
          <p className="font-['Pretendard',sans-serif] text-sm font-normal text-white transition-opacity hover:opacity-80">
            다음 모집이 준비 중입니다
          </p>
        </div>
      );
    }

    return null;
  } catch {
    return null;
  }
}
