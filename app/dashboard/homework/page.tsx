import type { Metadata } from "next";
import { getTrackerData } from "@/lib/actions/tracker";
import { LearnerHomeworkClient } from "@/components/dashboard/LearnerHomeworkClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "과제 제출 | SPEC",
};

export default async function LearnerHomeworkPage() {
  const result = await getTrackerData();
  
  if (!result.success) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-[#ddd9cc] bg-white text-sm text-[#b42318]">
        {result.error}
      </div>
    );
  }

  const { homeworks, submissions, learners } = result.data;
  const currentLearner = learners[0]; // Since getTrackerData filters by current user ID for non-admins

  return (
    <section className="space-y-8 pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <LearnerHomeworkClient 
          homeworks={homeworks}
          submissions={submissions}
          currentUserName={currentLearner?.name || ""}
          currentUserUsername={currentLearner?.username || ""}
        />
      </div>
    </section>
  );
}
