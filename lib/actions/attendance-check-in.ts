"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import {
  buildAttendanceCheckInUrl,
  classifyAttendanceCheckIn,
  createAttendanceCode,
  hashAttendanceCode,
  normalizeAttendanceCode,
  type AttendanceCheckInMethod,
  type AttendanceSelfStatus,
} from "@/lib/attendance-check-in-utils";

type AttendanceSessionRow = Database["public"]["Tables"]["attendance_sessions"]["Row"];
type AttendanceLogRow = Database["public"]["Tables"]["attendance_logs"]["Row"];
type AttendanceCheckInRow = Database["public"]["Tables"]["attendance_session_check_ins"]["Row"];
type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
const MAX_FAILED_CHECK_IN_ATTEMPTS = 5;
const CHECK_IN_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

type PublicCheckInSession = Pick<
  AttendanceSessionRow,
  "id" | "title" | "date" | "starts_at" | "check_in_opens_at" | "check_in_closes_at" | "self_check_in_enabled"
>;

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export type SelfCheckInPayload = {
  sessionId: string;
  code: string;
  method: AttendanceCheckInMethod;
};

export type SessionCheckInSettingsPayload = {
  sessionId: string;
  startsAt: string | null;
  checkInOpensAt: string | null;
  checkInClosesAt: string | null;
  selfCheckInEnabled: boolean;
};

