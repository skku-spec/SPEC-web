"use server";

import { revalidatePath } from "next/cache";

import { logAuditEvent } from "@/lib/helpers/audit-log";
import { SPEC_LOG_WRITER_ROLES, type UserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { isValidUUID } from "@/lib/validators";

type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type SpecEventRow = Database["public"]["Tables"]["spec_events"]["Row"];
type SpecEventInsert = Database["public"]["Tables"]["spec_events"]["Insert"];
type SpecEventUpdate = Database["public"]["Tables"]["spec_events"]["Update"];
type SpecLogRow = Database["public"]["Tables"]["spec_logs"]["Row"];
type SpecLogInsert = Database["public"]["Tables"]["spec_logs"]["Insert"];
type SpecLogImageInsert = Database["public"]["Tables"]["spec_log_images"]["Insert"];

type EventPayload = {
  title: string;
  description: string;
  batch: string;
  status: string;
  start_date: string;
  end_date: string;
};

type EventWithMeta = SpecEventRow & {
  creator: { id: string; name: string } | null;
  logCount: number;
  participantCount: number;
  recentAuthors: { name: string }[];
};

type LogReactionSummary = {
  emoji: string;
  count: number;
  userIds: string[];
};

type LogWithMeta = SpecLogRow & {
  author: { id: string; name: string };
  imageUrls: string[];
  commentCount: number;
  reactionSummary: LogReactionSummary[];
};

const WRITER_ROLES = new Set<UserRole>(SPEC_LOG_WRITER_ROLES);

async function getAuthenticatedProfile(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`인증에 실패했습니다: ${userError.message}`);
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`사용자 정보 확인에 실패했습니다: ${profileError.message}`);
  }

  if (!profile) {
    throw new Error("사용자 프로필을 찾을 수 없습니다.");
  }

  return {
    userId: user.id,
    role: profile.role as UserRole,
    name: profile.name,
    is_admin: profile.is_admin,
  };
}

function requireRole(role: UserRole, allowedRoles: Set<UserRole>, message: string) {
  if (!allowedRoles.has(role)) {
    throw new Error(message);
  }
}

function extractStoragePath(imageUrl: string): string | null {
  if (!imageUrl) {
    return null;
  }

  const normalized = imageUrl.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("images/")) {
    return normalized;
  }

  const withoutLeadingSlash = normalized.replace(/^\/+/, "");
  if (withoutLeadingSlash.startsWith("spec-log-images/")) {
    return withoutLeadingSlash.slice("spec-log-images/".length);
  }

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized);
      const marker = "/spec-log-images/";
      const markerIndex = parsed.pathname.indexOf(marker);
      if (markerIndex >= 0) {
        return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
      }
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    } catch {
      return null;
    }
  }

  return withoutLeadingSlash;
}

