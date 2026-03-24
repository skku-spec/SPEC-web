import { getTrackerData } from "@/lib/actions/tracker";
import { AttendanceClient } from "./AttendanceClient";

export default async function AdminAttendancePage() {
  const data = await getTrackerData();

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
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
