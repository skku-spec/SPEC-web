export type SubmissionClassification = "on-time" | "late" | "not-submitted";

const ONE_HOUR_MS = 60 * 60 * 1000;

export function classifySubmission(
  submittedAt: string | null,
  dueDate: string | null
): SubmissionClassification {
  if (!submittedAt) return "not-submitted";
  if (!dueDate) return "on-time";
  const submitted = new Date(submittedAt);
  const due = new Date(dueDate);
  if (submitted <= due) return "on-time";
  if (submitted <= new Date(due.getTime() + ONE_HOUR_MS)) return "late";
  return "not-submitted";
}

export type HomeworkGroup = {
  dueDate: string | null;
  homeworkIds: string[];
};

export function groupHomeworksByDueDate(
  homeworks: { id: string; due_date: string | null }[]
): HomeworkGroup[] {
  const groups: HomeworkGroup[] = [];
  const dateMap = new Map<string, HomeworkGroup>();

  for (const hw of homeworks) {
    if (hw.due_date === null) {
      groups.push({ dueDate: null, homeworkIds: [hw.id] });
    } else {
      if (!dateMap.has(hw.due_date)) {
        const group: HomeworkGroup = { dueDate: hw.due_date, homeworkIds: [] };
        dateMap.set(hw.due_date, group);
        groups.push(group);
      }
      dateMap.get(hw.due_date)!.homeworkIds.push(hw.id);
    }
  }

  return groups;
}

export function computeLearnerHomeworkStats(
  learnerId: string,
  homeworks: { id: string; due_date: string | null }[],
  submissions: { homework_id: string; user_id: string; status: string; submitted_at: string | null }[]
): { completedCount: number; totalCount: number; lateCount: number; notSubmittedCount: number } {
  const groups = groupHomeworksByDueDate(homeworks);
  let completedCount = 0;
  let lateCount = 0;
  let notSubmittedCount = 0;

  for (const group of groups) {
    const groupSubs = group.homeworkIds.map(hwId =>
      submissions.find(s => s.homework_id === hwId && s.user_id === learnerId && s.status === "completed")
    );

    // AND condition: every homework in the group must have status=completed
    if (!groupSubs.every(sub => sub !== undefined)) {
      notSubmittedCount++;
      continue;
    }

    // All submitted — check if any has submitted_at within the 1hr late window
    let groupIsLate = false;
    for (let i = 0; i < group.homeworkIds.length; i++) {
      const hw = homeworks.find(h => h.id === group.homeworkIds[i])!;
      const sub = groupSubs[i]!;
      if (!sub.submitted_at) continue;
      if (classifySubmission(sub.submitted_at, hw.due_date) === "late") {
        groupIsLate = true;
        break;
      }
    }

    completedCount++;
    if (groupIsLate) lateCount++;
  }

  return { completedCount, totalCount: groups.length, lateCount, notSubmittedCount };
}
