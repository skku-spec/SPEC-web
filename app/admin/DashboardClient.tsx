"use client"

import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import { exportMembersCSV } from "@/lib/actions/members";
import { exportApplicationsCSV, exportAttendanceCSV } from "@/lib/actions/export";

type Profile = {
  id: string;
  name: string;
  role: string | null;
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

type ApplicationStats = Record<
  string,
  { total: number; pending: number; accepted: number; rejected: number; under_review: number }
>;

type Props = {
  learners: Profile[];
  sessions: Session[];
  logs: AttendanceLog[];
  homeworks: Homework[];
  submissions: Submission[];
  applicationStats: ApplicationStats;
}

export function DashboardClient({
  learners,
  sessions,
  logs,
  homeworks,
  submissions,
  applicationStats
}: Props) {
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const downloadCSV = useCallback((csv: string, filename: string) => {
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(async (type: "members" | "applications" | "attendance") => {
    setExportLoading(type);
    try {
      let result: { success?: boolean; error?: string; data?: string };
      let filename: string;
      if (type === "members") {
        result = await exportMembersCSV();
        filename = `members_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (type === "applications") {
        result = await exportApplicationsCSV();
        filename = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        result = await exportAttendanceCSV();
        filename = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
      }
      if (result.success && result.data) {
        downloadCSV(result.data, filename);
      }
    } finally {
      setExportLoading(null);
    }
  }, [downloadCSV]);

  const safeLearners = learners || [];
  const safeSessions = sessions || [];
  const safeLogs = logs || [];
  const safeHomeworks = homeworks || [];
  const safeSubmissions = submissions || [];

  const totalLearners = safeLearners.length;
  const totalAttendancePointsPossible = safeLearners.length * safeSessions.length;
  const actualPresentCount = safeLogs.filter(l => l.status === "present").length;
  const attendanceRate = totalAttendancePointsPossible > 0 
    ? Math.round((actualPresentCount / totalAttendancePointsPossible) * 100) 
    : 0;

  const totalHomeworkPossible = safeLearners.length * safeHomeworks.length;
  const completedHomeworkCount = safeSubmissions.filter(s => s.status === "completed").length;
  const homeworkRate = totalHomeworkPossible > 0 
    ? Math.round((completedHomeworkCount / totalHomeworkPossible) * 100) 
    : 0;

  const learnerStats = safeLearners.map(learner => {
    const userLogs = safeLogs.filter(l => l.user_id === learner.id);
    const userSubmissions = safeSubmissions.filter(s => s.user_id === learner.id && s.status === "completed");
    
    const attRate = safeSessions.length > 0 
      ? Math.round((userLogs.filter(l => l.status === "present").length / safeSessions.length) * 100) 
      : 0;
    
    const hwRate = safeHomeworks.length > 0 
      ? Math.round((userSubmissions.length / safeHomeworks.length) * 100) 
      : 0;

    return {
      ...learner,
      attRate,
      hwRate,
      totalPresent: userLogs.filter(l => l.status === "present").length,
      totalHw: userSubmissions.length
    };
  }).sort((a, b) => (b.attRate + b.hwRate) - (a.attRate + a.hwRate));


  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">Total Learners</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Pretendard',sans-serif] text-3xl font-black text-[#16140f]">{totalLearners}</span>
            <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] mb-0.5">명</span>
          </div>
        </div>
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">Attendance Rate</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Pretendard',sans-serif] text-3xl font-black text-[#2f9e44]">{attendanceRate}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
             <div className="h-full bg-[#2f9e44] transition-all duration-1000" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">Homework Rate</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Pretendard',sans-serif] text-3xl font-black text-[#2563EB]">{homeworkRate}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
             <div className="h-full bg-[#2563EB] transition-all duration-1000" style={{ width: `${homeworkRate}%` }} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece8db] bg-[#f0efe6] px-4 py-3">
          <div>
            <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">러너별 주차별 통합 현황</h2>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">출석(S)과 과제(H) 이행 여부를 주차별로 확인하세요.</p>
          </div>
          <div className="flex gap-3 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#2f9e44]"></div> Present</div>
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#2563EB]"></div> Completed</div>
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-200"></div> Incomplete</div>
          </div>
        </div>
        
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-[#f0efe6] text-left">
            <tr>
              <th className="sticky left-0 z-10 bg-[#f0efe6] px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold min-w-[180px]">이름</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">출석 (Sessions)</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">과제 (Homeworks)</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">합계</th>
            </tr>
          </thead>
          <tbody>
            {learnerStats.map(learner => {
              const totalScore = Math.round((learner.attRate + learner.hwRate) / 2);
              
              return (
                <tr key={learner.id} className="border-t border-[#ece8db] transition-colors hover:bg-[#fcfcf8] group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-[#fcfcf8] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                        {learner.name.charAt(0)}
                      </div>
                      <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {safeSessions.map(s => {
                        const status = safeLogs.find(l => l.session_id === s.id && l.user_id === learner.id)?.status;
                        const isPresent = status === 'present' || status === 'late';
                        return (
                          <div key={s.id} className="group/dot relative cursor-help">
                            <div className={`h-6 w-6 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[9px] font-semibold ${
                              isPresent ? "bg-green-100 text-[#2f9e44]" : "bg-gray-100 text-gray-400"
                            }`}>
                              S
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50 whitespace-nowrap bg-[#16140f] text-white text-[10px] px-2 py-1 rounded shadow-lg">
                              {s.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {safeHomeworks.map(h => {
                        const isDone = safeSubmissions.some(s => s.homework_id === h.id && s.user_id === learner.id && s.status === 'completed');
                        return (
                          <div key={h.id} className="group/dot relative cursor-help">
                            <div className={`h-6 w-6 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[9px] font-semibold ${
                              isDone ? "bg-blue-100 text-[#2563EB]" : "bg-gray-100 text-gray-400"
                            }`}>
                              H
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50 whitespace-nowrap bg-[#16140f] text-white text-[10px] px-2 py-1 rounded shadow-lg">
                              {h.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                        totalScore >= 80 ? "bg-[#E6F9E6] text-[#2f9e44]" :
                        totalScore >= 50 ? "bg-[#FFF0E5] text-[#FF6C0F]" :
                        "bg-[#FEE2E2] text-[#b42318]"
                      }`}>
                        {totalScore}%
                      </span>
                      <div className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">A:{learner.attRate}% H:{learner.hwRate}%</div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="md:hidden space-y-3 p-4">
          {learnerStats.map(learner => {
            const totalScore = Math.round((learner.attRate + learner.hwRate) / 2);
            return (
              <div key={learner.id} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                      {learner.name.charAt(0)}
                    </div>
                    <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</span>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                    totalScore >= 80 ? "bg-[#E6F9E6] text-[#2f9e44]" :
                    totalScore >= 50 ? "bg-[#FFF0E5] text-[#FF6C0F]" :
                    "bg-[#FEE2E2] text-[#b42318]"
                  }`}>
                    {totalScore}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      totalScore >= 80 ? "bg-[#2f9e44]" :
                      totalScore >= 50 ? "bg-[#FF6C0F]" :
                      "bg-[#b42318]"
                    }`}
                    style={{ width: `${totalScore}%` }}
                  />
                </div>
                <div className="mt-2 flex gap-4 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  <span>출석 {learner.attRate}%</span>
                  <span>과제 {learner.hwRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
        {!safeSessions.length && !safeHomeworks.length && (
          <div className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
             아직 생성된 출석 세션이나 과제가 없습니다.
          </div>
        )}
      </div>

      {/* 지원서 통계 */}
      {Object.keys(applicationStats).length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <div className="border-b border-[#ece8db] bg-[#f0efe6] px-4 py-3">
            <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">지원서 통계</h2>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">기수별 지원 현황을 확인하세요.</p>
          </div>
          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">기수</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">전체</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">대기</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">검토중</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">합격</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">불합격</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(applicationStats)
                .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
                .map(([batch, stats]) => (
                  <tr key={batch} className="border-t border-[#ece8db]">
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{batch}기</td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40] text-right">{stats.total}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FFF0E5] text-[#FF6C0F]">
                        {stats.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E8F0FE] text-[#2563EB]">
                        {stats.under_review}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E6F9E6] text-[#2f9e44]">
                        {stats.accepted}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FEE2E2] text-[#b42318]">
                        {stats.rejected}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="md:hidden space-y-3 p-4">
            {Object.entries(applicationStats)
              .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
              .map(([batch, stats]) => (
                <div key={batch} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{batch}기</span>
                    <span className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">{stats.total}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">대기</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FFF0E5] text-[#FF6C0F]">{stats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">검토중</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E8F0FE] text-[#2563EB]">{stats.under_review}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">합격</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E6F9E6] text-[#2f9e44]">{stats.accepted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">불합격</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FEE2E2] text-[#b42318]">{stats.rejected}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 데이터 내보내기 */}
      <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
        <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">데이터 내보내기</h2>
        <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5 mb-4">각 데이터를 CSV 파일로 다운로드합니다.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={exportLoading !== null}
            onClick={() => handleExport("members")}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exportLoading === "members" ? "내보내는 중..." : "멤버 목록 CSV"}
          </button>
          <button
            type="button"
            disabled={exportLoading !== null}
            onClick={() => handleExport("applications")}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exportLoading === "applications" ? "내보내는 중..." : "지원서 목록 CSV"}
          </button>
          <button
            type="button"
            disabled={exportLoading !== null}
            onClick={() => handleExport("attendance")}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exportLoading === "attendance" ? "내보내는 중..." : "출석 데이터 CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