export type LearnerCheckInState = {
  session: PublicCheckInSession | null;
  existingLog: Pick<
    AttendanceLogRow,
    "id" | "session_id" | "status" | "source" | "checked_in_at" | "admin_overridden_at" | "check_in_method"
  > | null;
  prefilledCode: string;
  classification:
    | { kind: "ready"; status: AttendanceSelfStatus }
    | { kind: "disabled" | "missing_start" | "too_early" | "closed"; message: string }
    | null;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function validateSessionId(sessionId: string): string | null {
  const trimmed = sessionId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalIso(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toPublicSession(session: AttendanceSessionRow): PublicCheckInSession {
  return {
    id: session.id,
    title: session.title,
    date: session.date,
    starts_at: session.starts_at,
    check_in_opens_at: session.check_in_opens_at,
    check_in_closes_at: session.check_in_closes_at,
    self_check_in_enabled: session.self_check_in_enabled,
  };
}

function toLearnerLog(log: AttendanceLogRow | null): LearnerCheckInState["existingLog"] {
  if (!log) return null;
  return {
    id: log.id,
    session_id: log.session_id,
    status: log.status,
    source: log.source,
    checked_in_at: log.checked_in_at,
    admin_overridden_at: log.admin_overridden_at,
    check_in_method: log.check_in_method,
  };
}

async function fetchSessionForCheckIn(
  adminSupabase: SupabaseAdminClient,
  sessionId: string,
): Promise<ActionResult<{ session: AttendanceSessionRow; checkIn: AttendanceCheckInRow }>> {
  const { data: session, error: sessionError } = await adminSupabase
    .from("attendance_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return { success: false, error: `세션을 불러오지 못했습니다: ${sessionError.message}` };
  }

  if (!session) {
    return { success: false, error: "출석 세션을 찾을 수 없습니다." };
  }

  const { data: checkIn, error: checkInError } = await adminSupabase
    .from("attendance_session_check_ins")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (checkInError) {
    return { success: false, error: `출석 코드를 확인하지 못했습니다: ${checkInError.message}` };
  }

  if (!checkIn) {
    return { success: false, error: "이 세션에는 발급된 출석 코드가 없습니다." };
  }

  return { success: true, data: { session, checkIn } };
}

async function getRecentFailedAttemptCount(
  adminSupabase: SupabaseAdminClient,
  sessionId: string,
  userId: string,
): Promise<ActionResult<{ count: number }>> {
  const windowStart = new Date(Date.now() - CHECK_IN_ATTEMPT_WINDOW_MS).toISOString();
  const { count, error } = await adminSupabase
    .from("attendance_check_in_attempts")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("outcome", "failed")
    .gte("attempted_at", windowStart);

  if (error) {
    return { success: false, error: `출석 시도 기록을 확인하지 못했습니다: ${error.message}` };
  }

  return { success: true, data: { count: count ?? 0 } };
}

async function recordCheckInAttempt(
  adminSupabase: SupabaseAdminClient,
  sessionId: string,
  userId: string,
  method: AttendanceCheckInMethod,
  outcome: "failed" | "success",
): Promise<ActionResult<{ recorded: true }>> {
  const { error } = await adminSupabase
    .from("attendance_check_in_attempts")
    .insert({
      session_id: sessionId,
      user_id: userId,
      method,
      outcome,
      attempted_at: new Date().toISOString(),
    });

  if (error) {
    return { success: false, error: `출석 시도 기록을 저장하지 못했습니다: ${error.message}` };
  }

  return { success: true, data: { recorded: true } };
}

async function deleteSessionCheckInCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const { error } = await supabase.from("attendance_session_check_ins").delete().eq("session_id", sessionId);

  if (error) {
    return { success: false, error: `출석 코드를 정리하지 못했습니다: ${error.message}` };
  }

  return { success: true, data: { deleted: true } };
}

export async function generateAttendanceCheckInCode(
  sessionId: string,
): Promise<ActionResult<{ code: string; checkInUrl: string; session: PublicCheckInSession }>> {
  try {
    await requireAdmin();
    const trimmedSessionId = validateSessionId(sessionId);
    if (!trimmedSessionId) return { success: false, error: "세션 ID가 필요합니다." };

    const code = createAttendanceCode();
    const nowIso = new Date().toISOString();
    const supabase = await createClient();
    const { data: existingSession, error: existingSessionError } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", trimmedSessionId)
      .single();

    if (existingSessionError) {
      return { success: false, error: `출석 세션을 불러오지 못했습니다: ${existingSessionError.message}` };
    }

    const { error: codeError } = await supabase
      .from("attendance_session_check_ins")
      .upsert(
        {
          session_id: trimmedSessionId,
          code_hash: hashAttendanceCode(code),
          created_at: nowIso,
          expires_at: existingSession.check_in_closes_at,
        },
        { onConflict: "session_id" },
      );

    if (codeError) {
      return { success: false, error: `출석 코드를 저장하지 못했습니다: ${codeError.message}` };
    }

    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .update({ self_check_in_enabled: true })
      .eq("id", trimmedSessionId)
      .select("*")
      .single();

    if (sessionError) {
      const cleanupResult = await deleteSessionCheckInCode(supabase, trimmedSessionId);
      if (!cleanupResult.success) {
        return {
          success: false,
          error: `출석 세션을 열지 못했습니다: ${sessionError.message} (${cleanupResult.error})`,
        };
      }
      return { success: false, error: `출석 세션을 열지 못했습니다: ${sessionError.message}` };
    }

    revalidatePath("/admin/attendance");
    revalidatePath("/dashboard/attendance");

    return {
      success: true,
      data: {
        code,
        checkInUrl: buildAttendanceCheckInUrl(getSiteUrl(), trimmedSessionId, code),
        session: toPublicSession(session),
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

export async function updateSessionCheckInSettings(
  payload: SessionCheckInSettingsPayload,
): Promise<ActionResult<{ session: PublicCheckInSession }>> {
  try {
    await requireAdmin();
    const trimmedSessionId = validateSessionId(payload.sessionId);
    if (!trimmedSessionId) return { success: false, error: "세션 ID가 필요합니다." };

    const startsAt = normalizeOptionalIso(payload.startsAt);
    const opensAt = normalizeOptionalIso(payload.checkInOpensAt);
    const closesAt = normalizeOptionalIso(payload.checkInClosesAt);

    if (payload.startsAt && !startsAt) return { success: false, error: "세션 시작 시간이 올바르지 않습니다." };
    if (payload.checkInOpensAt && !opensAt) return { success: false, error: "출석 시작 시간이 올바르지 않습니다." };
    if (payload.checkInClosesAt && !closesAt) return { success: false, error: "출석 종료 시간이 올바르지 않습니다." };

    if (opensAt && closesAt && new Date(opensAt).getTime() >= new Date(closesAt).getTime()) {
      return { success: false, error: "출석 종료 시간은 시작 시간보다 늦어야 합니다." };
    }

    const supabase = await createClient();
    const { data: session, error } = await supabase
      .from("attendance_sessions")
      .update({
        starts_at: startsAt,
        check_in_opens_at: opensAt,
        check_in_closes_at: closesAt,
        self_check_in_enabled: payload.selfCheckInEnabled,
      })
      .eq("id", trimmedSessionId)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: `출석 설정을 저장하지 못했습니다: ${error.message}` };
    }

    if (!payload.selfCheckInEnabled) {
      const { error: deleteCodeError } = await supabase
        .from("attendance_session_check_ins")
        .delete()
        .eq("session_id", trimmedSessionId);

      if (deleteCodeError) {
        return { success: false, error: `출석 코드를 닫지 못했습니다: ${deleteCodeError.message}` };
      }
    }

    revalidatePath("/admin/attendance");
    revalidatePath("/dashboard/attendance");

    return { success: true, data: { session: toPublicSession(session) } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

export async function closeSessionCheckIn(sessionId: string): Promise<ActionResult<{ sessionId: string }>> {
  try {
    await requireAdmin();
    const trimmedSessionId = validateSessionId(sessionId);
    if (!trimmedSessionId) return { success: false, error: "세션 ID가 필요합니다." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ self_check_in_enabled: false })
      .eq("id", trimmedSessionId);

    if (error) {
      return { success: false, error: `출석 체크를 닫지 못했습니다: ${error.message}` };
    }

    const { error: deleteCodeError } = await supabase
      .from("attendance_session_check_ins")
      .delete()
      .eq("session_id", trimmedSessionId);

    if (deleteCodeError) {
      return { success: false, error: `출석 코드를 닫지 못했습니다: ${deleteCodeError.message}` };
    }

    revalidatePath("/admin/attendance");
    revalidatePath("/dashboard/attendance");

    return { success: true, data: { sessionId: trimmedSessionId } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

export async function getLearnerAttendanceCheckInState(
  sessionId?: string,
  code?: string,
): Promise<ActionResult<LearnerCheckInState>> {
  try {
    const { user } = await requireRole("learner");
    const supabase = await createClient();
    const trimmedSessionId = sessionId?.trim();
    const prefilledCode = normalizeAttendanceCode(code ?? "");

    let session: AttendanceSessionRow | null = null;

    if (trimmedSessionId) {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("id", trimmedSessionId)
        .maybeSingle();

      if (error) return { success: false, error: `세션을 불러오지 못했습니다: ${error.message}` };
      session = data;
    } else {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("self_check_in_enabled", true)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { success: false, error: `출석 가능한 세션을 불러오지 못했습니다: ${error.message}` };
      session = data;
    }

    if (!session) {
      return {
        success: true,
        data: { session: null, existingLog: null, prefilledCode, classification: null },
      };
    }

    const { data: existingLog, error: existingLogError } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_id", session.id)
      .maybeSingle();

    if (existingLogError) {
      return { success: false, error: `기존 출석 기록을 확인하지 못했습니다: ${existingLogError.message}` };
    }

    return {
      success: true,
      data: {
        session: toPublicSession(session),
        existingLog: toLearnerLog(existingLog),
        prefilledCode,
        classification: classifyAttendanceCheckIn(session),
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

export async function selfCheckInAttendance(
  payload: SelfCheckInPayload,
): Promise<ActionResult<{ status: AttendanceSelfStatus; checkedInAt: string; sessionTitle: string }>> {
  try {
    const { user } = await requireRole("learner");
    const trimmedSessionId = validateSessionId(payload.sessionId);
    if (!trimmedSessionId) return { success: false, error: "세션 ID가 필요합니다." };

    const code = normalizeAttendanceCode(payload.code);
    if (code.length !== 6) return { success: false, error: "6자리 출석 코드를 입력해주세요." };
    if (payload.method !== "qr" && payload.method !== "code") {
      return { success: false, error: "출석 방식이 올바르지 않습니다." };
    }

    const adminSupabase = createAdminClient();
    const sessionResult = await fetchSessionForCheckIn(adminSupabase, trimmedSessionId);
    if (!sessionResult.success) return sessionResult;
    const { session, checkIn } = sessionResult.data;

    const attemptsResult = await getRecentFailedAttemptCount(adminSupabase, trimmedSessionId, user.id);
    if (!attemptsResult.success) return attemptsResult;
    if (attemptsResult.data.count >= MAX_FAILED_CHECK_IN_ATTEMPTS) {
      return { success: false, error: "출석 코드 입력 횟수가 많습니다. 잠시 후 다시 시도해주세요." };
    }

    if (hashAttendanceCode(code) !== checkIn.code_hash) {
      const recordResult = await recordCheckInAttempt(adminSupabase, trimmedSessionId, user.id, payload.method, "failed");
      if (!recordResult.success) return recordResult;
      return { success: false, error: "출석 코드가 올바르지 않습니다." };
    }

    const classification = classifyAttendanceCheckIn(session);
    if (classification.kind !== "ready") {
      return { success: false, error: classification.message };
    }

    const { data: existingLog, error: existingError } = await adminSupabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_id", trimmedSessionId)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: `기존 출석 기록을 확인하지 못했습니다: ${existingError.message}` };
    }

    if (existingLog?.source === "admin") {
      return { success: false, error: "이미 운영진이 출석 상태를 기록했습니다." };
    }

    if (existingLog) {
      return { success: false, error: "이미 출석 체크가 완료되었습니다." };
    }

    const nowIso = new Date().toISOString();
    const { data: insertedLog, error: insertError } = await adminSupabase
      .from("attendance_logs")
      .insert({
        user_id: user.id,
        session_id: trimmedSessionId,
        status: classification.status,
        notes: null,
        source: "self",
        checked_in_at: nowIso,
        check_in_method: payload.method,
        admin_overridden_at: null,
      })
      .select("*")
      .single();

    if (insertError) {
      return { success: false, error: `출석 체크에 실패했습니다: ${insertError.message}` };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/attendance");
    revalidatePath("/admin/attendance");

    return {
      success: true,
      data: {
        status: insertedLog.status === "late" ? "late" : "present",
        checkedInAt: insertedLog.checked_in_at ?? nowIso,
        sessionTitle: session.title,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}
