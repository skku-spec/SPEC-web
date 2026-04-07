export type CalendarEvent = {
  date: Date;
  endDate?: Date;
  label: string;
  topic: string;
  weekLabel: string;
};

export function formatCurriculumDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export function formatCurriculumDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  if (!startDate) return "—";
  const start = formatCurriculumDate(startDate);
  if (!endDate) return start;
  const [, sm] = startDate.split("-").map(Number);
  const [, em, ed] = endDate.split("-").map(Number);
  if (sm === em) return `${start} ~ ${ed}일`;
  return `${start} ~ ${em}월 ${ed}일`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function parseCurriculumDatesForCalendar(weeks: Array<{
  start_date: string | null;
  end_date: string | null;
  week_label: string;
  topic: string;
}>): CalendarEvent[] {
  return weeks
    .filter((w) => w.start_date !== null)
    .map((w) => ({
      date: parseLocalDate(w.start_date!),
      endDate: w.end_date ? parseLocalDate(w.end_date) : undefined,
      label: w.week_label,
      topic: w.topic,
      weekLabel: w.week_label,
    }));
}
