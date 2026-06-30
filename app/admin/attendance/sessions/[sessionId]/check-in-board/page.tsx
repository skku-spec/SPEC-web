import type { Metadata } from "next";
import Link from "next/link";

import { AttendanceQr } from "@/components/dashboard/AttendanceQr";
import { buildAttendanceCheckInUrl, normalizeAttendanceCode } from "@/lib/attendance-check-in-utils";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "출석 체크 보드 | SPEC Admin",
};

type CheckInBoardPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ code?: string }>;
};

export default async function CheckInBoardPage({ params, searchParams }: CheckInBoardPageProps) {
  const { sessionId } = await params;
  const { code: rawCode } = await searchParams;
  const code = normalizeAttendanceCode(rawCode ?? "");
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("id, title, date, starts_at, check_in_closes_at, self_check_in_enabled")
    .eq("id", sessionId)
    .maybeSingle();

  const checkInUrl = code.length === 6
    ? buildAttendanceCheckInUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", sessionId, code)
    : "";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl flex-col items-center justify-center gap-8 px-5 py-8 text-center">
      <div className="max-w-full space-y-2">
        <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#FF6C0F]">SPEC Attendance</p>
        <h1 className="max-w-full break-words font-[system-ui] text-[clamp(2rem,6vw,4.5rem)] font-black leading-tight text-[#16140f]">
          {session?.title ?? "출석 체크"}
        </h1>
        <p className="font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">{session?.date ?? ""}</p>
      </div>

      {code.length === 6 ? (
        <AttendanceQr sessionId={sessionId} code={code} checkInUrl={checkInUrl} size="large" />
      ) : (
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">표시할 출석 코드가 없습니다.</p>
        </div>
      )}

      <Link
        href="/admin/attendance"
        className="inline-flex h-10 items-center rounded-md border border-[#ddd9cc] px-4 font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
      >
        출석 관리
      </Link>
    </div>
  );
}
