import { getTrackerData } from "@/lib/actions/tracker";
import { AttendanceClient } from "@/app/admin/attendance/AttendanceClient";

/**
 * Personal Attendance tracking page for Runners.
 */
export default async function DashboardAttendancePage() {
  const data = await getTrackerData();

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Attendance</h1>
      <AttendanceClient 
        runners={data.runners} 
        sessions={data.sessions} 
        homeworks={data.homeworks} 
        logs={data.logs} 
        submissions={data.submissions}
        isAdminOrPreneur={data.isAdminOrPreneur}
      />
    </div>
  );
}