async function deleteStorageImages(supabase: SupabaseClient, imageUrls: string[]) {
  const uniquePaths = Array.from(
    new Set(
      imageUrls
        .map((url) => extractStoragePath(url))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (uniquePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from("spec-log-images").remove(uniquePaths);

  if (error) {
    throw new Error(`이미지 파일 삭제에 실패했습니다: ${error.message}`);
  }
}

function trimEventData(data: Partial<EventPayload>): SpecEventUpdate {
  const payload: SpecEventUpdate = {};

  if (data.title !== undefined) {
    payload.title = data.title.trim();
  }
  if (data.description !== undefined) {
    payload.description = data.description.trim();
  }
  if (data.batch !== undefined) {
    payload.batch = data.batch.trim();
  }
  if (data.status !== undefined) {
    payload.status = data.status.trim();
  }
  if (data.start_date !== undefined) {
    payload.start_date = data.start_date;
  }
  if (data.end_date !== undefined) {
    payload.end_date = data.end_date;
  }

  return payload;
}

export async function getEventsByBatch(batch: string): Promise<ActionResult<EventWithMeta[]>> {
  try {
    const supabase = await createClient();

    const { data: events, error: eventsError } = await supabase
      .from("spec_events")
      .select("*")
      .eq("batch", batch)
      .order("start_date", { ascending: false });

    if (eventsError) {
      throw new Error(`이벤트 조회에 실패했습니다: ${eventsError.message}`);
    }

    const safeEvents = events ?? [];
    const eventIds = safeEvents.map((event) => event.id);

    if (eventIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data: logs, error: logsError } = await supabase
      .from("spec_logs")
      .select("event_id, author_id, created_at")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });

    if (logsError) {
      throw new Error(`로그 집계 조회에 실패했습니다: ${logsError.message}`);
    }

    const safeLogs = logs ?? [];
    const logCountMap = new Map<string, number>();
    const participantMap = new Map<string, Set<string>>();
    const recentAuthorIdsMap = new Map<string, string[]>();

    for (const log of safeLogs) {
      logCountMap.set(log.event_id, (logCountMap.get(log.event_id) ?? 0) + 1);

      const participantSet = participantMap.get(log.event_id) ?? new Set<string>();
      participantSet.add(log.author_id);
      participantMap.set(log.event_id, participantSet);

      const recentAuthorIds = recentAuthorIdsMap.get(log.event_id) ?? [];
      if (!recentAuthorIds.includes(log.author_id) && recentAuthorIds.length < 4) {
        recentAuthorIds.push(log.author_id);
        recentAuthorIdsMap.set(log.event_id, recentAuthorIds);
      }
    }

    const profileIds = new Set<string>();
    for (const event of safeEvents) {
      if (event.created_by) {
        profileIds.add(event.created_by);
      }
      for (const authorId of recentAuthorIdsMap.get(event.id) ?? []) {
        profileIds.add(authorId);
      }
    }

    const profileIdList = Array.from(profileIds);
    const profileNameMap = new Map<string, string>();

    if (profileIdList.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", profileIdList);

      if (profilesError) {
        throw new Error(`사용자 정보 조회에 실패했습니다: ${profilesError.message}`);
      }

      for (const profile of profiles ?? []) {
        profileNameMap.set(profile.id, profile.name);
      }
    }

    const result: EventWithMeta[] = safeEvents.map((event) => {
      const recentAuthors = (recentAuthorIdsMap.get(event.id) ?? []).map((authorId) => ({
        name: profileNameMap.get(authorId) ?? "알 수 없음",
      }));

      return {
        ...event,
        creator: event.created_by
          ? {
              id: event.created_by,
              name: profileNameMap.get(event.created_by) ?? "알 수 없음",
            }
          : null,
        logCount: logCountMap.get(event.id) ?? 0,
        participantCount: participantMap.get(event.id)?.size ?? 0,
        recentAuthors,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 목록 조회에 실패했습니다.",
    };
  }
}

export async function getEventById(id: string): Promise<ActionResult<EventWithMeta | null>> {
  try {
    const supabase = await createClient();

    const { data: event, error: eventError } = await supabase
      .from("spec_events")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (eventError) {
      throw new Error(`이벤트 조회에 실패했습니다: ${eventError.message}`);
    }

    if (!event) {
      return { success: true, data: null };
    }

    const { data: logs, error: logsError } = await supabase
      .from("spec_logs")
      .select("author_id, created_at")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    if (logsError) {
      throw new Error(`로그 집계 조회에 실패했습니다: ${logsError.message}`);
    }

    const safeLogs = logs ?? [];
    const participantSet = new Set<string>();
    const recentAuthorIds: string[] = [];

    for (const log of safeLogs) {
      participantSet.add(log.author_id);
      if (!recentAuthorIds.includes(log.author_id) && recentAuthorIds.length < 4) {
        recentAuthorIds.push(log.author_id);
      }
    }

    const profileIds = new Set<string>();
    if (event.created_by) {
      profileIds.add(event.created_by);
    }
    for (const authorId of recentAuthorIds) {
      profileIds.add(authorId);
    }

    const profileNameMap = new Map<string, string>();
    const profileIdList = Array.from(profileIds);

    if (profileIdList.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", profileIdList);

      if (profilesError) {
        throw new Error(`사용자 정보 조회에 실패했습니다: ${profilesError.message}`);
      }

      for (const profile of profiles ?? []) {
        profileNameMap.set(profile.id, profile.name);
      }
    }

    const result: EventWithMeta = {
      ...event,
      creator: event.created_by
        ? {
            id: event.created_by,
            name: profileNameMap.get(event.created_by) ?? "알 수 없음",
          }
        : null,
      logCount: safeLogs.length,
      participantCount: participantSet.size,
      recentAuthors: recentAuthorIds.map((authorId) => ({
        name: profileNameMap.get(authorId) ?? "알 수 없음",
      })),
    };

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 상세 조회에 실패했습니다.",
    };
  }
}

export async function createEvent(data: EventPayload): Promise<ActionResult<SpecEventRow>> {
  try {
    const supabase = await createClient();
    const profile = await getAuthenticatedProfile(supabase);

    if (!profile.is_admin) {
      throw new Error("이벤트 생성 권한이 없습니다.");
    }

    const title = data.title.trim();
    const description = data.description.trim();
    const batch = data.batch.trim();
    const status = data.status.trim();

    if (!title || !batch || !status || !data.start_date || !data.end_date) {
      throw new Error("필수 입력값이 누락되었습니다.");
    }

    const insertPayload: SpecEventInsert = {
      title,
      description,
      batch,
      status,
      start_date: data.start_date,
      end_date: data.end_date,
      created_by: profile.userId,
    };

    const { data: createdEvent, error: createError } = await supabase
      .from("spec_events")
      .insert(insertPayload)
      .select("*")
      .single();

    if (createError) {
      throw new Error(`이벤트 생성에 실패했습니다: ${createError.message}`);
    }

    await logAuditEvent({
      action: "create",
      entityType: "spec_event",
      entityId: createdEvent.id,
      details: {
        title: createdEvent.title,
        batch: createdEvent.batch,
        status: createdEvent.status,
      },
    });

    revalidatePath("/spec-log");

    return { success: true, data: createdEvent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 생성에 실패했습니다.",
    };
  }
}

export async function updateEvent(
  id: string,
  data: Partial<EventPayload>,
): Promise<ActionResult<SpecEventRow>> {
  try {
    const supabase = await createClient();
    const profile = await getAuthenticatedProfile(supabase);

    if (!profile.is_admin) {
      throw new Error("이벤트 수정 권한이 없습니다.");
    }

    const updatePayload = trimEventData(data);
    if (Object.keys(updatePayload).length === 0) {
      throw new Error("수정할 내용이 없습니다.");
    }

    if (updatePayload.title !== undefined && !updatePayload.title) {
      throw new Error("이벤트 제목을 입력해주세요.");
    }
    if (updatePayload.batch !== undefined && !updatePayload.batch) {
      throw new Error("기수를 입력해주세요.");
    }
    if (updatePayload.status !== undefined && !updatePayload.status) {
      throw new Error("상태를 입력해주세요.");
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from("spec_events")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(`이벤트 수정에 실패했습니다: ${updateError.message}`);
    }

    await logAuditEvent({
      action: "update",
      entityType: "spec_event",
      entityId: updatedEvent.id,
      details: {
        updatedFields: Object.keys(updatePayload),
      },
    });

    revalidatePath("/spec-log");

    return { success: true, data: updatedEvent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 수정에 실패했습니다.",
    };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const profile = await getAuthenticatedProfile(supabase);

    if (!profile.is_admin) {
      throw new Error("이벤트 삭제 권한이 없습니다.");
    }

    const { data: event, error: eventError } = await supabase
      .from("spec_events")
      .select("id, title, batch")
      .eq("id", id)
      .maybeSingle();

    if (eventError) {
      throw new Error(`이벤트 확인에 실패했습니다: ${eventError.message}`);
    }

    if (!event) {
      throw new Error("삭제할 이벤트를 찾을 수 없습니다.");
    }

    const { data: logs } = await supabase
      .from("spec_logs")
      .select("id")
      .eq("event_id", id);

    const logIds = (logs ?? []).map((log) => log.id);

    if (logIds.length > 0) {
      const { data: imageRows } = await supabase
        .from("spec_log_images")
        .select("image_url")
        .in("log_id", logIds);

      await deleteStorageImages(
        supabase,
        (imageRows ?? []).map((row) => row.image_url),
      );
    }

    const { error: deleteEventError } = await supabase.from("spec_events").delete().eq("id", id);

    if (deleteEventError) {
      throw new Error(`이벤트 삭제에 실패했습니다: ${deleteEventError.message}`);
    }

    await logAuditEvent({
      action: "delete",
      entityType: "spec_event",
      entityId: event.id,
      details: {
        title: event.title,
        batch: event.batch,
        logCount: logIds.length,
      },
    });

    revalidatePath("/spec-log");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 삭제에 실패했습니다.",
    };
  }
}

export async function getLogsByEvent(
  eventId: string,
  limit = 20,
  offset = 0,
): Promise<ActionResult<LogWithMeta[]>> {
  try {
    const supabase = await createClient();

    if (limit <= 0) {
      throw new Error("조회 개수는 1 이상이어야 합니다.");
    }
    if (offset < 0) {
      throw new Error("오프셋은 0 이상이어야 합니다.");
    }

    const end = offset + limit - 1;
    const { data: logs, error: logsError } = await supabase
      .from("spec_logs")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .range(offset, end);

    if (logsError) {
      throw new Error(`로그 조회에 실패했습니다: ${logsError.message}`);
    }

    const safeLogs = logs ?? [];
    const logIds = safeLogs.map((log) => log.id);
    const authorIds = Array.from(new Set(safeLogs.map((log) => log.author_id)));

    const authorNameMap = new Map<string, string>();

    if (authorIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", authorIds);

      if (profilesError) {
        throw new Error(`작성자 정보 조회에 실패했습니다: ${profilesError.message}`);
      }

      for (const profile of profiles ?? []) {
        authorNameMap.set(profile.id, profile.name);
      }
    }

    const imageMap = new Map<string, string[]>();
    const commentCountMap = new Map<string, number>();
    const reactionMap = new Map<string, Map<string, { count: number; userIds: string[] }>>();

    if (logIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from("spec_log_images")
        .select("log_id, image_url, sort_order")
        .in("log_id", logIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (imagesError) {
        throw new Error(`이미지 조회에 실패했습니다: ${imagesError.message}`);
      }

      for (const image of images ?? []) {
        const current = imageMap.get(image.log_id) ?? [];
        current.push(image.image_url);
        imageMap.set(image.log_id, current);
      }

      const { data: comments, error: commentsError } = await supabase
        .from("spec_log_comments")
        .select("log_id")
        .in("log_id", logIds);

      if (commentsError) {
        throw new Error(`댓글 집계 조회에 실패했습니다: ${commentsError.message}`);
      }

      for (const comment of comments ?? []) {
        commentCountMap.set(comment.log_id, (commentCountMap.get(comment.log_id) ?? 0) + 1);
      }

      const { data: reactions, error: reactionsError } = await supabase
        .from("spec_log_reactions")
        .select("log_id, emoji, user_id")
        .in("log_id", logIds)
        .order("created_at", { ascending: true });

      if (reactionsError) {
        throw new Error(`리액션 집계 조회에 실패했습니다: ${reactionsError.message}`);
      }

      for (const reaction of reactions ?? []) {
        const logReactions = reactionMap.get(reaction.log_id) ?? new Map<string, { count: number; userIds: string[] }>();
        const current = logReactions.get(reaction.emoji) ?? { count: 0, userIds: [] };
        current.count += 1;
        current.userIds.push(reaction.user_id);
        logReactions.set(reaction.emoji, current);
        reactionMap.set(reaction.log_id, logReactions);
      }
    }

    const result: LogWithMeta[] = safeLogs.map((log) => ({
      ...log,
      author: {
        id: log.author_id,
        name: authorNameMap.get(log.author_id) ?? "알 수 없음",
      },
      imageUrls: imageMap.get(log.id) ?? [],
      commentCount: commentCountMap.get(log.id) ?? 0,
      reactionSummary: Array.from((reactionMap.get(log.id) ?? new Map()).entries()).map(([emoji, value]) => ({
        emoji,
        count: value.count,
        userIds: value.userIds,
      })),
    }));

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "로그 목록 조회에 실패했습니다.",
    };
  }
}

export async function createLog(
  eventId: string,
  content: string,
  imageUrls: string[],
): Promise<ActionResult<SpecLogRow>> {
  try {
    const supabase = await createClient();
    const profile = await getAuthenticatedProfile(supabase);

    requireRole(profile.role, WRITER_ROLES, "로그 작성 권한이 없습니다.");

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new Error("로그 내용을 입력해주세요.");
    }

    if (normalizedContent.length > 5000) {
      throw new Error("로그 내용은 5000자를 초과할 수 없습니다.");
    }

    const MAX_IMAGES_PER_LOG = 20;
    if (imageUrls.length > MAX_IMAGES_PER_LOG) {
      throw new Error(`이미지는 최대 ${MAX_IMAGES_PER_LOG}장까지 첨부할 수 있습니다.`);
    }

    const { data: event, error: eventError } = await supabase
      .from("spec_events")
      .select("id, batch")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) {
      throw new Error(`이벤트 확인에 실패했습니다: ${eventError.message}`);
    }

    if (!event) {
      throw new Error("대상 이벤트를 찾을 수 없습니다.");
    }

    if (!profile.is_admin) {
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("learner_batch, preneur_batch")
        .eq("public_profile_id", profile.userId)
        .maybeSingle();

      if (memberError) {
        throw new Error(`사용자 기수 확인에 실패했습니다: ${memberError.message}`);
      }

      const userBatch = profile.role === "learner" ? member?.learner_batch : profile.role === "preneur" ? member?.preneur_batch : null;
      if (!userBatch || userBatch !== event.batch) {
        throw new Error("해당 기수 이벤트에만 로그를 작성할 수 있습니다.");
      }
    }

    const insertPayload: SpecLogInsert = {
      event_id: eventId,
      author_id: profile.userId,
      content: normalizedContent,
    };

    const { data: createdLog, error: createError } = await supabase
      .from("spec_logs")
      .insert(insertPayload)
      .select("*")
      .single();

    if (createError) {
      throw new Error(`로그 생성에 실패했습니다: ${createError.message}`);
    }

    const normalizedImageUrls = imageUrls
      .map((url) => url.trim())
      .filter((url) => Boolean(url));

    if (normalizedImageUrls.length > 0) {
      const imageRows: SpecLogImageInsert[] = normalizedImageUrls.map((imageUrl, index) => ({
        log_id: createdLog.id,
        image_url: imageUrl,
        sort_order: index,
      }));

      const { error: imageInsertError } = await supabase.from("spec_log_images").insert(imageRows);

      if (imageInsertError) {
        throw new Error(`로그 이미지 저장에 실패했습니다: ${imageInsertError.message}`);
      }
    }

    await logAuditEvent({
      action: "create",
      entityType: "spec_log",
      entityId: createdLog.id,
      details: {
        eventId,
        imageCount: normalizedImageUrls.length,
      },
    });

    revalidatePath("/spec-log");

    return { success: true, data: createdLog };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "로그 생성에 실패했습니다.",
    };
  }
}

