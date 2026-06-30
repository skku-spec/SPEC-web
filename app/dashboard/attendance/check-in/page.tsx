import type { Metadata } from "next";

import { getLearnerAttendanceCheckInState } from "@/lib/actions/attendance-check-in";
import { AttendanceCheckInClient } from "@/components/dashboard/AttendanceCheckInClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "출석 체크 | SPEC",
};

type CheckInPageProps = {
  searchParams: Promise<{
    session?: string;
    code?: string;
  }>;
};

export default async function DashboardAttendanceCheckInPage({ searchParams }: CheckInPageProps) {
  const params = await searchParams;
  const result = await getLearnerAttendanceCheckInState(params.session, params.code);

  if (!result.success) {
    return (
      <div className="mx-auto flex h-[300px] max-w-4xl flex-col items-center justify-center rounded-lg border border-[#ddd9cc] bg-white font-['Pretendard',sans-serif] text-sm text-[#b42318]">
        {result.error}
      </div>
    );
  }

  return <AttendanceCheckInClient initialState={result.data} initialCode={result.data.prefilledCode} />;
}
