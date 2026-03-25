"use server";

import { revalidatePath, unstable_noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

/**
 * Fetches all necessary data for the attendance & homework tracker.
 * If the user is an Admin/Preneur, fetches all runners.
 * If the user is a Runner, fetches only their own data.
 */
export async function getTrackerData() {
  unstable_noStore();
  const { profile } = await requireRole("runner");
  const supabase = await createClient();

  const isAdminOrPreneur = profile?.role === "admin" || profile?.role === "preneur";

  // 1. Fetch Runners
  let runnersQuery = supabase
    .from("profiles")
    .select("id, name, role, username")
    .eq("role", "runner");
  
  if (!isAdminOrPreneur) {
    runnersQuery = runnersQuery.eq("id", profile!.id);
  }

  const { data: runners, error: runnersError } = await runnersQuery;
  if (runnersError) throw new Error(`Failed to fetch runners: ${runnersError.message}`);

  // 2. Fetch Attendance Sessions (All)
  const { data: sessions, error: sessionsError } = await supabase
    .from("attendance_sessions")
    .select("*")
    .order("date", { ascending: true });
  if (sessionsError) throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);

  // 3. Fetch Homeworks (All)
  const { data: homeworks, error: hwError } = await supabase
    .from("homeworks")
    .select("id, title, is_individual, is_team")
    .order("created_at", { ascending: true });
  if (hwError) throw new Error(`Failed to fetch homeworks: ${hwError.message}`);

  // 4. Fetch Attendance Logs
  let logsQuery = supabase.from("attendance_logs").select("*");
  if (!isAdminOrPreneur) {
    logsQuery = logsQuery.eq("user_id", profile!.id);
  }
  const { data: logs } = await logsQuery;

  // 5. Fetch Homework Submissions
  let subsQuery = supabase.from("homework_submissions").select("*");
  if (!isAdminOrPreneur) {
    subsQuery = subsQuery.eq("user_id", profile!.id);
  }
  const { data: submissions } = await subsQuery;

  return {
    runners,
    sessions,
    homeworks,
    logs: logs || [],
    submissions: submissions || [],
    isAdminOrPreneur
  };
}

/**
 * Mark attendance for a user.
 */
export async function markAttendance(
  userId: string,
  sessionId: string,
  status: "present" | "absent" | "late" | "excused"
) {
  await requireRole("preneur"); // Admin or Preneur
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendance_logs")
    .upsert({
      user_id: userId,
      session_id: sessionId,
      status,
    }, {
      onConflict: "user_id,session_id"
    });

  if (error) throw new Error(`Failed to mark attendance: ${error.message}`);
  revalidatePath("/admin/attendance");
  revalidatePath("/dashboard/attendance");
  return { success: true };
}

/**
 * Remove attendance log for a user in a session (toggle-off).
 */
export async function deleteAttendance(userId: string, sessionId: string) {
  await requireRole("preneur");
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendance_logs")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (error) throw new Error(`Failed to delete attendance: ${error.message}`);
  revalidatePath("/admin/attendance");
  revalidatePath("/dashboard/attendance");
  return { success: true };
}

/**
 * Runners mark their own homework as completed.
 */
export async function toggleHomeworkSubmission(homeworkId: string, completed: boolean) {
  const { user } = await requireRole("runner");
  const supabase = await createClient();

  if (completed) {
    const { error } = await supabase
      .from("homework_submissions")
      .upsert({
        user_id: user.id,
        homework_id: homeworkId,
        status: "completed",
        submitted_at: new Date().toISOString()
      }, {
        onConflict: "user_id,homework_id"
      });
    if (error) throw new Error(`Failed to submit homework: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("homework_submissions")
      .delete()
      .eq("user_id", user.id)
      .eq("homework_id", homeworkId);
    if (error) throw new Error(`Failed to remove submission: ${error.message}`);
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/dashboard/homework");
  return { success: true };
}

/**
 * Admins/Preneurs toggle homework status for a specific user.
 */
export async function toggleHomeworkStatusForUser(userId: string, homeworkId: string, completed: boolean) {
  await requireRole("preneur");
  const supabase = await createClient();

  if (completed) {
    const { error } = await supabase
      .from("homework_submissions")
      .upsert({
        user_id: userId,
        homework_id: homeworkId,
        status: "completed",
        submitted_at: new Date().toISOString()
      }, {
        onConflict: "user_id,homework_id"
      });
    if (error) throw new Error(`Failed to update homework: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("homework_submissions")
      .delete()
      .eq("user_id", userId)
      .eq("homework_id", homeworkId);
    if (error) throw new Error(`Failed to remove homework status: ${error.message}`);
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  return { success: true };
}
/**
 * Bulk sync padlet status mappings to homework_submissions table.
 */
export async function syncHomeworkSubmissions(homeworkId: string, submissionsData: { user_id: string; status: string }[]) {
  await requireRole("preneur");
  const supabase = await createClient();

  if (submissionsData.length === 0) return { success: true };

  const records = submissionsData.map(s => ({
    homework_id: homeworkId,
    user_id: s.user_id,
    status: s.status,
    submitted_at: s.status === "completed" ? new Date().toISOString() : undefined
  }));

  const { error } = await supabase
    .from("homework_submissions")
    .upsert(records, { onConflict: "homework_id,user_id" });

  if (error) throw new Error(`Failed to sync homework submissions: ${error.message}`);
  
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  return { success: true };
}


/**
 * Creates a new attendance session.
 */
export async function createSession(title: string, date: string) {
  await requireRole("preneur");
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return { success: false, error: "세션 제목을 입력해주세요." };
  if (trimmedTitle.length > 255) return { success: false, error: "세션 제목이 너무 깁니다." };
  const trimmedDate = date?.trim();
  if (!trimmedDate) return { success: false, error: "날짜를 입력해주세요." };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({ title: trimmedTitle, date: trimmedDate })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/dashboard/attendance");
  return { success: true, session: data as { id: string; title: string; date: string; created_at: string } };
}

/**
 * Deletes an attendance session.
 */
export async function deleteSession(id: string) {
  await requireRole("preneur");
  if (!id?.trim()) return { success: false, error: "세션 ID가 필요합니다." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendance_sessions")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete session: ${error.message}`);
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/dashboard/attendance");
  return { success: true };
}

/**
 * Marks all runners as present for a specific session.
 */
export async function markAllPresent(sessionId: string) {
  await requireRole("preneur");
  if (!sessionId?.trim()) return { success: false, error: "세션 ID가 필요합니다." };
  const supabase = await createClient();

  const { data: runners } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "runner");

  if (!runners) return { success: false };

  const logs = runners.map(r => ({
    user_id: r.id,
    session_id: sessionId,
    status: "present",
  }));

  const { error } = await supabase
    .from("attendance_logs")
    .upsert(logs, { onConflict: "user_id,session_id" });

  if (error) throw new Error(`Failed to batch mark attendance: ${error.message}`);
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/dashboard/attendance");
  return { success: true };
}
