"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, requireAdmin, requireAuth, requireRole } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AttendanceLogRow = Database["public"]["Tables"]["attendance_logs"]["Row"];
type TrackerAttendanceLog = Pick<AttendanceLogRow, "id" | "session_id" | "user_id" | "status" | "notes">;
type TrackerHomework = Pick<
  Database["public"]["Tables"]["homeworks"]["Row"],
  "id" | "title" | "padlet_board_id" | "is_team" | "due_date" | "section_type_config"
>;
type TrackerLearner = { id: string; name: string | null; username: string | null };
type PadletResource = {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
};
type PadletSection = { id: string; title: string };
type PadletPost = {
  id: string;
  author?: { name?: string; email?: string; username?: string };
  section_id?: string;
};
type HomeworkTeamAssignment = {
  team_name: string;
  user_id: string;
  task_index: number;
};

function shouldSyncPadletHomework(
  hw: TrackerHomework,
  lastSyncMap: Map<string, string>,
) {
  if (!hw.padlet_board_id) return false;
  const lastSync = lastSyncMap.get(hw.id);
  if (!lastSync) return true;

  const lastSyncMs = new Date(lastSync).getTime();
  if (!Number.isFinite(lastSyncMs) || lastSyncMs > Date.now()) return true;
  if (lastSyncMs > Date.now() - 5 * 60 * 1000) return false;

  if (!hw.due_date) return true;
  return new Date(hw.due_date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
}

async function syncPadletBoardForHomework(
  supabase: SupabaseServerClient,
  hw: TrackerHomework,
  learners: TrackerLearner[],
) {
  if (!hw.padlet_board_id) return;
  const apiKey = process.env.PADLET_API_KEY;
  if (!apiKey) return;

  const res = await fetch(
    `https://api.padlet.dev/v1/boards/${hw.padlet_board_id}?include=posts,sections`,
    {
      headers: {
        "X-Api-Key": apiKey,
        "Accept": "application/vnd.api+json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    console.error(`Padlet API error for homework ${hw.id}: ${res.status}`);
    return;
  }

  const json = (await res.json()) as { included?: PadletResource[] };
  const included = json.included || [];
  const resourceMap = new Map(included.map((resource) => [`${resource.type}:${resource.id}`, resource]));

  const sections: PadletSection[] = included
    .filter((resource) => resource.type === "section")
    .map((resource) => ({
      id: resource.id,
      title: (resource.attributes?.title as string) || "(섹션 없음)",
    }));

  const posts: PadletPost[] = included
    .filter((resource) => resource.type === "post")
    .map((resource) => {
      let authorName: string | undefined;
      let authorEmail: string | undefined;
      let authorUsername: string | undefined;

      const attrAuthor = resource.attributes?.author as Record<string, unknown> | undefined;
      if (attrAuthor) {
        authorName = (attrAuthor.fullName as string) || (attrAuthor.name as string) || (attrAuthor.shortName as string);
        authorEmail = attrAuthor.email as string | undefined;
        authorUsername = attrAuthor.username as string | undefined;
      } else {
        const authorRel = resource.relationships?.author as { data?: { type: string; id: string } | null } | undefined;
        if (authorRel?.data) {
          const authorResource = resourceMap.get(`${authorRel.data.type}:${authorRel.data.id}`);
          const attrs = authorResource?.attributes || {};
          authorName = (attrs.fullName as string) || (attrs.name as string) || (attrs.display_name as string);
          authorEmail = attrs.email as string | undefined;
          authorUsername = attrs.username as string | undefined;
        }
      }

      const sectionRel = resource.relationships?.section as { data?: { type: string; id: string } | null } | undefined;
      return {
        id: resource.id,
        author: authorName || authorEmail || authorUsername
          ? { name: authorName, email: authorEmail, username: authorUsername }
          : undefined,
        section_id: sectionRel?.data?.id,
      };
    });

  const { data: hwTeams } = await supabase
    .from("homework_team_assignments")
    .select("team_name,user_id,task_index")
    .eq("homework_id", hw.id);

  const teamsList = (hwTeams || []) as HomeworkTeamAssignment[];
  const learnerLookup = new Map(learners.map((learner) => [learner.id, learner]));
  const learnerTeamMap = new Map<string, { teamName: string; memberNames: string[]; memberUsernames: string[] }>();

  if (hw.is_team && teamsList.length > 0) {
    for (const assignment of teamsList) {
      const teamMembers = teamsList.filter((member) => member.team_name === assignment.team_name && member.task_index === assignment.task_index);
      learnerTeamMap.set(`${assignment.user_id}:${assignment.task_index}`, {
        teamName: assignment.team_name,
        memberNames: teamMembers.map((member) => learnerLookup.get(member.user_id)?.name || ""),
        memberUsernames: teamMembers.map((member) => learnerLookup.get(member.user_id)?.username || ""),
      });
    }
  }

  const getSectionConfig = (sectionId: string) => {
    const config = (hw.section_type_config as Record<string, { type: string; task_index?: number } | undefined>) || {};
    if (config[sectionId]) return config[sectionId];
    if (hw.is_team) return { type: "team", task_index: 0 };
    return { type: "individual" };
  };

  const anyPostedInSection = (targetNames: string[], targetUsernames: string[], sectionId: string | undefined) =>
    posts.some((post) => {
      const sectionMatches = sectionId ? post.section_id === sectionId : !post.section_id;
      if (!sectionMatches) return false;

      const authorName = (post.author?.name || "").toLowerCase();
      const authorUsername = (post.author?.username || "").toLowerCase().replace(/^@/, "");
      const matchesName = targetNames.some((name) => {
        const normalizedName = name.toLowerCase();
        return normalizedName && (authorName.includes(normalizedName) || normalizedName.includes(authorName));
      });
      const matchesUsername = targetUsernames.some((username) => {
        const normalizedUsername = username.toLowerCase().replace(/^@/, "");
        return normalizedUsername && authorUsername === normalizedUsername;
      });

      return matchesName || matchesUsername;
    });

  const { data: overrides } = await supabase
    .from("homework_section_submissions")
    .select("user_id, section_id")
    .eq("homework_id", hw.id)
    .eq("is_override", true);

  const overrideSet = new Set(overrides?.map((override) => `${override.user_id}:${override.section_id}`) || []);
  const records = learners.flatMap((learner) =>
    sections.flatMap((section) => {
      if (overrideSet.has(`${learner.id}:${section.id}`)) return [];
      const sectionConfig = getSectionConfig(section.id);
      const teamInfo = sectionConfig.type === "team" ? learnerTeamMap.get(`${learner.id}:${sectionConfig.task_index ?? 0}`) : null;
      const isCompleted = teamInfo
        ? anyPostedInSection(teamInfo.memberNames, teamInfo.memberUsernames, section.id)
        : anyPostedInSection([learner.name || ""], [learner.username || ""], section.id);

      return [{
        homework_id: hw.id,
        user_id: learner.id,
        section_id: section.id,
        is_completed: isCompleted,
        is_override: false,
        updated_at: new Date().toISOString(),
      }];
    }),
  );

  if (records.length === 0) return;
  const { error } = await supabase
    .from("homework_section_submissions")
    .upsert(records, { onConflict: "user_id,homework_id,section_id" });

  if (error) {
    console.error(`Padlet sync upsert error for homework ${hw.id}:`, error.message);
  }
}

async function syncActivePadletBoardsInBackground(
  supabase: SupabaseServerClient,
  homeworks: TrackerHomework[],
  learners: TrackerLearner[],
  sectionSubmissions: Array<{ homework_id: string; updated_at?: string | null }> | null | undefined,
) {
  const lastSyncMap = new Map<string, string>();
  for (const submission of sectionSubmissions ?? []) {
    if (submission.updated_at && !lastSyncMap.has(submission.homework_id)) {
      lastSyncMap.set(submission.homework_id, submission.updated_at);
    }
  }

  const activeHomeworks = homeworks.filter((homework) => shouldSyncPadletHomework(homework, lastSyncMap));
  if (activeHomeworks.length === 0 || learners.length === 0) return;

  await Promise.all(
    activeHomeworks.map((homework) =>
      syncPadletBoardForHomework(supabase, homework, learners).catch((error) => {
        console.error(`Padlet sync error for homework ${homework.id}:`, error);
      }),
    ),
  );
}

/**
 * Fetches all necessary data for the attendance & homework tracker.
 * If the user is an Admin/Preneur, fetches all learners.
 * If the user is a Runner, fetches only their own data.
 */
export async function getTrackerData() {
  try {
    const { profile } = await requireAuth();
    const isAdminOrPreneur = profile?.is_admin === true || normalizeRole(profile?.role) === "preneur";

    if (!isAdminOrPreneur) {
      await requireRole("learner");
    }

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

    let logsQuery = supabase.from("attendance_logs").select("*");
    if (!isAdminOrPreneur) {
      logsQuery = logsQuery.eq("user_id", profile!.id);
    }

    let subsQuery = supabase.from("homework_submissions").select("*");
    if (!isAdminOrPreneur) {
      subsQuery = subsQuery.eq("user_id", profile!.id);
    }

    let sectionSubsQuery = supabase
      .from("homework_section_submissions")
      .select("homework_id, user_id, section_id, is_completed, updated_at");
    if (!isAdminOrPreneur) {
      sectionSubsQuery = sectionSubsQuery.eq("user_id", profile!.id);
    }

    const [
      { data: learners, error: learnersError },
      { data: sessions, error: sessionsError },
      { data: homeworks, error: hwError },
      { data: logs },
      { data: submissions },
      { data: sectionSubmissions, error: sectionSubsError },
    ] = await Promise.all([
      learnersQuery,
      supabase
        .from("attendance_sessions")
        .select("id, title, date, starts_at, check_in_opens_at, check_in_closes_at, self_check_in_enabled, created_at")
        .order("date", { ascending: true }),
      supabase
        .from("homeworks")
        .select("id, title, is_individual, is_team, padlet_board_id, submission_link, individual_content, team_content, due_date, created_at, section_type_config")
        .order("created_at", { ascending: true }),
      logsQuery,
      subsQuery,
      sectionSubsQuery,
    ]);

    if (learnersError) return { success: false as const, error: `런너 목록을 불러오지 못했습니다: ${learnersError.message}` };
    if (sessionsError) return { success: false as const, error: `세션 목록을 불러오지 못했습니다: ${sessionsError.message}` };
    if (hwError) return { success: false as const, error: `과제 목록을 불러오지 못했습니다: ${hwError.message}` };

    if (isAdminOrPreneur) {
      void syncActivePadletBoardsInBackground(
        supabase,
        (homeworks ?? []) as TrackerHomework[],
        (learners ?? []) as TrackerLearner[],
        sectionSubmissions,
      );
    }

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
    const nowIso = new Date().toISOString();
    const payload = {
      user_id: userId,
      session_id: sessionId,
      status,
      notes: status === "present" ? null : (notes?.trim() || null),
      source: "admin",
      admin_overridden_at: nowIso,
      check_in_method: null,
    };

    let { data: savedLog, error } = await supabase
      .from("attendance_logs")
      .upsert(payload, {
        onConflict: "user_id,session_id"
      })
      .select("id,user_id,session_id,status,notes")
      .single();

    const isLegacyAttendanceSchemaError =
      !!error &&
      /(notes|source|admin_overridden_at|check_in_method)/i.test(error.message) &&
      /(column|schema cache|could not find)/i.test(error.message);

    if (isLegacyAttendanceSchemaError) {
      const retry = await supabase
        .from("attendance_logs")
        .upsert({
          user_id: userId,
          session_id: sessionId,
          status,
        }, {
          onConflict: "user_id,session_id"
        })
        .select("id,user_id,session_id,status")
        .single();

      error = retry.error;
      savedLog = retry.data ? { ...retry.data, notes: null } : null;
    }

    if (error) return { success: false as const, error: `출석 처리에 실패했습니다: ${error.message}` };
    if (!savedLog) return { success: false as const, error: "저장된 출석 기록을 확인하지 못했습니다." };
    revalidatePath("/admin/attendance");
    revalidatePath("/dashboard/attendance");
    return { success: true as const, data: { log: savedLog as TrackerAttendanceLog } };
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
      .select("user_id, section_id, is_completed, is_override")
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

    // Fetch existing overrides for these homeworks to prevent overwriting them
    const hwIds = Array.from(new Set(records.map(r => r.homework_id)));
    const { data: overrides } = await supabase
      .from("homework_section_submissions")
      .select("homework_id, user_id, section_id")
      .in("homework_id", hwIds)
      .eq("is_override", true);

    const overrideSet = new Set(
      overrides?.map(o => `${o.homework_id}:${o.user_id}:${o.section_id}`) || []
    );

    // Filter out overridden records
    const filteredRecords = records.filter(
      r => !overrideSet.has(`${r.homework_id}:${r.user_id}:${r.section_id}`)
    );

    if (filteredRecords.length === 0) return { success: true as const };

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("homework_section_submissions")
      .upsert(
        filteredRecords.map(r => ({ ...r, is_override: false, updated_at: now })),
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
        { 
          homework_id: homeworkId, 
          user_id: userId, 
          section_id: sectionId, 
          is_completed: isCompleted, 
          is_override: true, 
          updated_at: new Date().toISOString() 
        },
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
    if (learners.length === 0) return { success: true as const, data: { logs: [] as TrackerAttendanceLog[] } };

    const nowIso = new Date().toISOString();
    const logs = learners.map(r => ({
      user_id: r.id,
      session_id: sessionId,
      status: "present",
      notes: null,
      source: "admin",
      admin_overridden_at: nowIso,
      check_in_method: null,
    }));

    let { data: savedLogs, error } = await supabase
      .from("attendance_logs")
      .upsert(logs, { onConflict: "user_id,session_id" })
      .select("id,user_id,session_id,status,notes");

    const isLegacyAttendanceSchemaError =
      !!error &&
      /(notes|source|admin_overridden_at|check_in_method)/i.test(error.message) &&
      /(column|schema cache|could not find)/i.test(error.message);

    if (isLegacyAttendanceSchemaError) {
      const retry = await supabase
        .from("attendance_logs")
        .upsert(
          learners.map(r => ({
            user_id: r.id,
            session_id: sessionId,
            status: "present",
          })),
          { onConflict: "user_id,session_id" },
        )
        .select("id,user_id,session_id,status");

      error = retry.error;
      savedLogs = retry.data?.map(log => ({ ...log, notes: null })) ?? null;
    }

    if (error) return { success: false as const, error: `전원 출석 처리에 실패했습니다: ${error.message}` };
    if (!savedLogs) return { success: false as const, error: "저장된 출석 기록을 확인하지 못했습니다." };
    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/dashboard/attendance");
    return { success: true as const, data: { logs: savedLogs as TrackerAttendanceLog[] } };
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
