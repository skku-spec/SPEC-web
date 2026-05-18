"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireRole } from "@/lib/auth";

/**
 * Fetches all necessary data for the attendance & homework tracker.
 * If the user is an Admin/Preneur, fetches all learners.
 * If the user is a Runner, fetches only their own data.
 */
export async function getTrackerData() {
  try {
    const { profile } = await requireRole("learner");
    const supabase = await createClient();

    const currentLearner = profile
      ? {
          id: profile.id,
          name: profile.name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          username: profile.username,
        }
      : null;

    const isAdminOrPreneur = profile?.is_admin || profile?.role === "preneur";

    let learnersQuery = supabase
      .from("profiles")
      .select("id, name, first_name, last_name, role, username")
      .eq("role", "learner");

    if (!isAdminOrPreneur) {
      learnersQuery = learnersQuery.eq("id", profile!.id);
    } else {
      // Admin view: only include profiles that still have an active members entry
      const { data: activeMembers } = await supabase
        .from("members")
        .select("public_profile_id")
        .not("public_profile_id", "is", null);

      const activeProfileIds = (activeMembers ?? [])
        .map((m) => m.public_profile_id)
        .filter(Boolean) as string[];

      if (activeProfileIds.length === 0) {
        learnersQuery = learnersQuery.in("id", ["__none__"]); // return empty
      } else {
        learnersQuery = learnersQuery.in("id", activeProfileIds);
      }
    }

    const { data: learners, error: learnersError } = await learnersQuery;
    if (learnersError) return { success: false as const, error: `런너 목록을 불러오지 못했습니다: ${learnersError.message}` };

    const { data: sessions, error: sessionsError } = await supabase
      .from("attendance_sessions")
      .select("*")
      .order("date", { ascending: true });
    if (sessionsError) return { success: false as const, error: `세션 목록을 불러오지 못했습니다: ${sessionsError.message}` };

    const { data: homeworks, error: hwError } = await supabase
      .from("homeworks")
      .select("id, title, is_individual, is_team, padlet_board_id, submission_link, individual_content, team_content, due_date, created_at, section_type_config")
      .order("created_at", { ascending: true });
    if (hwError) return { success: false as const, error: `과제 목록을 불러오지 못했습니다: ${hwError.message}` };

    let logsQuery = supabase.from("attendance_logs").select("*");
    if (!isAdminOrPreneur) {
      logsQuery = logsQuery.eq("user_id", profile!.id);
    }
    const { data: logs } = await logsQuery;

    let subsQuery = supabase.from("homework_submissions").select("*");
    if (!isAdminOrPreneur) {
      subsQuery = subsQuery.eq("user_id", profile!.id);
    }
    const { data: submissions } = await subsQuery;

    let sectionSubsQuery = supabase
      .from("homework_section_submissions")
      .select("homework_id, user_id, section_id, is_completed");
    if (!isAdminOrPreneur) {
      sectionSubsQuery = sectionSubsQuery.eq("user_id", profile!.id);
    }
    const { data: sectionSubmissions, error: sectionSubsError } = await sectionSubsQuery;

    return {
      success: true as const,
      data: {
        currentLearner,
        learners,
        sessions,
        homeworks,
        logs: logs || [],
        submissions: submissions || [],
        sectionSubmissions: sectionSubsError ? [] : (sectionSubmissions || []),
        isAdminOrPreneur,
      },
    };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * Mark attendance for a user.
 */
export async function markAttendance(
  userId: string,
  sessionId: string,
  status: "present" | "absent" | "late" | "excused",
  notes?: string | null
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const payload = {
      user_id: userId,
      session_id: sessionId,
      status,
      notes: status === "present" ? null : (notes?.trim() || null),
    };

    let { error } = await supabase
      .from("attendance_logs")
      .upsert(payload, {
        onConflict: "user_id,session_id"
      });

    const isNotesSchemaError =
      !!error &&
      /notes/i.test(error.message) &&
      /(column|schema cache|could not find)/i.test(error.message);

    if (isNotesSchemaError) {
      const retry = await supabase
        .from("attendance_logs")
        .upsert({
          user_id: userId,
          session_id: sessionId,
          status,
        }, {
          onConflict: "user_id,session_id"
        });

      error = retry.error;
    }

    if (error) return { success: false as const, error: `출석 처리에 실패했습니다: ${error.message}` };
    revalidatePath("/admin/attendance");
    revalidatePath("/dashboard/attendance");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * Remove attendance log for a user in a session (toggle-off).
 */
export async function deleteAttendance(userId: string, sessionId: string) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("attendance_logs")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (error) return { success: false as const, error: `출석 기록 삭제에 실패했습니다: ${error.message}` };
    revalidatePath("/admin/attendance");
    revalidatePath("/dashboard/attendance");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * Runners mark their own homework as completed.
 */
export async function toggleHomeworkSubmission(homeworkId: string, completed: boolean) {
  try {
    const { user } = await requireRole("learner");
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
      if (error) return { success: false as const, error: `과제 제출에 실패했습니다: ${error.message}` };
    } else {
      const { error } = await supabase
        .from("homework_submissions")
        .delete()
        .eq("user_id", user.id)
        .eq("homework_id", homeworkId);
      if (error) return { success: false as const, error: `과제 제출 취소에 실패했습니다: ${error.message}` };
    }

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/dashboard/homework");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * Admins/Preneurs toggle homework status for a specific user.
 */
export async function toggleHomeworkStatusForUser(userId: string, homeworkId: string, completed: boolean) {
  try {
    await requireAdmin();
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
      if (error) return { success: false as const, error: `과제 상태 변경에 실패했습니다: ${error.message}` };
    } else {
      const { error } = await supabase
        .from("homework_submissions")
        .delete()
        .eq("user_id", userId)
        .eq("homework_id", homeworkId);
      if (error) return { success: false as const, error: `과제 상태 초기화에 실패했습니다: ${error.message}` };
    }

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * Fetch all per-item submission records for a homework.
 * Returns rows keyed by (user_id, item_type, item_index).
 */
export async function getHomeworkSectionSubmissions(homeworkId: string) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("homework_section_submissions")
      .select("user_id, section_id, is_completed")
      .eq("homework_id", homeworkId);
    if (error) return { success: false as const, error: error.message };
    return { success: true as const, data: data ?? [] };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류" };
  }
}

/**
 * Bulk upsert per-item submission records (used for Padlet auto-sync).
 */
export async function bulkUpsertHomeworkSectionSubmissions(
  records: { homework_id: string; user_id: string; section_id: string; is_completed: boolean }[]
) {
  try {
    await requireAdmin();
    if (records.length === 0) return { success: true as const };
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("homework_section_submissions")
      .upsert(
        records.map(r => ({ ...r, updated_at: now })),
        { onConflict: "user_id,homework_id,section_id" }
      );
    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류" };
  }
}

/**
 * Upsert a single per-section submission record.
 */
export async function upsertHomeworkSectionSubmission(
  homeworkId: string,
  userId: string,
  sectionId: string,
  isCompleted: boolean
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from("homework_section_submissions")
      .upsert(
        { homework_id: homeworkId, user_id: userId, section_id: sectionId, is_completed: isCompleted, updated_at: new Date().toISOString() },
        { onConflict: "user_id,homework_id,section_id" }
      );
    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류" };
  }
}

/**
 * Bulk sync padlet status mappings to homework_submissions table.
 */
export async function syncHomeworkSubmissions(homeworkId: string, submissionsData: { user_id: string; status: string }[]) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    if (submissionsData.length === 0) return { success: true as const };

    const userIds = submissionsData.map(s => s.user_id);
    const { data: existing } = await supabase
      .from("homework_submissions")
      .select("user_id, status, submitted_at")
      .eq("homework_id", homeworkId)
      .in("user_id", userIds);

    const existingMap = new Map(
      (existing ?? []).map(e => [e.user_id, e])
    );

    const now = new Date().toISOString();
    const records = submissionsData.map(s => {
      const prev = existingMap.get(s.user_id);
      const preservedAt = prev?.status === "completed" ? prev.submitted_at : undefined;
      return {
        homework_id: homeworkId,
        user_id: s.user_id,
        status: s.status,
        submitted_at: s.status === "completed"
          ? (preservedAt ?? now)
          : undefined,
      };
    });

    const { error } = await supabase
      .from("homework_submissions")
      .upsert(records, { onConflict: "homework_id,user_id" });

    if (error) return { success: false as const, error: `과제 제출 현황 동기화에 실패했습니다: ${error.message}` };

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}


/**
 * Creates a new attendance session.
 */
export async function createSession(title: string, date: string) {
  try {
    await requireAdmin();
    const trimmedTitle = title?.trim();
    if (!trimmedTitle) return { success: false as const, error: "세션 제목을 입력해주세요." };
    if (trimmedTitle.length > 255) return { success: false as const, error: "세션 제목이 너무 깁니다." };
    const trimmedDate = date?.trim();
    if (!trimmedDate) return { success: false as const, error: "날짜를 입력해주세요." };
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({ title: trimmedTitle, date: trimmedDate })
      .select()
      .single();

    if (error) return { success: false as const, error: `세션 생성에 실패했습니다: ${error.message}` };
    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/dashboard/attendance");
    return { success: true as const, data: { session: data as { id: string; title: string; date: string; created_at: string } } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * Deletes an attendance session.
 */
export async function deleteSession(id: string) {
  try {
    await requireAdmin();
    if (!id?.trim()) return { success: false as const, error: "세션 ID가 필요합니다." };
    const supabase = await createClient();

    const { error } = await supabase
      .from("attendance_sessions")
      .delete()
      .eq("id", id);

    if (error) return { success: false as const, error: `세션 삭제에 실패했습니다: ${error.message}` };
    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/dashboard/attendance");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * Marks all learners as present for a specific session.
 */
export async function markAllPresent(sessionId: string) {
  try {
    await requireAdmin();
    if (!sessionId?.trim()) return { success: false as const, error: "세션 ID가 필요합니다." };
    const supabase = await createClient();

    const { data: learners } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "learner");

    if (!learners) return { success: false as const, error: "런너 목록을 불러오지 못했습니다." };

    const logs = learners.map(r => ({
      user_id: r.id,
      session_id: sessionId,
      status: "present",
    }));

    const { error } = await supabase
      .from("attendance_logs")
      .upsert(logs, { onConflict: "user_id,session_id" });

    if (error) return { success: false as const, error: `전원 출석 처리에 실패했습니다: ${error.message}` };
    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/dashboard/attendance");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

export async function upsertHomework(payload: {
  id?: string;
  title: string;
  submission_link: string | null;
  padlet_board_id: string | null;
  individual_content: string[];
  team_content: string[];
  is_individual: boolean;
  is_team: boolean;
  due_date: string | null;
  section_type_config?: Record<string, { type: "individual" } | { type: "team"; task_index: number }>;
}) {
  try {
    await requireAdmin();
    const trimmedTitle = payload.title?.trim();
    if (!trimmedTitle) return { success: false as const, error: "과제 제목을 입력해주세요." };
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("homeworks")
      .upsert(
        {
          ...(payload.id ? { id: payload.id } : {}),
          title: trimmedTitle,
          submission_link: payload.submission_link,
          padlet_board_id: payload.padlet_board_id,
          individual_content: payload.individual_content,
          team_content: payload.team_content,
          is_individual: payload.is_individual,
          is_team: payload.is_team,
          due_date: payload.due_date,
          ...(payload.section_type_config !== undefined ? { section_type_config: payload.section_type_config } : {}),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) return { success: false as const, error: `과제 저장에 실패했습니다: ${error.message}` };
    revalidatePath("/admin/homework");
    revalidatePath("/dashboard/homework");
    return { success: true as const, data };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}

export async function replaceHomeworkTeams(
  homeworkId: string,
  teams: { teamName: string; memberIds: string[]; taskIndex: number }[]
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("homework_team_assignments")
      .delete()
      .eq("homework_id", homeworkId);

    if (deleteError) return { success: false as const, error: `팀 배정 초기화에 실패했습니다: ${deleteError.message}` };

    if (teams.length === 0) return { success: true as const };

    const assignments = teams.flatMap(t =>
      t.memberIds.map(mId => ({
        homework_id: homeworkId,
        user_id: mId,
        team_name: t.teamName,
        task_index: t.taskIndex,
      }))
    );

    if (assignments.length === 0) return { success: true as const };

    const { error: insertError } = await supabase
      .from("homework_team_assignments")
      .insert(assignments);

    if (insertError) return { success: false as const, error: `팀 배정 저장에 실패했습니다: ${insertError.message}` };
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}