export async function getLogById(logId: string): Promise<
  ActionResult<{
    log: {
      id: string;
      event_id: string;
      author_id: string;
      content: string;
      created_at: string;
      updated_at: string;
    };
    author: { id: string; name: string };
    event: {
      id: string;
      title: string;
      description: string | null;
      batch: string;
      status: string;
      start_date: string;
      end_date: string;
    };
    images: { id: string; image_url: string; sort_order: number }[];
    comments: {
      id: string;
      content: string;
      created_at: string;
      author: { id: string; name: string };
      parent_id: string | null;
    }[];
    reactionSummary: LogReactionSummary[];
  }>
> {
  try {
    if (!isValidUUID(logId)) {
      return { success: false, error: "유효하지 않은 로그 ID입니다." };
    }

    const supabase = await createClient();

    const { data: log, error: logError } = await supabase
      .from("spec_logs")
      .select("*")
      .eq("id", logId)
      .maybeSingle();

    if (logError) {
      throw new Error(`로그 조회에 실패했습니다: ${logError.message}`);
    }

    if (!log) {
      throw new Error("로그를 찾을 수 없습니다.");
    }

    const { data: event, error: eventError } = await supabase
      .from("spec_events")
      .select("id, title, description, batch, status, start_date, end_date")
      .eq("id", log.event_id)
      .maybeSingle();

    if (eventError) {
      throw new Error(`이벤트 조회에 실패했습니다: ${eventError.message}`);
    }

    if (!event) {
      throw new Error("이벤트를 찾을 수 없습니다.");
    }

    const { data: images } = await supabase
      .from("spec_log_images")
      .select("id, image_url, sort_order")
      .eq("log_id", logId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const { data: comments } = await supabase
      .from("spec_log_comments")
      .select("id, log_id, author_id, content, parent_id, created_at, updated_at")
      .eq("log_id", logId)
      .order("created_at", { ascending: true });

    const { data: reactions } = await supabase
      .from("spec_log_reactions")
      .select("emoji, user_id")
      .eq("log_id", logId);

    const authorIdSet = new Set<string>([log.author_id]);
    for (const comment of comments ?? []) {
      authorIdSet.add(comment.author_id);
    }
    const authorIds = Array.from(authorIdSet);

    const authorNameMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", authorIds);

      if (!profilesError) {
        for (const profile of profiles ?? []) {
          authorNameMap.set(profile.id, profile.name);
        }
      }
    }

    const reactionMap = new Map<string, { count: number; userIds: string[] }>();
    for (const r of reactions ?? []) {
      const existing = reactionMap.get(r.emoji) ?? { count: 0, userIds: [] };
      existing.count += 1;
      existing.userIds.push(r.user_id);
      reactionMap.set(r.emoji, existing);
    }
    const reactionSummary = Array.from(reactionMap.entries()).map(([emoji, value]) => ({
      emoji,
      count: value.count,
      userIds: value.userIds,
    }));

    return {
      success: true,
      data: {
        log: {
          id: log.id,
          event_id: log.event_id,
          author_id: log.author_id,
          content: log.content,
          created_at: log.created_at,
          updated_at: log.updated_at,
        },
        author: {
          id: log.author_id,
          name: authorNameMap.get(log.author_id) ?? "알 수 없음",
        },
        event,
        images: images ?? [],
        comments: (comments ?? []).map((c) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          parent_id: c.parent_id,
          author: {
            id: c.author_id,
            name: authorNameMap.get(c.author_id) ?? "알 수 없음",
          },
        })),
        reactionSummary,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "로그 조회에 실패했습니다.",
    };
  }
}

