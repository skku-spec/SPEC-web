import { describe, it, expect } from "vitest";
import {
  formatCurriculumDate,
  formatCurriculumDateRange,
  parseCurriculumDatesForCalendar,
} from "@/lib/utils/curriculum-dates";

describe("formatCurriculumDate", () => {
  it("returns em dash for null", () => {
    expect(formatCurriculumDate(null)).toBe("—");
  });
  it("returns em dash for undefined", () => {
    expect(formatCurriculumDate(undefined)).toBe("—");
  });
  it("formats single date correctly", () => {
    expect(formatCurriculumDate("2026-03-27")).toBe("3월 27일");
  });
  it("formats December date correctly", () => {
    expect(formatCurriculumDate("2026-12-25")).toBe("12월 25일");
  });
});

describe("formatCurriculumDateRange", () => {
  it("returns em dash for null start", () => {
    expect(formatCurriculumDateRange(null, null)).toBe("—");
  });
  it("returns single date when no end date", () => {
    expect(formatCurriculumDateRange("2026-03-27", null)).toBe("3월 27일");
  });
  it("formats same-month range", () => {
    expect(formatCurriculumDateRange("2026-06-06", "2026-06-07")).toBe("6월 6일 ~ 7일");
  });
  it("formats cross-month range", () => {
    expect(formatCurriculumDateRange("2026-06-30", "2026-07-01")).toBe("6월 30일 ~ 7월 1일");
  });
});

describe("parseCurriculumDatesForCalendar", () => {
  it("returns empty array for empty input", () => {
    expect(parseCurriculumDatesForCalendar([])).toEqual([]);
  });
  it("filters out rows with null start_date", () => {
    const result = parseCurriculumDatesForCalendar([
      { start_date: null, end_date: null, week_label: "OFF", topic: "시험 기간" },
    ]);
    expect(result).toEqual([]);
  });
  it("maps valid row to CalendarEvent", () => {
    const result = parseCurriculumDatesForCalendar([
      { start_date: "2026-03-27", end_date: null, week_label: "W1 - Kickoff", topic: "SPEC 철학" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].date.getFullYear()).toBe(2026);
    expect(result[0].date.getMonth()).toBe(2);
    expect(result[0].date.getDate()).toBe(27);
    expect(result[0].endDate).toBeUndefined();
    expect(result[0].weekLabel).toBe("W1 - Kickoff");
  });
  it("maps date range correctly", () => {
    const result = parseCurriculumDatesForCalendar([
      { start_date: "2026-06-06", end_date: "2026-06-07", week_label: "EVENT", topic: "아이디어톤" },
    ]);
    expect(result[0].endDate).toBeDefined();
    expect(result[0].endDate!.getDate()).toBe(7);
  });
});
