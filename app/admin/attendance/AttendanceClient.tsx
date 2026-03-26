"use client"

import { useState, useTransition } from "react";
import { markAttendance, deleteAttendance, createSession, deleteSession, markAllPresent } from "@/lib/actions/tracker";

type Profile = {
  id: string;
  name: string;
  role: string | null;
}
type Status = "present" | "late" | "absent" | "excused";

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
  is_individual?: boolean;
  is_team?: boolean;
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

const STATUS_OPTS: { key: Status; label: string; color: string; text: string; hover: string; active: string }[] = [
  { key: "present", label: "출", color: "bg-[#2f9e44]", text: "text-[#2f9e44]", hover: "hover:bg-[#2f9e44]/10", active: "bg-[#2f9e44]/5" },
  { key: "late", label: "지", color: "bg-[#FF6C0F]", text: "text-[#FF6C0F]", hover: "hover:bg-[#FF6C0F]/10", active: "bg-[#FF6C0F]/5" },
  { key: "absent", label: "결", color: "bg-[#b42318]", text: "text-[#b42318]", hover: "hover:bg-[#b42318]/10", active: "bg-[#b42318]/5" },
  { key: "excused", label: "공", color: "bg-[#2563EB]", text: "text-[#2563EB]", hover: "hover:bg-[#2563EB]/10", active: "bg-[#2563EB]/5" },
];

const STATUS_LABELS: Record<Status, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
  excused: "공결",
};

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
  const [submissions] = useState(initialSubmissions);
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
      excused: userLogs.filter(l => l.status === "excused").length,
      homework: userSubmissions.length,
    };
  };

  const handleUpdateStatus = async (userId: string, sessionId: string, status: Status) => {
    if (!isAdminOrPreneur) return;
    const current = logs.find(l => l.user_id === userId && l.session_id === sessionId);
    const isToggleOff = current?.status === status;

    startTransition(async () => {
      try {
        if (isToggleOff) {
          await deleteAttendance(userId, sessionId);
          setLogs(prev => prev.filter(l => !(l.user_id === userId && l.session_id === sessionId)));
        } else {
          await markAttendance(userId, sessionId, status);
          setLogs(prev => {
            const filtered = prev.filter(l => !(l.user_id === userId && l.session_id === sessionId));
            return [...filtered, { id: crypto.randomUUID(), user_id: userId, session_id: sessionId, status }];
          });
        }
      } catch (e) {
        alert(e instanceof Error ? e.message : "출석 상태 변경 중 오류가 발생했습니다.");
      }
    });
  };

  const handleMarkAllPresent = async (sessionId: string) => {
    if (!isAdminOrPreneur) return;
    if (!confirm("전원 출석으로 변경하시겠습니까?")) return;
    startTransition(async () => {
      try {
        await markAllPresent(sessionId);
        setLogs(prev => {
          const filtered = prev.filter(l => l.session_id !== sessionId);
          const newLogs = runners.map(r => ({
            id: crypto.randomUUID(),
            user_id: r.id,
            session_id: sessionId,
            status: "present"
          }));
          return [...filtered, ...newLogs];
        });
      } catch (e) {
        alert(e instanceof Error ? e.message : "전원 출석 처리 중 오류가 발생했습니다.");
      }
    });
  };

  const handleAddSession = () => {
    const title = newSessionTitle.trim() || `${sessions.length + 1}주차`;
    const date = new Date().toISOString().split('T')[0];
    startTransition(async () => {
      try {
        const result = await createSession(title, date);
        if (result.session) {
          setSessions(prev => [...prev, {
            id: result.session.id,
            title: result.session.title,
            date: result.session.date
          }]);
        }
        setNewSessionTitle("");
      } catch (e) {
        alert(e instanceof Error ? e.message : "세션 추가 중 오류가 발생했습니다.");
      }
    });
  };

  const handleDeleteSession = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    startTransition(async () => {
      try {
        await deleteSession(id);
        setSessions(prev => prev.filter(s => s.id !== id));
        setLogs(prev => prev.filter(l => l.session_id !== id));
      } catch (e) {
        alert(e instanceof Error ? e.message : "세션 삭제 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {isAdminOrPreneur && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="새 세션 (예: 5주차)"
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            className="w-48 rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
          />
          <button
            onClick={handleAddSession}
            disabled={isPending}
            className="inline-flex h-8 items-center rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/80 disabled:opacity-50"
          >
            세션 추가
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#f0efe6] text-left">
            <tr>
              <th className="sticky left-0 z-30 bg-[#f0efe6] px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold min-w-[200px]">
                러너
              </th>

              {sessions.map(s => (
                <th key={s.id} className="px-3 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-center min-w-[110px]">
                  <div>{s.title}</div>
                  {isAdminOrPreneur && (
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleMarkAllPresent(s.id)}
                        disabled={isPending}
                        className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F] hover:underline disabled:opacity-50"
                      >
                        전원 출석
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        disabled={isPending}
                        className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] hover:underline disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </th>
              ))}

              {!hideHomework && homeworks.map((h, i) => (
                <th key={h.id} className="px-3 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-center min-w-[100px]">
                  {i + 1}주차 과제
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runners.map(runner => {
              const stats = calculateStats(runner.id);
              return (
                <tr key={runner.id} className="border-t border-[#ece8db] transition-colors hover:bg-[#fcfcf8] group text-center">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-[#fcfcf8] px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                        {runner.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{runner.name}</p>
                        <div className="flex gap-2 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                          <span className="text-[#2f9e44]">출 {stats.present}</span>
                          <span className="text-[#FF6C0F]">지 {stats.late}</span>
                          <span className="text-[#b42318]">결 {stats.absent}</span>
                          <span className="text-[#2563EB]">공 {stats.excused}</span>
                          {!hideHomework && <span className="text-[#2563EB]">과제 {stats.homework}/{homeworks.length}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {sessions.map(session => {
                    const currentStatus = getAttendanceStatus(runner.id, session.id);
                    return (
                      <td key={session.id} className="px-2 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {STATUS_OPTS.map(opt => {
                            const isActive = currentStatus === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => handleUpdateStatus(runner.id, session.id, opt.key)}
                                disabled={!isAdminOrPreneur || isPending}
                                className={`flex h-7 w-7 items-center justify-center rounded-md font-['Pretendard',sans-serif] text-xs font-semibold transition-all border ${
                                  isActive
                                    ? `${opt.active} ${opt.text} ${opt.color.replace('bg-', 'border-')}`
                                    : `bg-white text-[#ddd9cc] border-[#ece8db] ${opt.hover}`
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

                  {!hideHomework && homeworks.map(homework => {
                    const isCompleted = getHomeworkStatus(runner.id, homework.id);
                    return (
                      <td key={homework.id} className="px-2 py-3">
                        <div
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md font-['Pretendard',sans-serif] text-xs font-semibold ${
                            isCompleted ? "bg-[#2563EB] text-white" : "bg-[#f0efe6] text-[#ddd9cc]"
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

      <div className="flex items-center gap-4 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
        {STATUS_OPTS.map(opt => (
          <div key={opt.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${opt.color}`} />
            <span>{STATUS_LABELS[opt.key]}</span>
          </div>
        ))}
        {!hideHomework && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
            <span>과제 완료</span>
          </div>
        )}
      </div>
    </div>
  );
}
