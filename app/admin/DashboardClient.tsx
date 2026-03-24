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

  // 1. Calculate Summary Stats
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

  // 2. Rankings or Per-runner Progress
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
    <div className="space-y-12">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group rounded-[32px] border border-[#d9d9cc] bg-white p-8 shadow-sm transition-all hover:bg-[#fcfcfb] hover:shadow-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a196]">Total Runners</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black text-[#16140f]">{totalRunners}</span>
            <span className="text-sm font-bold text-[#6b6b5e] mb-1">명</span>
          </div>
        </div>
        <div className="group rounded-[32px] border border-[#d9d9cc] bg-white p-8 shadow-sm transition-all hover:bg-[#fcfcfb] hover:shadow-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Attendance Rate</p>
          <div className="mt-4 flex items-end gap-2 text-green-600">
            <span className="text-4xl font-black">{attendanceRate}%</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>
        <div className="group rounded-[32px] border border-[#d9d9cc] bg-white p-8 shadow-sm transition-all hover:bg-[#fcfcfb] hover:shadow-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Homework Rate</p>
          <div className="mt-4 flex items-end gap-2 text-blue-600">
            <span className="text-4xl font-black">{homeworkRate}%</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${homeworkRate}%` }} />
          </div>
        </div>
      </div>

      {/* Main Stats Table */}
      <div className="rounded-[40px] border border-[#d9d9cc] bg-white overflow-hidden shadow-sm">
        <div className="border-b border-[#f0efe6] bg-[#fcfcfb] px-10 py-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#16140f]">러너별 주차별 통합 현황</h2>
            <p className="text-xs font-bold text-[#a1a196] mt-1.5">출석(S)과 과제(H) 이행 여부를 주차별로 확인하세요.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-black text-[#a1a196]">
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500"></div> Present</div>
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500"></div> Completed</div>
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-200"></div> Incomplete</div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f0efe6] text-[10px] font-black uppercase tracking-widest text-[#a1a196]">
                <th className="sticky left-0 z-10 bg-[#fcfcfb] px-10 py-5 min-w-[180px]">이름</th>
                <th className="px-6 py-5 border-l border-[#f0efe6] bg-green-50/20">출석 (Sessions)</th>
                <th className="px-6 py-5 border-l border-[#f0efe6] bg-blue-50/20">과제 (Homeworks)</th>
                <th className="px-10 py-5 text-right border-l border-[#f0efe6]">합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0efe6]">
              {runnerStats.map(runner => {
                const totalScore = Math.round((runner.attRate + runner.hwRate) / 2);
                
                return (
                  <tr key={runner.id} className="transition-colors hover:bg-[#fcfcfb] group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#fcfcfb] px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-2xl bg-[#f5f5ee] flex items-center justify-center text-xs font-black shadow-sm group-hover:bg-white transition-colors">
                          {runner.name.charAt(0)}
                        </div>
                        <span className="font-black text-[#16140f] tracking-tight">{runner.name}</span>
                      </div>
                    </td>
                    
                    {/* Attendance Dots */}
                    <td className="px-6 py-6 border-l border-[#f0efe6]">
                      <div className="flex gap-2.5">
                        {safeSessions.map(s => {
                          const status = safeLogs.find(l => l.session_id === s.id && l.user_id === runner.id)?.status;
                          const isPresent = status === 'present' || status === 'late';
                          return (
                            <div key={s.id} className="group/dot relative cursor-help">
                              <div className={`h-6 w-6 rounded-lg transition-all flex items-center justify-center text-[9px] font-black ${
                                isPresent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
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

                    {/* Homework Dots */}
                    <td className="px-6 py-6 border-l border-[#f0efe6]">
                      <div className="flex gap-2.5">
                        {safeHomeworks.map(h => {
                          const isDone = safeSubmissions.some(s => s.homework_id === h.id && s.user_id === runner.id && s.status === 'completed');
                          return (
                            <div key={h.id} className="group/dot relative cursor-help">
                              <div className={`h-6 w-6 rounded-lg transition-all flex items-center justify-center text-[9px] font-black ${
                                isDone ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
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

                    <td className="px-10 py-6 text-right border-l border-[#f0efe6]">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-black ${
                          totalScore >= 80 ? "bg-green-100 text-green-700" :
                          totalScore >= 50 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {totalScore}%
                        </span>
                        <div className="text-[9px] font-bold text-[#a1a196]">A:{runner.attRate}% H:{runner.hwRate}%</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!safeSessions.length && !safeHomeworks.length && (
          <div className="px-10 py-12 text-center text-[#a1a196] text-sm font-medium italic bg-gray-50/30">
             아직 생성된 출석 세션이나 과제가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
