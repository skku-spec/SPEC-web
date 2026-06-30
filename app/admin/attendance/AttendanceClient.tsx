"use client"

import { useState, useTransition, useEffect } from "react";
import { markAttendance, deleteAttendance, createSession, deleteSession, markAllPresent } from "@/lib/actions/tracker";
import { MessageSquareText } from "lucide-react";
import {
  closeSessionCheckIn,
  generateAttendanceCheckInCode,
  updateSessionCheckInSettings,
} from "@/lib/actions/attendance-check-in";
import {
  AttendanceSessionCheckInPanel,
  type CheckInSettings,
  type GeneratedCheckIn,
} from "@/app/admin/attendance/AttendanceSessionCheckInPanel";

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
  starts_at?: string | null;
  check_in_opens_at?: string | null;
  check_in_closes_at?: string | null;
  self_check_in_enabled?: boolean;
}

type AttendanceLog = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  notes?: string | null;
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
  learners: Profile[];
  sessions: Session[];
  logs: AttendanceLog[];
  isAdminOrPreneur: boolean;
  homeworks?: Homework[];
  submissions?: Submission[];
  hideHomework?: boolean;
}

const STATUS_OPTS: {
  key: Status;
  label: string;
  color: string;
  text: string;
  border: string;
  hover: string;
  active: string;
}[] = [
  { key: "present", label: "출", color: "bg-[#2f9e44]", text: "text-[#2f9e44]", border: "border-[#2f9e44]", hover: "hover:bg-[#2f9e44]/10", active: "bg-[#2f9e44]/5" },
  { key: "late", label: "지", color: "bg-[#FF6C0F]", text: "text-[#FF6C0F]", border: "border-[#FF6C0F]", hover: "hover:bg-[#FF6C0F]/10", active: "bg-[#FF6C0F]/5" },
  { key: "absent", label: "결", color: "bg-[#b42318]", text: "text-[#b42318]", border: "border-[#b42318]", hover: "hover:bg-[#b42318]/10", active: "bg-[#b42318]/5" },
  { key: "excused", label: "공", color: "bg-[#2563EB]", text: "text-[#2563EB]", border: "border-[#2563EB]", hover: "hover:bg-[#2563EB]/10", active: "bg-[#2563EB]/5" },
];

const STATUS_LABELS: Record<Status, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
  excused: "공결",
};

function isoToLocalInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function makeSessionSettings(session: Session): CheckInSettings {
  return {
    startsAt: isoToLocalInput(session.starts_at),
    opensAt: isoToLocalInput(session.check_in_opens_at),
    closesAt: isoToLocalInput(session.check_in_closes_at),
    enabled: Boolean(session.self_check_in_enabled),
  };
}

function makeInitialSettings(sessions: Session[]): Record<string, CheckInSettings> {
  return Object.fromEntries(sessions.map((session) => [session.id, makeSessionSettings(session)]));
}

