import { createHash, randomInt } from "crypto";

export const ATTENDANCE_CHECK_IN_WINDOW_MINUTES = 15;

export type AttendanceCheckInMethod = "qr" | "code";
export type AttendanceSelfStatus = "present" | "late";

export type CheckInSessionForClassification = {
  starts_at: string | null;
  check_in_opens_at: string | null;
  check_in_closes_at: string | null;
  self_check_in_enabled: boolean;
};

export type AttendanceCheckInClassification =
  | { kind: "ready"; status: AttendanceSelfStatus }
  | { kind: "disabled"; message: string }
  | { kind: "missing_start"; message: string }
  | { kind: "too_early"; message: string }
  | { kind: "closed"; message: string };

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeAttendanceCode(code: string): string {
  return code.replace(/\D/g, "").slice(0, 6);
}

export function createAttendanceCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashAttendanceCode(code: string): string {
  return createHash("sha256").update(normalizeAttendanceCode(code)).digest("hex");
}

export function buildAttendanceCheckInPath(sessionId: string, code: string): string {
  const params = new URLSearchParams({
    session: sessionId,
    code: normalizeAttendanceCode(code),
  });
  return `/dashboard/attendance/check-in?${params.toString()}`;
}

export function buildAttendanceCheckInUrl(baseUrl: string, sessionId: string, code: string): string {
  return new URL(buildAttendanceCheckInPath(sessionId, code), baseUrl).toString();
}

export function classifyAttendanceCheckIn(
  session: CheckInSessionForClassification,
  now: Date = new Date(),
): AttendanceCheckInClassification {
  if (!session.self_check_in_enabled) {
    return { kind: "disabled", message: "이 세션의 출석 체크가 열려 있지 않습니다." };
  }

  const startsAt = parseDate(session.starts_at);
  if (!startsAt) {
    return { kind: "missing_start", message: "세션 시작 시간이 설정되어 있지 않습니다." };
  }

  const opensAt = parseDate(session.check_in_opens_at);
  if (opensAt && now.getTime() < opensAt.getTime()) {
    return { kind: "too_early", message: "아직 출석 체크가 시작되지 않았습니다." };
  }

  const defaultClosesAt = startsAt.getTime() + ATTENDANCE_CHECK_IN_WINDOW_MINUTES * 60 * 1000;
  const configuredClosesAt = parseDate(session.check_in_closes_at);
  const closesAt = configuredClosesAt ?? new Date(defaultClosesAt);
  if (now.getTime() > closesAt.getTime()) {
    return { kind: "closed", message: "출석 체크 시간이 종료되었습니다." };
  }

  if (now.getTime() <= startsAt.getTime()) {
    return { kind: "ready", status: "present" };
  }

  return { kind: "ready", status: "late" };
}
