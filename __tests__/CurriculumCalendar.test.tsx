import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CurriculumCalendar from "@/components/curriculum/CurriculumCalendar";
import type { CalendarEvent } from "@/lib/utils/curriculum-dates";

function makeEvent(
  dateStr: string,
  weekLabel: string,
  topic: string,
  endDateStr?: string,
): CalendarEvent {
  const [y, m, d] = dateStr.split("-").map(Number);
  const event: CalendarEvent = {
    date: new Date(y, m - 1, d),
    label: weekLabel,
    topic,
    weekLabel,
  };
  if (endDateStr) {
    const [ey, em, ed] = endDateStr.split("-").map(Number);
    event.endDate = new Date(ey, em - 1, ed);
  }
  return event;
}

const MARCH_EVENTS: CalendarEvent[] = [
  makeEvent("2026-03-27", "W1", "Kickoff"),
  makeEvent("2026-03-28", "W1", "SPEC Philosophy"),
];

const JUNE_EVENTS: CalendarEvent[] = [
  makeEvent("2026-06-06", "EVENT", "Ideathon", "2026-06-07"),
];

describe("CurriculumCalendar", () => {
  it("renders 7 day-of-week headers", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    const headers = screen.getAllByTestId("day-header");
    expect(headers).toHaveLength(7);
    expect(headers.map((h) => h.textContent)).toEqual([
      "일", "월", "화", "수", "목", "금", "토",
    ]);
  });

  it("initialises to first event month", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    expect(screen.getByTestId("calendar-month-title")).toHaveTextContent(
      "2026년 3월",
    );
  });

  it("shows events on correct dates", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    const cell27 = screen.getByTestId("day-cell-27");
    expect(cell27).toBeDefined();
    const pills = screen.getAllByTestId("event-pill");
    expect(pills.length).toBeGreaterThanOrEqual(1);
    expect(pills[0]).toHaveTextContent("W1");
  });

  it("navigates to next month", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    const nextBtn = screen.getByLabelText("다음 달");
    fireEvent.click(nextBtn);
    expect(screen.getByTestId("calendar-month-title")).toHaveTextContent(
      "2026년 4월",
    );
  });

  it("navigates to previous month", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    const prevBtn = screen.getByLabelText("이전 달");
    fireEvent.click(prevBtn);
    expect(screen.getByTestId("calendar-month-title")).toHaveTextContent(
      "2026년 2월",
    );
  });

  it("shows empty message for months without events", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    fireEvent.click(screen.getByLabelText("다음 달"));
    expect(screen.getByTestId("empty-month")).toHaveTextContent(
      "이 달에는 일정이 없습니다",
    );
  });

  it("expands event detail on pill click", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    const pill = screen.getAllByTestId("event-pill")[0];
    fireEvent.click(pill);
    expect(screen.getByTestId("event-detail")).toHaveTextContent("Kickoff");
  });

  it("collapses event detail on second pill click", () => {
    render(<CurriculumCalendar events={MARCH_EVENTS} />);
    const pill = screen.getAllByTestId("event-pill")[0];
    fireEvent.click(pill);
    expect(screen.getByTestId("event-detail")).toBeDefined();
    fireEvent.click(pill);
    expect(screen.queryByTestId("event-detail")).toBeNull();
  });

  it("shows range indicator for multi-day events", () => {
    render(<CurriculumCalendar events={JUNE_EVENTS} />);
    const pill = screen.getByTestId("event-pill");
    expect(pill).toHaveTextContent("EVENT");
    expect(pill.textContent).toContain("6/6");
  });

  it("renders with empty events array", () => {
    render(<CurriculumCalendar events={[]} />);
    expect(screen.getByTestId("curriculum-calendar")).toBeDefined();
    expect(screen.getByTestId("empty-month")).toHaveTextContent(
      "이 달에는 일정이 없습니다",
    );
  });
});
