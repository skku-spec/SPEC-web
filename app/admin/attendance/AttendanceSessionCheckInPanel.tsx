"use client";

import Link from "next/link";
import { Copy, Monitor, Power, QrCode, RefreshCw, Save } from "lucide-react";

import { AttendanceQr } from "@/components/dashboard/AttendanceQr";

export type AttendancePanelSession = {
  id: string;
  title: string;
  date: string;
  starts_at?: string | null;
  check_in_opens_at?: string | null;
  check_in_closes_at?: string | null;
  self_check_in_enabled?: boolean;
};

export type GeneratedCheckIn = {
  sessionId: string;
  code: string;
  checkInUrl: string;
};

export type CheckInSettings = {
  startsAt: string;
  opensAt: string;
  closesAt: string;
  enabled: boolean;
};

type AttendanceSessionCheckInPanelProps = {
  sessions: AttendancePanelSession[];
  checkInSettings: Record<string, CheckInSettings>;
  generatedCheckIns: Record<string, GeneratedCheckIn>;
  isPending: boolean;
  onUpdateSetting: (sessionId: string, key: keyof CheckInSettings, value: string | boolean) => void;
  onSaveSettings: (session: AttendancePanelSession) => void;
  onGenerateCode: (session: AttendancePanelSession) => void;
  onCloseCheckIn: (session: AttendancePanelSession) => void;
  onCopy: (value: string) => void;
};

function fallbackSettings(session: AttendancePanelSession): CheckInSettings {
  return {
    startsAt: session.starts_at ?? "",
    opensAt: session.check_in_opens_at ?? "",
    closesAt: session.check_in_closes_at ?? "",
    enabled: Boolean(session.self_check_in_enabled),
  };
}

export function AttendanceSessionCheckInPanel({
  sessions,
  checkInSettings,
  generatedCheckIns,
  isPending,
  onUpdateSetting,
  onSaveSettings,
  onGenerateCode,
  onCloseCheckIn,
  onCopy,
}: AttendanceSessionCheckInPanelProps) {
  if (sessions.length === 0) return null;

  const secondaryButtonClass =
    "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50";
  const primaryButtonClass =
    "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/80 disabled:opacity-50";

  return (
    <section data-testid="attendance-session-controls" className="grid min-w-0 gap-3 lg:grid-cols-2">
      {sessions.map((session) => {
        const settings = checkInSettings[session.id] ?? fallbackSettings(session);
        const generated = generatedCheckIns[session.id];

        return (
          <article key={session.id} className="min-w-0 rounded-lg border border-[#ddd9cc] bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  {session.title}
                </p>
                <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{session.date}</p>
              </div>
              <span
                className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                  settings.enabled ? "bg-[#E6F9E6] text-[#2f9e44]" : "bg-[#f0efe6] text-[#6b6b5e]"
                }`}
              >
                {settings.enabled ? "열림" : "닫힘"}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <label className="block min-w-0">
                <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">시작</span>
                <input
                  type="datetime-local"
                  value={settings.startsAt}
                  onChange={(event) => onUpdateSetting(session.id, "startsAt", event.target.value)}
                  className="mt-1 w-full min-w-0 rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </label>
              <label className="block min-w-0">
                <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">오픈</span>
                <input
                  type="datetime-local"
                  value={settings.opensAt}
                  onChange={(event) => onUpdateSetting(session.id, "opensAt", event.target.value)}
                  className="mt-1 w-full min-w-0 rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </label>
              <label className="block min-w-0">
                <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">마감</span>
                <input
                  type="datetime-local"
                  value={settings.closesAt}
                  onChange={(event) => onUpdateSetting(session.id, "closesAt", event.target.value)}
                  className="mt-1 w-full min-w-0 rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(event) => onUpdateSetting(session.id, "enabled", event.target.checked)}
                  className="h-4 w-4 rounded border-[#ddd9cc] text-[#FF6C0F] focus:ring-[#FF6C0F]/20"
                />
                <span className="font-['Pretendard',sans-serif] text-sm font-medium text-[#4a4a40]">활성</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSaveSettings(session)}
                  disabled={isPending}
                  className={secondaryButtonClass}
                >
                  <Save className="h-4 w-4 shrink-0" strokeWidth={2} />
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => onGenerateCode(session)}
                  disabled={isPending}
                  className={primaryButtonClass}
                >
                  {generated ? (
                    <RefreshCw className="h-4 w-4 shrink-0" strokeWidth={2} />
                  ) : (
                    <QrCode className="h-4 w-4 shrink-0" strokeWidth={2} />
                  )}
                  {generated ? "재발급" : "코드 발급"}
                </button>
                <button
                  type="button"
                  onClick={() => onCloseCheckIn(session)}
                  disabled={isPending}
                  className={secondaryButtonClass}
                >
                  <Power className="h-4 w-4 shrink-0" strokeWidth={2} />
                  닫기
                </button>
              </div>
            </div>

            <div className="mt-4 min-w-0">
              {generated ? (
                <div className="grid min-w-0 gap-3 sm:grid-cols-[auto,minmax(0,1fr)]">
                  <AttendanceQr
                    sessionId={generated.sessionId}
                    code={generated.code}
                    checkInUrl={generated.checkInUrl}
                  />
                  <div className="flex min-w-0 flex-wrap items-start gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => onCopy(generated.checkInUrl)}
                      className={secondaryButtonClass}
                    >
                      <Copy className="h-4 w-4 shrink-0" strokeWidth={2} />
                      링크 복사
                    </button>
                    <Link
                      href={`/admin/attendance/sessions/${session.id}/check-in-board?code=${generated.code}`}
                      className={secondaryButtonClass}
                    >
                      <Monitor className="h-4 w-4 shrink-0" strokeWidth={2} />
                      보드 열기
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">발급 전</p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
