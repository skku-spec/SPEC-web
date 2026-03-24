import type { Database } from "@/lib/supabase/types";

export type RecruitmentStatus = "recruiting" | "reviewing" | "closed" | "upcoming";

export type RecruitmentSettings = Database["public"]["Tables"]["recruitment_settings"]["Row"];
export type RecruitmentSettingsInsert = Database["public"]["Tables"]["recruitment_settings"]["Insert"];
export type RecruitmentSettingsUpdate = Database["public"]["Tables"]["recruitment_settings"]["Update"];

export type WaitlistEntry = Database["public"]["Tables"]["recruitment_waitlist"]["Row"];

export type TimelineStep = {
  title: string;
  date: string;
  highlight?: boolean;
  start: { year: number; month: number; day: number };
  end?: { year: number; month: number; day: number };
};

const VALID_STATUSES: RecruitmentStatus[] = ["recruiting", "reviewing", "closed", "upcoming"];

export function isValidRecruitmentStatus(value: string): value is RecruitmentStatus {
  return VALID_STATUSES.includes(value as RecruitmentStatus);
}

const PHONE_REGEX = /^01[016789]\d{7,8}$/;

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "전화번호를 입력해주세요.";
  if (!PHONE_REGEX.test(digits)) return "올바른 전화번호 형식을 입력해주세요.";
  return null;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export function validateTimelineStep(step: unknown): step is TimelineStep {
  if (!step || typeof step !== "object") return false;
  const s = step as Record<string, unknown>;
  if (typeof s.title !== "string" || !s.title.trim()) return false;
  if (typeof s.date !== "string" || !s.date.trim()) return false;
  if (!s.start || typeof s.start !== "object") return false;
  const start = s.start as Record<string, unknown>;
  if (typeof start.year !== "number" || typeof start.month !== "number" || typeof start.day !== "number") return false;
  if (s.end !== undefined && s.end !== null) {
    if (typeof s.end !== "object") return false;
    const end = s.end as Record<string, unknown>;
    if (typeof end.year !== "number" || typeof end.month !== "number" || typeof end.day !== "number") return false;
  }
  return true;
}

export function validateTimelineSteps(steps: unknown): steps is TimelineStep[] {
  if (!Array.isArray(steps)) return false;
  return steps.every(validateTimelineStep);
}

export function validateRecruitmentInput(data: {
  batch?: string;
  batch_label?: string;
  short_label?: string;
  status?: string;
  timeline_steps?: unknown;
}): string | null {
  if (data.batch !== undefined && (!data.batch.trim() || data.batch.length > 10)) {
    return "기수 번호를 올바르게 입력해주세요.";
  }
  if (data.batch_label !== undefined && (!data.batch_label.trim() || data.batch_label.length > 100)) {
    return "기수 라벨을 올바르게 입력해주세요.";
  }
  if (data.short_label !== undefined && (!data.short_label.trim() || data.short_label.length > 100)) {
    return "짧은 라벨을 올바르게 입력해주세요.";
  }
  if (data.status !== undefined && !isValidRecruitmentStatus(data.status)) {
    return "유효하지 않은 상태입니다.";
  }
  if (data.timeline_steps !== undefined && !validateTimelineSteps(data.timeline_steps)) {
    return "일정 데이터가 올바르지 않습니다.";
  }
  return null;
}

export const STATUS_LABELS: Record<RecruitmentStatus, string> = {
  recruiting: "모집 중",
  reviewing: "심사 중",
  closed: "모집 마감",
  upcoming: "모집 예정",
};

export const STATUS_BADGE_STYLES: Record<RecruitmentStatus, string> = {
  recruiting: "bg-[#FF6C0F] text-white",
  reviewing: "bg-[#2563EB] text-white",
  closed: "bg-[#16140f] text-white",
  upcoming: "bg-[#FF6C0F] text-white",
};
