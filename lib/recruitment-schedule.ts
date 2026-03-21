export type TimelineStatus = "completed" | "active" | "upcoming";

type ScheduleDate = {
  year: number;
  month: number;
  day: number;
};

type RecruitmentScheduleDefinition = {
  title: string;
  date: string;
  highlight: boolean;
  start: ScheduleDate;
  end?: ScheduleDate;
};

export const RECRUITMENT_BATCH = {
  value: "4",
  learnerLabel: "SPEC 4기 러너 (추가 모집)",
  shortLabel: "SPEC 4기 추가 모집",
  bannerLabel: "SPEC 4기 러너 추가 모집 중",
  heroBadgeLabel: "2026 Spring · 4기 추가 모집",
  showBanner: false,
} as const;

export type RecruitmentTimelineStep = {
  title: string;
  date: string;
  highlight: boolean;
  status: TimelineStatus;
};

export const RECRUITMENT_SCHEDULE: RecruitmentScheduleDefinition[] = [
  {
    title: "1차 서류 접수",
    date: "3/13(금) ~ 3/16(월)",
    highlight: false,
    start: { year: 2026, month: 3, day: 13 },
    end: { year: 2026, month: 3, day: 16 },
  },
  {
    title: "서류 결과 발표",
    date: "3/17(화)",
    highlight: false,
    start: { year: 2026, month: 3, day: 17 },
  },
  {
    title: "2차 온라인 면접",
    date: "3/18(수) ~ 3/22(일)",
    highlight: false,
    start: { year: 2026, month: 3, day: 18 },
    end: { year: 2026, month: 3, day: 22 },
  },
  {
    title: "최종 결과 발표",
    date: "3/23(월)",
    highlight: false,
    start: { year: 2026, month: 3, day: 23 },
  },
  {
    title: "OT (필참)",
    date: "3/27(금)",
    highlight: true,
    start: { year: 2026, month: 3, day: 27 },
  },
];

export const RECRUITMENT_SCHEDULE_SUMMARY = RECRUITMENT_SCHEDULE.map(
  ({ title, date, highlight }) => ({ title, date, highlight }),
);

function getKstDateParts(referenceDate: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(referenceDate);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function toUtcDateKey(date: ScheduleDate) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function formatLongKoreanDate(date: ScheduleDate) {
  return `${date.year}년 ${date.month}월 ${date.day}일`;
}

function formatKoreanDateWithWeekday(date: ScheduleDate) {
  const weekdayMap = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdayMap[new Date(toUtcDateKey(date)).getUTCDay()];

  return `${date.month}월 ${date.day}일 (${weekday})`;
}

export const RECRUITMENT_APPLY_DEADLINE =
  RECRUITMENT_SCHEDULE[0]?.end ?? RECRUITMENT_SCHEDULE[0]?.start;

export const RECRUITMENT_DEADLINE_TEXT = formatLongKoreanDate(
  RECRUITMENT_APPLY_DEADLINE,
);

export const RECRUITMENT_DEADLINE_LABEL = `추가 모집 마감: ${RECRUITMENT_DEADLINE_TEXT}`;

const FINAL_RESULT_STEP = RECRUITMENT_SCHEDULE.find(
  (step) => step.title === "최종 결과 발표",
);

export const RECRUITMENT_RESULT_ANNOUNCEMENT_DATE = FINAL_RESULT_STEP
  ? formatKoreanDateWithWeekday(FINAL_RESULT_STEP.start)
  : "";

function getTimelineStatus(
  todayKey: number,
  start: ScheduleDate,
  end?: ScheduleDate,
): TimelineStatus {
  const startKey = toUtcDateKey(start);
  const endKey = toUtcDateKey(end ?? start);

  if (todayKey < startKey) {
    return "upcoming";
  }

  if (todayKey > endKey) {
    return "completed";
  }

  return "active";
}

export function getRecruitmentTimeline(
  referenceDate: Date = new Date(),
): RecruitmentTimelineStep[] {
  const today = getKstDateParts(referenceDate);
  const todayKey = toUtcDateKey(today);

  return RECRUITMENT_SCHEDULE.map((step) => ({
    title: step.title,
    date: step.date,
    highlight: step.highlight,
    status: getTimelineStatus(todayKey, step.start, step.end),
  }));
}

export function getRecruitmentApplyDdayLabel(referenceDate: Date = new Date()) {
  const today = getKstDateParts(referenceDate);
  const todayKey = toUtcDateKey(today);
  const deadlineKey = toUtcDateKey(RECRUITMENT_APPLY_DEADLINE);
  const diffDays = Math.floor((deadlineKey - todayKey) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `D-${diffDays}`;
  }

  if (diffDays === 0) {
    return "D-DAY";
  }

  return "마감";
}
