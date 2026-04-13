import { describe, it, expect } from "vitest";
import {
  classifySubmission,
  computeLearnerHomeworkStats,
} from "@/lib/homework-utils";

describe("classifySubmission", () => {
  it("returns 'on-time' when submitted before due_date", () => {
    expect(classifySubmission("2026-04-10T06:00:00Z", "2026-04-10T09:00:00Z")).toBe("on-time");
  });

  it("returns 'on-time' when submitted exactly at due_date", () => {
    expect(classifySubmission("2026-04-10T09:00:00Z", "2026-04-10T09:00:00Z")).toBe("on-time");
  });

  it("returns 'late' when submitted after due_date but within same KST day 23:59:59", () => {
    expect(classifySubmission("2026-04-10T14:00:00Z", "2026-04-10T09:00:00Z")).toBe("late");
  });

  it("returns 'late' at 23:59:59 KST of due_date day", () => {
    expect(classifySubmission("2026-04-10T14:59:59Z", "2026-04-10T09:00:00Z")).toBe("late");
  });

  it("returns 'not-submitted' when submitted after due_date day ends (next KST day)", () => {
    expect(classifySubmission("2026-04-10T15:00:01Z", "2026-04-10T09:00:00Z")).toBe("not-submitted");
  });

  it("returns 'not-submitted' when submittedAt is null", () => {
    expect(classifySubmission(null, "2026-04-10T09:00:00Z")).toBe("not-submitted");
  });

  it("returns 'on-time' when dueDate is null and submission exists", () => {
    expect(classifySubmission("2026-04-10T09:00:00Z", null)).toBe("on-time");
  });

  it("returns 'not-submitted' when both are null", () => {
    expect(classifySubmission(null, null)).toBe("not-submitted");
  });

  it("handles due_date at midnight KST boundary", () => {
    expect(classifySubmission("2026-04-10T14:59:00Z", "2026-04-09T15:00:00Z")).toBe("late");
    expect(classifySubmission("2026-04-10T15:00:01Z", "2026-04-09T15:00:00Z")).toBe("not-submitted");
  });

  it("returns 'on-time' for early submission (days before due)", () => {
    expect(classifySubmission("2026-04-05T09:00:00Z", "2026-04-10T09:00:00Z")).toBe("on-time");
  });
});

describe("computeLearnerHomeworkStats", () => {
  const userId = "user-1";

  it("counts all completed homeworks as on-time when no due_date", () => {
    const homeworks = [{ id: "hw-1", due_date: null }, { id: "hw-2", due_date: null }];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T09:00:00Z" },
      { homework_id: "hw-2", user_id: userId, status: "completed", submitted_at: "2026-04-10T09:00:00Z" },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 2, totalCount: 2, lateCount: 0, notSubmittedCount: 0,
    });
  });

  it("counts late submissions correctly", () => {
    const homeworks = [{ id: "hw-1", due_date: "2026-04-10T09:00:00Z" }];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T14:00:00Z" },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 1, totalCount: 1, lateCount: 1, notSubmittedCount: 0,
    });
  });

  it("counts not-submitted when no submission exists", () => {
    const homeworks = [
      { id: "hw-1", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-2", due_date: "2026-04-10T09:00:00Z" },
    ];
    const submissions: { homework_id: string; user_id: string; status: string; submitted_at: string | null }[] = [];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 0, totalCount: 2, lateCount: 0, notSubmittedCount: 2,
    });
  });

  it("returns zeros when no homeworks exist", () => {
    expect(computeLearnerHomeworkStats(userId, [], [])).toEqual({
      completedCount: 0, totalCount: 0, lateCount: 0, notSubmittedCount: 0,
    });
  });

  it("handles mixed on-time, late, and missing submissions", () => {
    const homeworks = [
      { id: "hw-1", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-2", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-3", due_date: "2026-04-10T09:00:00Z" },
    ];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T06:00:00Z" },
      { homework_id: "hw-2", user_id: userId, status: "completed", submitted_at: "2026-04-10T14:00:00Z" },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 2, totalCount: 3, lateCount: 1, notSubmittedCount: 1,
    });
  });

  it("ignores submissions from other users", () => {
    const homeworks = [{ id: "hw-1", due_date: "2026-04-10T09:00:00Z" }];
    const submissions = [
      { homework_id: "hw-1", user_id: "other-user", status: "completed", submitted_at: "2026-04-10T06:00:00Z" },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 0, totalCount: 1, lateCount: 0, notSubmittedCount: 1,
    });
  });

  it("ignores non-completed submissions", () => {
    const homeworks = [{ id: "hw-1", due_date: "2026-04-10T09:00:00Z" }];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "pending", submitted_at: null },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 0, totalCount: 1, lateCount: 0, notSubmittedCount: 1,
    });
  });
});
