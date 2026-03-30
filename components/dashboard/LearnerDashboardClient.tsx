"use client"
import Link from "next/link";

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
}

type Submission = {
  homework_id: string;
  user_id: string;
  status: string;
}

type Props = {
  learner: LearnerProfile;
  sessions: Session[];
  logs: AttendanceLog[];
  homeworks: Homework[];
  submissions: Submission[];
}

export function LearnerDashboardClient({
  learner,
  sessions,
  logs,
  homeworks,
  submissions,
}: Props) {
  const safeSessions = sessions || [];
  const safeLogs = logs || [];
  const safeHomeworks = homeworks || [];
  const safeSubmissions = submissions || [];

  const userLogs = safeLogs.filter(l => l.user_id === learner.id);
  const userSubmissions = safeSubmissions.filter(s => s.user_id === learner.id && s.status === "completed");

  const personalAttRate = safeSessions.length > 0 
    ? Math.round((userLogs.filter(l => l.status === "present" || l.status === "late").length / safeSessions.length) * 100) 
    : 0;

  const personalHwRate = safeHomeworks.length > 0 
    ? Math.round((userSubmissions.length / safeHomeworks.length) * 100) 
    : 0;

  const totalScore = Math.round((personalAttRate + personalHwRate) / 2);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-[system-ui] text-[clamp(2.5rem,5vw,3.25rem)] font-black leading-tight text-[#16140f]">
          반가워요, {learner.first_name && learner.last_name ? `${learner.last_name}${learner.first_name}` : learner.name}님 👋
        </h1>
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
          이번 기수 나의 학업 성취도를 한눈에 확인해 보세요.
        </p>
      </div>

      {/* 종합 성적 카드 */}
      <div className="rounded-lg border border-[#ddd9cc] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#6b6b5e]">종합 성취도</p>
          </div>
          <div className="flex-1 max-w-md">
            <div className="flex justify-between font-['Pretendard',sans-serif] text-xs mb-2">
              <span className="text-[#6b6b5e]">Pass Line (80%)</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  totalScore >= 80 ? "bg-[#2f9e44]" :
                  totalScore >= 50 ? "bg-[#FF6C0F]" :
                  "bg-[#b42318]"
                }`}
                style={{ width: `${totalScore}%` }} 
              />
            </div>
            {totalScore < 80 && (
              <p className="mt-2 text-[11px] text-[#FF6C0F] font-medium font-['Pretendard',sans-serif]">
                졸업 기준(80%)까지 {80 - totalScore}% 남았습니다. 조금만 더 힘내세요!
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 출석 카드 */}
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">출석 현황</h2>
            <span className="font-['Pretendard',sans-serif] text-lg font-black text-[#2f9e44]">{personalAttRate}%</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {safeSessions.map(s => {
              const status = userLogs.find(l => l.session_id === s.id)?.status;
              const isPresent = status === 'present' || status === 'late';
              return (
                <div key={s.id} className="group relative">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[11px] font-semibold transition-all ${
                    isPresent ? "bg-green-100 text-[#2f9e44] border-green-200" : "bg-gray-50 text-gray-300 border-gray-100"
                  } border`}>
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
          <div className="flex items-center justify-between mb-6">
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
          
          <div className="flex flex-wrap gap-2">
            {safeHomeworks.map(h => {
              const isDone = userSubmissions.some(s => s.homework_id === h.id);
              return (
                <div key={h.id} className="group relative">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[11px] font-semibold transition-all ${
                    isDone ? "bg-blue-100 text-[#2563EB] border-blue-200" : "bg-gray-50 text-gray-300 border-gray-100"
                  } border`}>
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
