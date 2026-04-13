export type SubmissionClassification = "on-time" | "late" | "not-submitted";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getEndOfKSTDay(date: Date): Date {
  const kstTime = new Date(date.getTime() + KST_OFFSET_MS);
  const endOfDayKST = new Date(Date.UTC(
    kstTime.getUTCFullYear(), kstTime.getUTCMonth(), kstTime.getUTCDate(),
    23, 59, 59, 999
  ));
  return new Date(endOfDayKST.getTime() - KST_OFFSET_MS);
}

export function classifySubmission(
  submittedAt: string | null,
  dueDate: string | null
): SubmissionClassification {
  if (!submittedAt) return "not-submitted";
  if (!dueDate) return "on-time";
  const submitted = new Date(submittedAt);
  const due = new Date(dueDate);
  if (submitted <= due) return "on-time";
  if (submitted <= getEndOfKSTDay(due)) return "late";
  return "not-submitted";
}

export function computeLearnerHomeworkStats(
  learnerId: string,
  homeworks: { id: string; due_date: string | null }[],
  submissions: { homework_id: string; user_id: string; status: string; submitted_at: string | null }[]
): { completedCount: number; totalCount: number; lateCount: number; notSubmittedCount: number } {
  let completedCount = 0;
  let lateCount = 0;
  let notSubmittedCount = 0;

  for (const hw of homeworks) {
    const sub = submissions.find(
      (s) => s.homework_id === hw.id && s.user_id === learnerId && s.status === "completed"
    );

    if (!sub) {
      notSubmittedCount++;
      continue;
    }

    if (!sub.submitted_at) {
      completedCount++;
      continue;
    }

    const classification = classifySubmission(sub.submitted_at, hw.due_date);
    if (classification === "on-time") {
      completedCount++;
    } else if (classification === "late") {
      completedCount++;
      lateCount++;
    } else {
      notSubmittedCount++;
    }
  }
  return { completedCount, totalCount: homeworks.length, lateCount, notSubmittedCount };
}
