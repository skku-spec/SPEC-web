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

export type SectionSubmission = {
  homework_id: string;
  user_id: string;
  section_id: string;
  is_completed: boolean;
};

export function computeLearnerHomeworkStats(
  learnerId: string,
  homeworks: { id: string; due_date: string | null; individual_content?: unknown; team_content?: unknown }[],
  submissions: { homework_id: string; user_id: string; status: string; submitted_at: string | null }[],
  sectionSubmissions?: SectionSubmission[]
): { completedCount: number; totalCount: number; lateCount: number; notSubmittedCount: number } {
  let completedCount = 0;
  let lateCount = 0;
  let notSubmittedCount = 0;

  for (const hw of homeworks) {
    const individualItems = Array.isArray(hw.individual_content) ? hw.individual_content : [];
    const teamItems = Array.isArray(hw.team_content) ? hw.team_content : [];
    const totalItems = Math.max(individualItems.length + teamItems.length, 1);

    const hwSections = sectionSubmissions?.filter(
      s => s.homework_id === hw.id && s.user_id === learnerId
    );

    if (hwSections && hwSections.length > 0) {
      const completedItems = hwSections.filter(s => s.is_completed).length;
      if (completedItems >= totalItems) {
        completedCount++;
      } else {
        notSubmittedCount++;
      }
    } else {
      const sub = submissions.find(
        s => s.homework_id === hw.id && s.user_id === learnerId && s.status === "completed"
      );
      if (!sub) {
        notSubmittedCount++;
      } else {
        completedCount++;
        if (sub.submitted_at && classifySubmission(sub.submitted_at, hw.due_date) === "late") {
          lateCount++;
        }
      }
    }
  }

  return { completedCount, totalCount: completedCount + notSubmittedCount, lateCount, notSubmittedCount };
}