export async function updateLog(
  logId: string,
  content: string,
  imageUrls: string[],
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const profile = await getAuthenticatedProfile(supabase);

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new Error("로그 내용을 입력해주세요.");
    }

    if (normalizedContent.length > 5000) {
      throw new Error("로그 내용은 5000자를 초과할 수 없습니다.");
    }

    const MAX_IMAGES_PER_LOG = 20;
    if (imageUrls.length > MAX_IMAGES_PER_LOG) {
      throw new Error(`이미지는 최대 ${MAX_IMAGES_PER_LOG}장까지 첨부할 수 있습니다.`);
    }

    const { data: log, error: logError } = await supabase
      .from("spec_logs")
      .select("id, author_id, event_id")
      .eq("id", logId)
      .maybeSingle();

    if (logError) {
      throw new Error(`로그 조회에 실패했습니다: ${logError.message}`);
    }

    if (!log) {
      throw new Error("수정할 로그를 찾을 수 없습니다.");
    }

    if (log.author_id !== profile.userId) {
      throw new Error("본인이 작성한 로그만 수정할 수 있습니다.");
    }

    const { error: updateError } = await supabase
      .from("spec_logs")
      .update({ content: normalizedContent })
      .eq("id", logId);

    if (updateError) {
      throw new Error(`로그 수정에 실패했습니다: ${updateError.message}`);
    }

    const { data: existingImages } = await supabase
      .from("spec_log_images")
      .select("image_url")
      .eq("log_id", logId);

    const existingUrls = new Set((existingImages ?? []).map((img) => img.image_url));
    const newUrls = new Set(imageUrls);

    const urlsToDelete = [...existingUrls].filter((url) => !newUrls.has(url));
    const urlsToAdd = imageUrls.filter((url) => !existingUrls.has(url));

    if (urlsToDelete.length > 0) {
      await deleteStorageImages(
        supabase,
        urlsToDelete,
      );
      await supabase
        .from("spec_log_images")
        .delete()
        .eq("log_id", logId)
        .in("image_url", urlsToDelete);
    }

    if (urlsToAdd.length > 0) {
      const startOrder = existingUrls.size - urlsToDelete.length;
      const imageRows: SpecLogImageInsert[] = urlsToAdd.map((imageUrl, index) => ({
        log_id: logId,
        image_url: imageUrl,
        sort_order: startOrder + index,
      }));

      const { error: imageInsertError } = await supabase
        .from("spec_log_images")
        .insert(imageRows);

      if (imageInsertError) {
        throw new Error(`이미지 저장에 실패했습니다: ${imageInsertError.message}`);
      }
    }

    await logAuditEvent({
      action: "update",
      entityType: "spec_log",
      entityId: logId,
      details: {
        eventId: log.event_id,
        imagesAdded: urlsToAdd.length,
        imagesRemoved: urlsToDelete.length,
      },
    });

    revalidatePath("/spec-log");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "로그 수정에 실패했습니다.",
    };
  }
}

