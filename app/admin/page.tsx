import { getTrackerData } from "@/lib/actions/tracker";
import { getApplicationStats } from "@/lib/actions/export";
import { DashboardClient } from "./DashboardClient";

export default async function AdminDashboardPage() {
  const [trackerData, statsResult] = await Promise.all([
    getTrackerData(),
    getApplicationStats(),
  ]);

  const applicationStats = statsResult.data ?? {};

  return (
    <section className="space-y-8 pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <DashboardClient 
          runners={trackerData.runners} 
          sessions={trackerData.sessions} 
          logs={trackerData.logs} 
          homeworks={trackerData.homeworks}
          submissions={trackerData.submissions}
          applicationStats={applicationStats}
        />
      </div>
    </section>
  );
}
