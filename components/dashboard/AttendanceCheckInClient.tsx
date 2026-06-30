"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Clock, QrCode } from "lucide-react";

import { selfCheckInAttendance, type LearnerCheckInState } from "@/lib/actions/attendance-check-in";

type AttendanceCheckInClientProps = {
  initialState: LearnerCheckInState;
  initialCode?: string;
};

function statusLabel(status: string | null | undefined): string {
  if (status === "present") return "출석";
  if (status === "late") return "지각";
  if (status === "absent") return "결석";
  if (status === "excused") return "공결";
  return "기록됨";
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AttendanceCheckInClient({ initialState, initialCode = "" }: AttendanceCheckInClientProps) {
  const [code, setCode] = useState(initialCode);
  const [message, setMessage] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const session = initialState.session;
  const existingLog = initialState.existingLog;
  const isReady = initialState.classification?.kind === "ready";
  const method = useMemo(() => (initialCode ? "qr" : "code"), [initialCode]);

  const handleSubmit = () => {
    if (!session || isPending) return;
    setMessage(null);
    setSuccessStatus(null);

    startTransition(async () => {
      const result = await selfCheckInAttendance({
        sessionId: session.id,
        code,
        method,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setSuccessStatus(statusLabel(result.data.status));
      setMessage(`${result.data.sessionTitle} ${statusLabel(result.data.status)} 처리되었습니다.`);
    });
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">출석 체크</h1>
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-[#6b6b5e]" strokeWidth={1.5} />
            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
              열려 있는 출석 세션이 없습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">출석 체크</h1>
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">{session.title}</p>
      </div>

      <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">세션 날짜</p>
            <p className="mt-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{session.date}</p>
          </div>
          <div>
            <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">시작</p>
            <p className="mt-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {formatDateTime(session.starts_at)}
            </p>
          </div>
          <div>
            <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">마감</p>
            <p className="mt-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {formatDateTime(session.check_in_closes_at)}
            </p>
          </div>
        </div>

        {existingLog ? (
          <div className="flex items-center gap-3 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2f9e44]" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                {statusLabel(existingLog.status)} 처리되었습니다.
              </p>
              <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                {existingLog.source === "admin" ? "운영진 기록" : formatDateTime(existingLog.checked_in_at)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">출석 코드</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                placeholder="6자리 코드"
              />
            </label>

            {initialState.classification && initialState.classification.kind !== "ready" ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] px-4 py-3">
                <Clock className="h-4 w-4 shrink-0 text-[#6b6b5e]" strokeWidth={1.5} />
                <p className="min-w-0 break-words font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  {initialState.classification.message}
                </p>
              </div>
            ) : null}

            {message ? (
              <div
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
                  successStatus ? "border-[#ddd9cc] bg-[#E6F9E6]" : "border-[#ddd9cc] bg-[#FEE2E2]"
                }`}
              >
                {successStatus ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2f9e44]" strokeWidth={1.5} />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#b42318]" strokeWidth={1.5} />
                )}
                <p className="min-w-0 break-words font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{message}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isReady || code.length !== 6 || isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#16140f]/80 disabled:opacity-50 sm:w-auto"
            >
              <QrCode className="h-4 w-4 shrink-0" strokeWidth={2} />
              출석 체크
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