export async function deleteLog(logId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const profile = await getAuthenticatedProfile(supabase);

    const { data: log, error: logError } = await supabase
      .from("spec_logs")
      .select("id, author_id, event_id")
      .eq("id", logId)
      .maybeSingle();

    if (logError) {
      throw new Error(`로그 조회에 실패했습니다: ${logError.message}`);
    }

    if (!log) {
      throw new Error("삭제할 로그를 찾을 수 없습니다.");
    }

    const isAuthor = log.author_id === profile.userId;
    const isAdmin = profile.is_admin;

    if (!isAuthor && !isAdmin) {
      throw new Error("로그 삭제 권한이 없습니다.");
    }

    const { data: images } = await supabase
      .from("spec_log_images")
      .select("image_url")
      .eq("log_id", logId);

    await deleteStorageImages(
      supabase,
      (images ?? []).map((image) => image.image_url),
    );

    const { error: deleteLogError } = await supabase.from("spec_logs").delete().eq("id", logId);
    if (deleteLogError) {
      throw new Error(`로그 삭제에 실패했습니다: ${deleteLogError.message}`);
    }

    await logAuditEvent({
      action: "delete",
      entityType: "spec_log",
      entityId: log.id,
      details: {
        eventId: log.event_id,
      },
    });

    revalidatePath("/spec-log");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "로그 삭제에 실패했습니다.",
    };
  }
}
