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

  it("returns 'late' when submitted 30 minutes after due_date", () => {
    expect(classifySubmission("2026-04-10T09:30:00Z", "2026-04-10T09:00:00Z")).toBe("late");
  });

  it("returns 'late' when submitted exactly 1 hour after due_date", () => {
    expect(classifySubmission("2026-04-10T10:00:00Z", "2026-04-10T09:00:00Z")).toBe("late");
  });

  it("returns 'not-submitted' when submitted more than 1 hour after due_date", () => {
    expect(classifySubmission("2026-04-10T10:00:01Z", "2026-04-10T09:00:00Z")).toBe("not-submitted");
  });

  it("returns 'not-submitted' when submitted many hours after due_date", () => {
    expect(classifySubmission("2026-04-10T14:00:00Z", "2026-04-10T09:00:00Z")).toBe("not-submitted");
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
    // null due_date homeworks are each their own group
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 2, totalCount: 2, lateCount: 0, notSubmittedCount: 0,
    });
  });

  it("counts late submission (within 1 hour) correctly", () => {
    const homeworks = [{ id: "hw-1", due_date: "2026-04-10T09:00:00Z" }];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T09:45:00Z" },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 1, totalCount: 1, lateCount: 1, notSubmittedCount: 0,
    });
  });

  it("counts submission more than 1 hour late as completed (status-based) with no late label", () => {
    const homeworks = [{ id: "hw-1", due_date: "2026-04-10T09:00:00Z" }];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T14:00:00Z" },
    ];
    // >1hr late: still counts as completed (status=completed), just no 지각 label
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 1, totalCount: 1, lateCount: 0, notSubmittedCount: 0,
    });
  });

  it("counts not-submitted per individual homework", () => {
    const homeworks = [
      { id: "hw-1", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-2", due_date: "2026-04-10T09:00:00Z" },
    ];
    const submissions: { homework_id: string; user_id: string; status: string; submitted_at: string | null }[] = [];
    // 2 individual homeworks not submitted → notSubmittedCount: 2, totalCount: 2
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 0, totalCount: 2, lateCount: 0, notSubmittedCount: 2,
    });
  });

  it("counts partial submission correctly per individual homework", () => {
    const homeworks = [
      { id: "hw-1", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-2", due_date: "2026-04-10T09:00:00Z" },
    ];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T06:00:00Z" },
      // hw-2 missing
    ];
    // hw-1 done, hw-2 not → completedCount: 1, notSubmittedCount: 1
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 1, totalCount: 2, lateCount: 0, notSubmittedCount: 1,
    });
  });

  it("counts all homeworks in same due_date as individual completions", () => {
    const homeworks = [
      { id: "hw-1", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-2", due_date: "2026-04-10T09:00:00Z" },
    ];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T06:00:00Z" },
      { homework_id: "hw-2", user_id: userId, status: "completed", submitted_at: "2026-04-10T07:00:00Z" },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 2, totalCount: 2, lateCount: 0, notSubmittedCount: 0,
    });
  });

  it("handles multiple weeks with different due_dates independently", () => {
    const homeworks = [
      { id: "hw-1", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-2", due_date: "2026-04-10T09:00:00Z" },
      { id: "hw-3", due_date: "2026-04-17T09:00:00Z" },
    ];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: "2026-04-10T06:00:00Z" },
      { homework_id: "hw-2", user_id: userId, status: "completed", submitted_at: "2026-04-10T06:00:00Z" },
      // hw-3 missing
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 2, totalCount: 3, lateCount: 0, notSubmittedCount: 1,
    });
  });

  it("treats completed submissions without submitted_at as on-time", () => {
    const homeworks = [{ id: "hw-1", due_date: "2026-04-10T09:00:00Z" }];
    const submissions = [
      { homework_id: "hw-1", user_id: userId, status: "completed", submitted_at: null },
    ];
    expect(computeLearnerHomeworkStats(userId, homeworks, submissions)).toEqual({
      completedCount: 1, totalCount: 1, lateCount: 0, notSubmittedCount: 0,
    });
  });

  it("returns zeros when no homeworks exist", () => {
    expect(computeLearnerHomeworkStats(userId, [], [])).toEqual({
      completedCount: 0, totalCount: 0, lateCount: 0, notSubmittedCount: 0,
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

  it("counts section-based homework at weekly homework-level", () => {
    const homeworks = [{ id: "hw-1", due_date: "2026-04-10T09:00:00Z" }];
    const submissions: any[] = [];
    const sectionSubmissionsIncomplete = [
      { homework_id: "hw-1", user_id: userId, section_id: "sec-1", is_completed: true },
      { homework_id: "hw-1", user_id: userId, section_id: "sec-2", is_completed: false },
    ];
    const sectionSubmissionsComplete = [
      { homework_id: "hw-1", user_id: userId, section_id: "sec-1", is_completed: true },
      { homework_id: "hw-1", user_id: userId, section_id: "sec-2", is_completed: true },
    ];

    expect(computeLearnerHomeworkStats(userId, homeworks, submissions, sectionSubmissionsIncomplete)).toEqual({
      completedCount: 0, totalCount: 1, lateCount: 0, notSubmittedCount: 1,
    });

    expect(computeLearnerHomeworkStats(userId, homeworks, submissions, sectionSubmissionsComplete)).toEqual({
      completedCount: 1, totalCount: 1, lateCount: 0, notSubmittedCount: 0,
    });
  });
});
