import { describe, expect, it, vi, afterEach } from "vitest";

import { formatRelativeTime } from "@/lib/utils/relativeTime";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setNow(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  it("returns '방금 전' for times less than 1 minute ago", () => {
    setNow("2026-03-25T12:00:00Z");
    expect(formatRelativeTime("2026-03-25T11:59:30Z")).toBe("방금 전");
  });

  it("returns '방금 전' for future dates", () => {
    setNow("2026-03-25T12:00:00Z");
    expect(formatRelativeTime("2026-03-25T12:01:00Z")).toBe("방금 전");
  });

  it("returns minutes for times 1-59 minutes ago", () => {
    setNow("2026-03-25T12:00:00Z");
    expect(formatRelativeTime("2026-03-25T11:55:00Z")).toBe("5분 전");
    expect(formatRelativeTime("2026-03-25T11:01:00Z")).toBe("59분 전");
  });

  it("returns hours for times 1-23 hours ago", () => {
    setNow("2026-03-25T12:00:00Z");
    expect(formatRelativeTime("2026-03-25T10:00:00Z")).toBe("약 2시간 전");
    expect(formatRelativeTime("2026-03-24T13:00:00Z")).toBe("약 23시간 전");
  });

  it("returns days for times 1-6 days ago", () => {
    setNow("2026-03-25T12:00:00Z");
    expect(formatRelativeTime("2026-03-24T12:00:00Z")).toBe("1일 전");
    expect(formatRelativeTime("2026-03-19T12:00:00Z")).toBe("6일 전");
  });

  it("returns weeks for times 1-3 weeks ago", () => {
    setNow("2026-03-25T12:00:00Z");
    expect(formatRelativeTime("2026-03-18T12:00:00Z")).toBe("1주 전");
    expect(formatRelativeTime("2026-03-04T12:00:00Z")).toBe("3주 전");
  });

  it("returns absolute date for times more than 4 weeks ago", () => {
    setNow("2026-03-25T12:00:00Z");
    expect(formatRelativeTime("2026-02-01T12:00:00Z")).toBe("2월 1일");
    expect(formatRelativeTime("2025-12-25T12:00:00Z")).toBe("12월 25일");
  });
});
