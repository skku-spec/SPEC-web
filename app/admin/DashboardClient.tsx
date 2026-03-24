"use client"

import { useState } from "react";

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

type Props = {
  runners: Profile[];
  sessions: Session[];
  logs: AttendanceLog[];
  homeworks: Homework[];
  submissions: Submission[];
}

export function DashboardClient({
  runners,
  sessions,
  logs,
  homeworks,
  submissions
}: Props) {
  const safeRunners = runners || [];
  const safeSessions = sessions || [];
  const safeLogs = logs || [];
  const safeHomeworks = homeworks || [];
  const safeSubmissions = submissions || [];

  const totalRunners = safeRunners.length;
  const totalAttendancePointsPossible = safeRunners.length * safeSessions.length;
  const actualPresentCount = safeLogs.filter(l => l.status === "present").length;
  const attendanceRate = totalAttendancePointsPossible > 0 
    ? Math.round((actualPresentCount / totalAttendancePointsPossible) * 100) 
    : 0;

  const totalHomeworkPossible = safeRunners.length * safeHomeworks.length;
  const completedHomeworkCount = safeSubmissions.filter(s => s.status === "completed").length;
  const homeworkRate = totalHomeworkPossible > 0 
    ? Math.round((completedHomeworkCount / totalHomeworkPossible) * 100) 
    : 0;

  const runnerStats = safeRunners.map(runner => {
    const userLogs = safeLogs.filter(l => l.user_id === runner.id);
    const userSubmissions = safeSubmissions.filter(s => s.user_id === runner.id && s.status === "completed");
    
    const attRate = safeSessions.length > 0 
      ? Math.round((userLogs.filter(l => l.status === "present").length / safeSessions.length) * 100) 
      : 0;
    
    const hwRate = safeHomeworks.length > 0 
      ? Math.round((userSubmissions.length / safeHomeworks.length) * 100) 
      : 0;

    return {
      ...runner,
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
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">Total Runners</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Pretendard',sans-serif] text-3xl font-black text-[#16140f]">{totalRunners}</span>
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
        
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f0efe6] text-left">
            <tr>
              <th className="sticky left-0 z-10 bg-[#f0efe6] px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold min-w-[180px]">이름</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">출석 (Sessions)</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">과제 (Homeworks)</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">합계</th>
            </tr>
          </thead>
          <tbody>
            {runnerStats.map(runner => {
              const totalScore = Math.round((runner.attRate + runner.hwRate) / 2);
              
              return (
                <tr key={runner.id} className="border-t border-[#ece8db] transition-colors hover:bg-[#fcfcf8] group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-[#fcfcf8] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                        {runner.name.charAt(0)}
                      </div>
                      <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{runner.name}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {safeSessions.map(s => {
                        const status = safeLogs.find(l => l.session_id === s.id && l.user_id === runner.id)?.status;
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
                        const isDone = safeSubmissions.some(s => s.homework_id === h.id && s.user_id === runner.id && s.status === 'completed');
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
                      <div className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">A:{runner.attRate}% H:{runner.hwRate}%</div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!safeSessions.length && !safeHomeworks.length && (
          <div className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
             아직 생성된 출석 세션이나 과제가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
