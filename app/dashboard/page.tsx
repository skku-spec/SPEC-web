import type { Metadata } from "next";
import { getTrackerData } from "@/lib/actions/tracker";
import { LearnerDashboardClient } from "@/components/dashboard/LearnerDashboardClient";

export const metadata: Metadata = {
  title: "대시보드 | SPEC",
};

export default async function LearnerDashboardPage() {
  const result = await getTrackerData();
  
  if (!result.success) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-[#ddd9cc] bg-white text-sm text-[#b42318]">
        {result.error}
      </div>
    );
  }

  const { learners, sessions, homeworks, logs, submissions } = result.data;

  // For learners, there's only 1 learner in the list (themselves)
  const currentLearner = learners[0];

  if (!currentLearner) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-[#ddd9cc] bg-white text-sm text-[#6b6b5e]">
        사용자 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <section className="space-y-8 pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <LearnerDashboardClient 
          learner={currentLearner} 
          sessions={sessions} 
          logs={logs} 
          homeworks={homeworks}
          submissions={submissions}
        />
      </div>
    </section>
  );
}