export function AttendanceClient({
  learners,
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
  const [generatedCheckIns, setGeneratedCheckIns] = useState<Record<string, GeneratedCheckIn>>({});
  const [checkInSettings, setCheckInSettings] = useState<Record<string, CheckInSettings>>(
    () => makeInitialSettings(initialSessions),
  );
  const [reasonModal, setReasonModal] = useState<{
    open: boolean;
    userId: string;
    sessionId: string;
    status: Status;
    userName: string;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [viewNotesModal, setViewNotesModal] = useState<{
    userName: string;
    sessionTitle: string;
    notes: string;
  } | null>(null);

  const getAttendanceStatus = (userId: string, sessionId: string) => {
    return logs.find(l => l.user_id === userId && l.session_id === sessionId)?.status || "none";
  };

  const getHomeworkStatus = (userId: string, homeworkId: string) => {
    return submissions.some(s => s.user_id === userId && s.homework_id === homeworkId && s.status === "completed");
  };

  const updateCheckInSetting = (sessionId: string, key: keyof CheckInSettings, value: string | boolean) => {
    setCheckInSettings(prev => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] ?? makeSessionSettings(sessions.find(session => session.id === sessionId) ?? {
          id: sessionId,
          title: "",
          date: "",
        })),
        [key]: value,
      },
    }));
  };

  const replaceAttendanceLog = (nextLog: AttendanceLog) => {
    setLogs(prev => {
      const filtered = prev.filter(
        log => !(log.user_id === nextLog.user_id && log.session_id === nextLog.session_id),
      );
      return [...filtered, nextLog];
    });
  };

  const handleSaveCheckInSettings = (session: Session) => {
    const settings = checkInSettings[session.id] ?? makeSessionSettings(session);
    startTransition(async () => {
      const result = await updateSessionCheckInSettings({
        sessionId: session.id,
        startsAt: localInputToIso(settings.startsAt),
        checkInOpensAt: localInputToIso(settings.opensAt),
        checkInClosesAt: localInputToIso(settings.closesAt),
        selfCheckInEnabled: settings.enabled,
      });

      if (!result.success) {
        alert(result.error ?? "출석 체크 설정 저장 중 오류가 발생했습니다.");
        return;
      }

      setSessions(prev => prev.map(item => item.id === session.id ? { ...item, ...result.data.session } : item));
    });
  };

  const handleGenerateCheckInCode = (session: Session) => {
    startTransition(async () => {
      const result = await generateAttendanceCheckInCode(session.id);
      if (!result.success) {
        alert(result.error ?? "출석 코드 생성 중 오류가 발생했습니다.");
        return;
      }

      setGeneratedCheckIns(prev => ({
        ...prev,
        [session.id]: {
          sessionId: session.id,
          code: result.data.code,
          checkInUrl: result.data.checkInUrl,
        },
      }));
      setSessions(prev => prev.map(item => item.id === session.id ? { ...item, ...result.data.session } : item));
      setCheckInSettings(prev => ({
        ...prev,
        [session.id]: {
          ...(prev[session.id] ?? makeSessionSettings(session)),
          enabled: true,
        },
      }));
    });
  };

  const handleCloseCheckIn = (session: Session) => {
    startTransition(async () => {
      const result = await closeSessionCheckIn(session.id);
      if (!result.success) {
        alert(result.error ?? "출석 체크 닫기 중 오류가 발생했습니다.");
        return;
      }

      setSessions(prev => prev.map(item => item.id === session.id ? { ...item, self_check_in_enabled: false } : item));
      setCheckInSettings(prev => ({
        ...prev,
        [session.id]: {
          ...(prev[session.id] ?? makeSessionSettings(session)),
          enabled: false,
        },
      }));
      setGeneratedCheckIns(prev => {
        const next = { ...prev };
        delete next[session.id];
        return next;
      });
    });
  };

  const handleCopy = (value: string) => {
    void navigator.clipboard.writeText(value);
    alert("복사되었습니다.");
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

    if (isToggleOff) {
      startTransition(async () => {
        const result = await deleteAttendance(userId, sessionId);
        if (!result.success) {
          alert(result.error ?? "출석 상태 변경 중 오류가 발생했습니다.");
          return;
        }
        setLogs(prev => prev.filter(l => !(l.user_id === userId && l.session_id === sessionId)));
      });
      return;
    }

    if (status === "present") {
      startTransition(async () => {
        const result = await markAttendance(userId, sessionId, status);
        if (!result.success) {
          alert(result.error ?? "출석 상태 변경 중 오류가 발생했습니다.");
          return;
        }
        replaceAttendanceLog(result.data.log);
      });
      return;
    }

    // 결석/공결/지각 — 모달 열기
    const learner = learners.find(l => l.id === userId);
    const existingNotes = current?.notes || "";
    setReasonText(existingNotes);
    setReasonModal({ open: true, userId, sessionId, status, userName: learner?.name ?? "" });
  };

  const handleSaveReason = () => {
    if (!reasonModal) return;
    const { userId, sessionId, status } = reasonModal;
    const notes = reasonText.trim() || null;
    startTransition(async () => {
      const result = await markAttendance(userId, sessionId, status, notes);
      if (!result.success) {
        alert(result.error ?? "출석 상태 변경 중 오류가 발생했습니다.");
        return;
      }
      replaceAttendanceLog(result.data.log);
      setReasonModal(null);
      setReasonText("");
    });
  };

  useEffect(() => {
    if (!reasonModal?.open && !viewNotesModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReasonModal(null);
        setReasonText("");
        setViewNotesModal(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reasonModal?.open, viewNotesModal]);

  const handleMarkAllPresent = async (sessionId: string) => {
    if (!isAdminOrPreneur) return;
    if (!confirm("전원 출석으로 변경하시겠습니까?")) return;
    startTransition(async () => {
      const result = await markAllPresent(sessionId);
      if (!result.success) {
        alert(result.error ?? "전원 출석 처리 중 오류가 발생했습니다.");
        return;
      }
      setLogs(prev => {
        const filtered = prev.filter(l => l.session_id !== sessionId);
        return [...filtered, ...result.data.logs];
      });
    });
  };

  const handleAddSession = () => {
    const title = newSessionTitle.trim() || `${sessions.length + 1}주차`;
    const date = new Date().toISOString().split('T')[0];
    startTransition(async () => {
      const result = await createSession(title, date);
      if (!result.success) {
        alert(result.error ?? "세션 추가 중 오류가 발생했습니다.");
        return;
      }
      if (result.data?.session) {
        setSessions(prev => [...prev, {
          id: result.data.session.id,
          title: result.data.session.title,
          date: result.data.session.date
        }]);
        setCheckInSettings(prev => ({
          ...prev,
          [result.data.session.id]: makeSessionSettings({
            id: result.data.session.id,
            title: result.data.session.title,
            date: result.data.session.date,
          }),
        }));
      }
      setNewSessionTitle("");
    });
  };

  const handleDeleteSession = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    startTransition(async () => {
      const result = await deleteSession(id);
      if (!result.success) {
        alert(result.error ?? "세션 삭제 중 오류가 발생했습니다.");
        return;
      }
      setSessions(prev => prev.filter(s => s.id !== id));
      setLogs(prev => prev.filter(l => l.session_id !== id));
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

      {isAdminOrPreneur && (
        <AttendanceSessionCheckInPanel
          sessions={sessions}
          checkInSettings={checkInSettings}
          generatedCheckIns={generatedCheckIns}
          isPending={isPending}
          onCloseCheckIn={handleCloseCheckIn}
          onCopy={handleCopy}
          onGenerateCode={handleGenerateCheckInCode}
          onSaveSettings={handleSaveCheckInSettings}
          onUpdateSetting={updateCheckInSetting}
        />
      )}

      {isAdminOrPreneur && sessions.length > 0 && (
        <div className="flex flex-wrap gap-2 md:hidden">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 rounded-md border border-[#ddd9cc] bg-white px-3 py-1.5">
              <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">{s.title}</span>
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
          ))}
        </div>
      )}

      <div
        className="hidden max-w-full overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white md:block"
        data-testid="admin-attendance-desktop-grid"
      >
        <table className="min-w-max table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[240px]" />
            {sessions.map(session => (
              <col key={session.id} className="w-[132px]" />
            ))}
            {!hideHomework && homeworks.map(homework => (
              <col key={homework.id} className="w-[112px]" />
            ))}
          </colgroup>
          <thead className="bg-[#f0efe6] text-left">
            <tr>
              <th className="sticky left-0 z-30 w-[240px] min-w-[240px] max-w-[240px] bg-[#f0efe6] px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                러너
              </th>

              {sessions.map(s => (
                <th key={s.id} className="w-[132px] min-w-[132px] max-w-[132px] px-3 py-3 text-center font-['Pretendard',sans-serif] text-sm font-semibold">
                  <div className="truncate" title={s.title}>{s.title}</div>
                  {isAdminOrPreneur && (
                    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                      <button
                        onClick={() => handleMarkAllPresent(s.id)}
                        disabled={isPending}
                        className="whitespace-nowrap font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F] hover:underline disabled:opacity-50"
                      >
                        전원 출석
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        disabled={isPending}
                        className="whitespace-nowrap font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] hover:underline disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </th>
              ))}

              {!hideHomework && homeworks.map((h, i) => (
                <th key={h.id} className="w-[112px] min-w-[112px] max-w-[112px] px-3 py-3 text-center font-['Pretendard',sans-serif] text-sm font-semibold">
                  {i + 1}주차 과제
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...learners].sort((a, b) => a.name.localeCompare(b.name, "ko")).map(learner => {
              const stats = calculateStats(learner.id);
              return (
                <tr key={learner.id} className="border-t border-[#ece8db] transition-colors hover:bg-[#fcfcf8] group text-center">
                  <td className="sticky left-0 z-20 w-[240px] min-w-[240px] max-w-[240px] bg-white px-4 py-3 text-left group-hover:bg-[#fcfcf8]">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                        {learner.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]" title={learner.name}>{learner.name}</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-['Pretendard',sans-serif] text-xs tabular-nums text-[#6b6b5e]">
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
                    const currentStatus = getAttendanceStatus(learner.id, session.id);
                    const cellLog = logs.find(l => l.user_id === learner.id && l.session_id === session.id);
                    return (
                      <td key={session.id} className="w-[132px] min-w-[132px] max-w-[132px] px-2 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {STATUS_OPTS.map(opt => {
                            const isActive = currentStatus === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleUpdateStatus(learner.id, session.id, opt.key)}
                                disabled={!isAdminOrPreneur || isPending}
                                aria-label={`${learner.name} ${session.title} ${STATUS_LABELS[opt.key]} 처리`}
                                aria-pressed={isActive}
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-['Pretendard',sans-serif] text-xs font-semibold transition-colors ${
                                  isActive
                                    ? `${opt.active} ${opt.text} ${opt.border}`
                                    : `bg-white text-[#ddd9cc] border-[#ece8db] ${opt.hover}`
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        {cellLog?.notes && (
                          <div className="mt-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => setViewNotesModal({
                                userName: learner.name,
                                sessionTitle: session.title,
                                notes: cellLog.notes ?? "",
                              })}
                              className="inline-flex items-center rounded-sm text-[#6b6b5e] transition-colors hover:text-[#16140f]"
                              aria-label={`${learner.name} ${session.title} 사유 보기`}
                            >
                              <MessageSquareText
                                className="h-3 w-3 text-[#6b6b5e]"
                                strokeWidth={1.5}
                              />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {!hideHomework && homeworks.map(homework => {
                    const isCompleted = getHomeworkStatus(learner.id, homework.id);
                    return (
                      <td key={homework.id} className="w-[112px] min-w-[112px] max-w-[112px] px-2 py-3">
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

      <div className="space-y-3 md:hidden">
        {[...learners].sort((a, b) => a.name.localeCompare(b.name, "ko")).map(learner => {
          const stats = calculateStats(learner.id);
          return (
            <div key={learner.id} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                  {learner.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-['Pretendard',sans-serif] text-xs tabular-nums text-[#6b6b5e]">
                    <span className="text-[#2f9e44]">출 {stats.present}</span>
                    <span className="text-[#FF6C0F]">지 {stats.late}</span>
                    <span className="text-[#b42318]">결 {stats.absent}</span>
                    <span className="text-[#2563EB]">공 {stats.excused}</span>
                    {!hideHomework && <span className="text-[#2563EB]">과제 {stats.homework}/{homeworks.length}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {sessions.map(session => {
                  const currentStatus = getAttendanceStatus(learner.id, session.id);
                  const cellLog = logs.find(l => l.user_id === learner.id && l.session_id === session.id);
                  return (
                    <div key={session.id} className="flex items-center justify-between rounded-md bg-[#f5f5ee] px-3 py-2">
                      <span className="font-['Pretendard',sans-serif] text-xs font-medium text-[#4a4a40]">{session.title}</span>
                      <div className="flex items-center gap-1.5">
                        {STATUS_OPTS.map(opt => {
                          const isActive = currentStatus === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleUpdateStatus(learner.id, session.id, opt.key)}
                              disabled={!isAdminOrPreneur || isPending}
                              aria-label={`${learner.name} ${session.title} ${STATUS_LABELS[opt.key]} 처리`}
                              aria-pressed={isActive}
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border font-['Pretendard',sans-serif] text-sm font-semibold transition-colors ${
                                isActive
                                  ? `${opt.active} ${opt.text} ${opt.border}`
                                  : `bg-white text-[#ddd9cc] border-[#ece8db] ${opt.hover}`
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                        {cellLog?.notes && (
                          <button
                            type="button"
                            onClick={() => setViewNotesModal({
                              userName: learner.name,
                              sessionTitle: session.title,
                              notes: cellLog.notes ?? "",
                            })}
                            className="ml-1 inline-flex items-center rounded-sm text-[#6b6b5e] transition-colors hover:text-[#16140f]"
                            aria-label={`${learner.name} ${session.title} 사유 보기`}
                          >
                            <MessageSquareText className="h-3.5 w-3.5 text-[#6b6b5e]" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hideHomework && homeworks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {homeworks.map((homework, i) => {
                    const isCompleted = getHomeworkStatus(learner.id, homework.id);
                    return (
                      <div key={homework.id} className="flex items-center justify-between rounded-md bg-[#f5f5ee] px-3 py-2">
                        <span className="font-['Pretendard',sans-serif] text-xs font-medium text-[#4a4a40]">{i + 1}주차 과제</span>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-md font-['Pretendard',sans-serif] text-sm font-semibold ${
                            isCompleted ? "bg-[#2563EB] text-white" : "bg-white text-[#ddd9cc] border border-[#ece8db]"
                          }`}
                        >
                          {isCompleted ? "✓" : "-"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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

      {viewNotesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setViewNotesModal(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg border border-[#ddd9cc] bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {viewNotesModal.userName} — {viewNotesModal.sessionTitle} 사유
            </h3>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              저장된 출석 사유입니다.
            </p>
            <p className="mt-3 whitespace-pre-wrap font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              {viewNotesModal.notes}
            </p>
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewNotesModal(null)}
                className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {reasonModal?.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setReasonModal(null); setReasonText(""); }}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-lg border border-[#ddd9cc] bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {reasonModal.userName} — {STATUS_LABELS[reasonModal.status]} 사유
            </h3>
            <p className="mb-3 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              사유를 입력하지 않아도 저장할 수 있습니다.
            </p>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="사유를 입력하세요 (선택)"
              className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 resize-none"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => { setReasonModal(null); setReasonText(""); }}
                className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
              >
                취소
              </button>
              <button
                onClick={handleSaveReason}
                disabled={isPending}
                className="inline-flex h-8 items-center rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/80 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
