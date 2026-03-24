"use client"

import { useState, useTransition } from "react";
import { markAttendance, createSession, deleteSession, markAllPresent } from "@/lib/actions/tracker";

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
  week: number;
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
  isAdminOrPreneur: boolean;
  homeworks?: Homework[];
  submissions?: Submission[];
  hideHomework?: boolean;
}

const STATUS_OPTS = [
  { key: "present", label: "출", color: "bg-green-500", text: "text-green-500", hover: "hover:bg-green-100", active: "bg-green-50" },
  { key: "late", label: "지", color: "bg-amber-500", text: "text-amber-500", hover: "hover:bg-amber-100", active: "bg-amber-50" },
  { key: "absent", label: "결", color: "bg-red-500", text: "text-red-500", hover: "hover:bg-red-100", active: "bg-red-50" },
  { key: "excused", label: "공", color: "bg-blue-500", text: "text-blue-500", hover: "hover:bg-blue-100", active: "bg-blue-50" },
];

export function AttendanceClient({
  runners,
  sessions: initialSessions,
  logs: initialLogs,
  isAdminOrPreneur,
  homeworks = [],
  submissions: initialSubmissions = [],
  hideHomework = false
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [sessions, setSessions] = useState(initialSessions);
  const [logs, setLogs] = useState(initialLogs);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [newSessionTitle, setNewSessionTitle] = useState("");

  const getAttendanceStatus = (userId: string, sessionId: string) => {
    return logs.find(l => l.user_id === userId && l.session_id === sessionId)?.status || "none";
  };

  const getHomeworkStatus = (userId: string, homeworkId: string) => {
    return submissions.some(s => s.user_id === userId && s.homework_id === homeworkId && s.status === "completed");
  };

  const calculateStats = (userId: string) => {
    const userLogs = logs.filter(l => l.user_id === userId);
    const userSubmissions = submissions.filter(s => s.user_id === userId && s.status === "completed");
    return {
      present: userLogs.filter(l => l.status === "present").length,
      late: userLogs.filter(l => l.status === "late").length,
      absent: userLogs.filter(l => l.status === "absent").length,
      homework: userSubmissions.length,
    };
  };

  const handleUpdateStatus = async (userId: string, sessionId: string, status: string) => {
    if (!isAdminOrPreneur) return;
    startTransition(async () => {
      await markAttendance(userId, sessionId, status as any);
      setLogs(prev => {
        const filtered = prev.filter(l => !(l.user_id === userId && l.session_id === sessionId));
        const current = prev.find(l => l.user_id === userId && l.session_id === sessionId);
        if (current?.status === status) return filtered;
        return [...filtered, { id: Math.random().toString(), user_id: userId, session_id: sessionId, status }];
      });
    });
  };



  const handleMarkAllPresent = async (sessionId: string) => {
    if (!isAdminOrPreneur) return;
    startTransition(async () => {
      await markAllPresent(sessionId);
      setLogs(prev => {
        const filtered = prev.filter(l => l.session_id !== sessionId);
        const newLogs = runners.map(r => ({
          id: Math.random().toString(),
          user_id: r.id,
          session_id: sessionId,
          status: "present"
        }));
        return [...filtered, ...newLogs];
      });
    });
  };

  const handleAddSession = () => {
    const title = newSessionTitle.trim() || `${sessions.length + 1}주차`;
    const date = new Date().toISOString().split('T')[0];
    startTransition(async () => {
      await createSession(title, date);
      setSessions(prev => [...prev, { id: Math.random().toString(), title, date }]);
      setNewSessionTitle("");
    });
  };

  const handleDeleteSession = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#d9d9cc] bg-white p-6 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black tracking-tight text-[#16140f]">{hideHomework ? "출석부 관리" : "통합 현황판"}</h2>
          <p className="text-xs font-medium text-[#a1a196]">
            {hideHomework ? "세션별 출석 현황을 관리하고 기록하세요." : "출석과 과제 현황을 한꺼번에 관리하세요."}
          </p>
        </div>

        {isAdminOrPreneur && (
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="새 세션 (예: 5주차)"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              className="h-10 w-48 rounded-xl border border-[#d9d9cc] bg-[#fcfcfb] px-4 text-xs font-bold outline-none focus:border-[#FF6C0F]"
            />
            <button 
              onClick={handleAddSession}
              disabled={isPending}
              className="h-10 px-5 rounded-xl bg-[#FF6C0F] text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              세션 추가+
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-[#d9d9cc] bg-white shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#fcfcfb] border-b border-[#f0efe6]">
              <th className="sticky left-0 z-30 bg-[#fcfcfb] px-6 py-5 border-r border-[#f0efe6] min-w-[200px]">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#a1a196]">러너 정보 및 요약</div>
              </th>
              
              {/* Attendance Headers */}
              {sessions.map(s => (
                <th key={s.id} className="px-3 py-5 border-r border-[#f0efe6] min-w-[110px] text-center bg-white/50">
                  <div className="text-[10px] font-black text-[#FF6C0F] leading-tight">{s.title}</div>
                  <div className="text-[9px] font-bold text-[#6b6b5e]">출석</div>
                  {isAdminOrPreneur && (
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <button onClick={() => handleMarkAllPresent(s.id)} className="text-[8px] font-black bg-[#FF6C0F]/10 text-[#FF6C0F] px-1.5 py-0.5 rounded hover:bg-[#FF6C0F] hover:text-white transition-colors">전원 출석</button>
                    </div>
                  )}
                </th>
              ))}

              {/* Homework Headers */}
              {!hideHomework && homeworks.map(h => (
                <th key={h.id} className="px-3 py-5 border-r border-[#f0efe6] min-w-[100px] text-center bg-blue-50/30">
                  <div className="text-[10px] font-black text-blue-600 leading-tight">{h.week}주차 과제</div>
                  <div className="text-[9px] font-bold text-blue-400">과제</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0efe6]">
            {runners.map(runner => {
              const stats = calculateStats(runner.id);
              return (
                <tr key={runner.id} className="hover:bg-[#fcfcfb] transition-colors group text-center">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-[#fcfcfb] px-6 py-4 border-r border-[#f0efe6] text-left">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-[#16140f]">{runner.name}</span>
                      <div className="flex gap-2">
                        <span className="text-[9px] font-bold text-green-500">출 {stats.present}</span>
                        <span className="text-[9px] font-bold text-amber-500">지 {stats.late}</span>
                        <span className="text-[9px] font-bold text-red-500">결 {stats.absent}</span>
                        {!hideHomework && <span className="text-[9px] font-bold text-blue-600">과제 {stats.homework}/{homeworks.length}</span>}
                      </div>
                    </div>
                  </td>
                  
                  {/* Attendance Cells */}
                  {sessions.map(session => {
                    const currentStatus = getAttendanceStatus(runner.id, session.id);
                    return (
                      <td key={session.id} className="px-2 py-3 border-r border-[#f0efe6]">
                        <div className="flex items-center justify-center gap-1">
                          {STATUS_OPTS.map(opt => {
                            const isActive = currentStatus === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => handleUpdateStatus(runner.id, session.id, opt.key)}
                                disabled={!isAdminOrPreneur || isPending}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black transition-all border ${
                                  isActive 
                                    ? `${opt.active} ${opt.text} ${opt.color.replace('bg-', 'border-')}` 
                                    : `bg-white text-[#d9d9cc] border-[#f0efe6] ${opt.hover}`
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}

                  {/* Homework Cells */}
                  {/* Homework Cells */}
                  {!hideHomework && homeworks.map(homework => {
                    const isCompleted = getHomeworkStatus(runner.id, homework.id);
                    return (
                      <td key={homework.id} className="px-2 py-3 border-r border-[#f0efe6]">
                        <div
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg font-black text-[11px] transition-all ${
                            isCompleted ? "bg-blue-600 text-white shadow-sm" : "bg-gray-50 text-gray-300 border border-gray-100"
                          }`}
                        >
                          {isCompleted ? "✓" : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-6 rounded-2xl border border-[#d9d9cc] bg-[#fcfcfb] p-4 text-[10px] font-bold">
        <div className="text-[#a1a196] uppercase tracking-widest mr-4">범례</div>
        {STATUS_OPTS.map(opt => (
          <div key={opt.key} className="flex items-center gap-1.5 focus:outline-none">
            <span className={`h-2 w-2 rounded-full ${opt.color.replace('bg-', 'bg-')}`} style={{ backgroundColor: opt.color.includes('bg-') ? '' : opt.color }} />
            <span className="text-[#16140f] outline-none">{opt.key === 'present' ? '출석' : opt.key === 'late' ? '지각' : opt.key === 'absent' ? '결석' : '공결'}</span>
          </div>
        ))}
        <div className="ml-6 pl-6 border-l border-[#d9d9cc] flex items-center gap-2">
          <span className="h-2 w-2 rounded bg-blue-600" />
          <span className="text-[#16140f]">과제 완료</span>
        </div>
      </div>
    </div>
  );
}
