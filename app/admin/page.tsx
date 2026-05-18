import type { Metadata } from "next";
import { getTrackerData } from "@/lib/actions/tracker";
import { getApplicationStats } from "@/lib/actions/export";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "대시보드 | SPEC Admin",
};

export default async function AdminDashboardPage() {
  const [trackerResult, statsResult] = await Promise.all([
    getTrackerData(),
    getApplicationStats(),
  ]);

  const applicationStats = statsResult.data ?? {};
  const trackerData = trackerResult.success ? trackerResult.data : null;

  return (
    <section className="space-y-8 pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <DashboardClient
          learners={trackerData?.learners ?? []}
          sessions={trackerData?.sessions ?? []}
          logs={trackerData?.logs ?? []}
          homeworks={trackerData?.homeworks ?? []}
          submissions={trackerData?.submissions ?? []}
          sectionSubmissions={trackerData?.sectionSubmissions ?? []}
          applicationStats={applicationStats}
        />
      </div>
    </section>
  );
}
