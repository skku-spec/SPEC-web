import { getTrackerData } from "@/lib/actions/tracker";
import { DashboardClient } from "./DashboardClient";

export default async function AdminDashboardPage() {
  const trackerData = await getTrackerData();

  return (
    <section className="space-y-8 pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <DashboardClient 
          runners={trackerData.runners as any} 
          sessions={trackerData.sessions} 
          logs={trackerData.logs} 
          homeworks={trackerData.homeworks as any}
          submissions={trackerData.submissions as any}
        />
      </div>
    </section>
  );
}
