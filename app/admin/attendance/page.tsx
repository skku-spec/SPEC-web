import { getTrackerData } from "@/lib/actions/tracker";
import { AttendanceClient } from "./AttendanceClient";

export default async function AdminAttendancePage() {
  const result = await getTrackerData();
  const data = result.success ? result.data : null;

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Attendance</h1>
      <AttendanceClient 
        learners={data?.learners ?? []} 
        sessions={data?.sessions ?? []} 
        logs={data?.logs ?? []} 
        isAdminOrPreneur={data?.isAdminOrPreneur ?? false}
        hideHomework={true}
      />
    </div>
  );
}
