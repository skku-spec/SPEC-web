import { getTrackerData } from "@/lib/actions/tracker";
import { AttendanceClient } from "./AttendanceClient";

export default async function AdminAttendancePage() {
  const data = await getTrackerData();

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Attendance</h1>
      <AttendanceClient 
        runners={data.runners} 
        sessions={data.sessions} 
        logs={data.logs} 
        isAdminOrPreneur={data.isAdminOrPreneur}
        hideHomework={true}
      />
    </div>
  );
}
