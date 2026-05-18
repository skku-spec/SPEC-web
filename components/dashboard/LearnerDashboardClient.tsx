"use client"
import Link from "next/link";
import { computeLearnerHomeworkStats, SectionSubmission } from "@/lib/homework-utils";

type LearnerProfile = {
  first_name?: string | null;
  last_name?: string | null;
  id: string;
  name: string;
  role: string | null;
  username?: string | null;
}

type Session = {
  id: string;
  title: string;
  date: string;
}

type AttendanceLog = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
}

type Homework = {
  id: string;
  title: string;
  due_date: string | null;
  individual_content: unknown;
  team_content: unknown;
}

type Submission = {
  homework_id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
}

type Props = {
  learner: LearnerProfile;
  sessions: Session[];
  logs: AttendanceLog[];
  homeworks: Homework[];
  submissions: Submission[];
  sectionSubmissions?: SectionSubmission[];
}

export function LearnerDashboardClient({
  learner,
  sessions,
  logs,
  homeworks,
  submissions,
  sectionSubmissions,
}: Props) {
  const safeSessions = sessions || [];
  const safeLogs = logs || [];
  const safeHomeworks = homeworks || [];
  const safeSubmissions = submissions || [];

  const userLogs = safeLogs.filter(l => l.user_id === learner.id);

  // Attendance stats
  const presentCount = userLogs.filter(l => l.status === "present" || l.status === "late").length;
  const attLateCount = userLogs.filter(l => l.status === "late").length;
  const personalAttRate = safeSessions.length > 0
    ? Math.round((presentCount / safeSessions.length) * 100)
    : 0;

  // Homework stats (per individual homework)
  const hwStats = computeLearnerHomeworkStats(learner.id, safeHomeworks, safeSubmissions, sectionSubmissions);
  const personalHwRate = hwStats.totalCount > 0
    ? Math.round((hwStats.completedCount / hwStats.totalCount) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-[system-ui] text-[clamp(2.5rem,5vw,3.25rem)] font-black leading-tight text-[#16140f]">
          반가워요, {learner.first_name && learner.last_name ? `${learner.last_name}${learner.first_name}` : learner.name}님 👋
        </h1>
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
          이번 기수 나의 출석과 과제 현황을 한눈에 확인해 보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 출석 카드 */}
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">출석 현황</h2>
            <span className="font-['Pretendard',sans-serif] text-lg font-black text-[#2f9e44]">{personalAttRate}%</span>
          </div>

          <div className="flex gap-5 mb-5">
            <div className="flex flex-col gap-0.5">
              <span className="font-['Pretendard',sans-serif] text-[10px] font-semibold uppercase tracking-wide text-[#6b6b5e]">출석</span>
              <span className="font-['Pretendard',sans-serif] text-2xl font-black text-[#2f9e44] leading-none">
                {presentCount}
                <span className="text-xs font-medium text-[#6b6b5e] ml-0.5">/{safeSessions.length}</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-['Pretendard',sans-serif] text-[10px] font-semibold uppercase tracking-wide text-[#6b6b5e]">지각</span>
              <span className={`font-['Pretendard',sans-serif] text-2xl font-black leading-none ${attLateCount > 0 ? "text-[#FF6C0F]" : "text-[#c8c4b8]"}`}>
                {attLateCount}
                <span className="text-xs font-medium text-[#6b6b5e] ml-0.5">회</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {safeSessions.map(s => {
              const status = userLogs.find(l => l.session_id === s.id)?.status;
              const isPresent = status === 'present' || status === 'late';
              return (
                <div key={s.id} className="group relative">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[11px] font-semibold transition-all border ${
                    isPresent ? "bg-green-100 text-[#2f9e44] border-green-200" : "bg-gray-50 text-gray-300 border-gray-100"
                  }`}>
                    S
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap bg-[#16140f] text-white text-[11px] px-2 py-1 rounded shadow-lg">
                    {s.title} ({status === 'present' ? '출석' : status === 'late' ? '지각' : status === 'absent' ? '결석' : '정보 없음'})
                  </div>
                </div>
              );
            })}
            {safeSessions.length === 0 && (
              <p className="text-sm text-[#6b6b5e] font-['Pretendard',sans-serif]">등록된 세션이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 과제 카드 */}
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">과제 완료 현황</h2>
              <Link
                href="/dashboard/homework"
                className="font-['Pretendard',sans-serif] text-[11px] text-[#6b6b5e] hover:text-[#FF6C0F] transition-colors"
              >
                제출하러 가기 →
              </Link>
            </div>
            <span className="font-['Pretendard',sans-serif] text-lg font-black text-[#2563EB]">{personalHwRate}%</span>
          </div>

          <div className="flex gap-5 mb-5">
            <div className="flex flex-col gap-0.5">
              <span className="font-['Pretendard',sans-serif] text-[10px] font-semibold uppercase tracking-wide text-[#6b6b5e]">완료</span>
              <span className="font-['Pretendard',sans-serif] text-2xl font-black text-[#2563EB] leading-none">
                {hwStats.completedCount}
                <span className="text-xs font-medium text-[#6b6b5e] ml-0.5">/{hwStats.totalCount}</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-['Pretendard',sans-serif] text-[10px] font-semibold uppercase tracking-wide text-[#6b6b5e]">미제출</span>
              <span className={`font-['Pretendard',sans-serif] text-2xl font-black leading-none ${hwStats.notSubmittedCount > 0 ? "text-[#b42318]" : "text-[#c8c4b8]"}`}>
                {hwStats.notSubmittedCount}
                <span className="text-xs font-medium text-[#6b6b5e] ml-0.5">개</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-['Pretendard',sans-serif] text-[10px] font-semibold uppercase tracking-wide text-[#6b6b5e]">지각 제출</span>
              <span className={`font-['Pretendard',sans-serif] text-2xl font-black leading-none ${hwStats.lateCount > 0 ? "text-[#FF6C0F]" : "text-[#c8c4b8]"}`}>
                {hwStats.lateCount}
                <span className="text-xs font-medium text-[#6b6b5e] ml-0.5">개</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {safeHomeworks.map(h => {
              const isDone = safeSubmissions.some(s => s.homework_id === h.id && s.user_id === learner.id && s.status === "completed");
              return (
                <div key={h.id} className="group relative">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[11px] font-semibold transition-all border ${
                    isDone ? "bg-blue-100 text-[#2563EB] border-blue-200" : "bg-gray-50 text-gray-300 border-gray-100"
                  }`}>
                    H
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap bg-[#16140f] text-white text-[11px] px-2 py-1 rounded shadow-lg">
                    {h.title} ({isDone ? '완료' : '미완료'})
                  </div>
                </div>
              );
            })}
            {safeHomeworks.length === 0 && (
              <p className="text-sm text-[#6b6b5e] font-['Pretendard',sans-serif]">등록된 과제가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-5 text-center">
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
          출석과 과제는 매주 정기 세션 종료 후 업데이트됩니다.
          문의사항은 학회 운영진에게 연락해 주세요.
        </p>
      </div>
    </div>
  );
}
