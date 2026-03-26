"use server";

import { revalidatePath } from "next/cache";

import { SPEC_LOG_ENGAGE_ROLES, isAdmin, type UserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { isValidUUID } from "@/lib/validators";

type ActionResult = {
  success: boolean;
  error?: string;
};

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const WRITER_ROLES = new Set<UserRole>(SPEC_LOG_ENGAGE_ROLES);

export type LogCommentWithAuthor = Database["public"]["Tables"]["spec_log_comments"]["Row"] & {
  author: {
    id: string;
    name: string;
  };
};

async function getCurrentUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ role: UserRole; is_admin?: boolean }> {
  const { data: profile, error } = await supabase.from("profiles").select("role, is_admin").eq("id", userId).maybeSingle();

  if (error) {
    throw new Error(`권한 확인에 실패했습니다: ${error.message}`);
  }

  return {
    role: (profile?.role as UserRole | null) ?? "outsider",
    is_admin: profile?.is_admin,
  };
}

export async function getCommentsByLog(logId: string): Promise<LogCommentWithAuthor[]> {
  const supabase = await createClient();
  const { data: comments, error: commentsError } = await supabase
    .from("spec_log_comments")
    .select("id, log_id, author_id, content, parent_id, created_at, updated_at")
    .eq("log_id", logId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    return [];
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  const authorIds = Array.from(new Set(comments.map((comment) => comment.author_id)));
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, name").in("id", authorIds);

  if (profilesError) {
    return [];
  }

  const profileById = new Map<string, Pick<ProfileRow, "id" | "name">>((profiles ?? []).map((profile) => [profile.id, profile]));

  return comments.map((comment) => {
    const author = profileById.get(comment.author_id);

    return {
      ...comment,
      author: {
        id: comment.author_id,
        name: author?.name ?? "알 수 없음",
      },
    };
  });
}

export async function addLogComment(logId: string, content: string, parentId?: string): Promise<ActionResult> {
  try {
    if (!isValidUUID(logId)) {
      return { success: false, error: "유효하지 않은 로그 ID입니다." };
    }

    if (parentId && !isValidUUID(parentId)) {
      return { success: false, error: "유효하지 않은 댓글 ID입니다." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`인증에 실패했습니다: ${userError.message}`);
    }

    if (!user) {
      throw new Error("댓글을 작성하려면 로그인이 필요합니다.");
    }

    const profile = await getCurrentUserProfile(supabase, user.id);
    if (!WRITER_ROLES.has(profile.role)) {
      throw new Error("댓글 작성 권한이 없습니다.");
    }

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new Error("댓글 내용을 입력해주세요.");
    }

    if (normalizedContent.length > 1000) {
      throw new Error("댓글은 1000자를 초과할 수 없습니다.");
    }

    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from("spec_log_comments")
        .select("id, log_id")
        .eq("id", parentId)
        .maybeSingle();

      if (parentError) {
        throw new Error(`부모 댓글 확인에 실패했습니다: ${parentError.message}`);
      }

      if (!parentComment) {
        throw new Error("부모 댓글을 찾을 수 없습니다.");
      }

      if (parentComment.log_id !== logId) {
        throw new Error("같은 로그의 댓글에만 답글을 작성할 수 있습니다.");
      }
    }

    const insertPayload: Database["public"]["Tables"]["spec_log_comments"]["Insert"] = {
      log_id: logId,
      author_id: user.id,
      content: normalizedContent,
      parent_id: parentId ?? null,
    };

    const { error: insertError } = await supabase.from("spec_log_comments").insert(insertPayload);
    if (insertError) {
      throw new Error(`댓글 등록에 실패했습니다: ${insertError.message}`);
    }

    revalidatePath("/spec-log");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "댓글 등록에 실패했습니다.",
    };
  }
}

export async function deleteLogComment(commentId: string): Promise<ActionResult> {
  try {
    if (!isValidUUID(commentId)) {
      return { success: false, error: "유효하지 않은 댓글 ID입니다." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`인증에 실패했습니다: ${userError.message}`);
    }

    if (!user) {
      throw new Error("댓글을 삭제하려면 로그인이 필요합니다.");
    }

    const { data: comment, error: commentError } = await supabase
      .from("spec_log_comments")
      .select("id, author_id")
      .eq("id", commentId)
      .maybeSingle();

    if (commentError) {
      throw new Error(`댓글 조회에 실패했습니다: ${commentError.message}`);
    }

    if (!comment) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    const profile = await getCurrentUserProfile(supabase, user.id);
    const canDelete = comment.author_id === user.id || isAdmin(profile);

    if (!canDelete) {
      throw new Error("댓글 삭제 권한이 없습니다.");
    }

    const { error: deleteError } = await supabase.from("spec_log_comments").delete().eq("id", commentId);
    if (deleteError) {
      throw new Error(`댓글 삭제에 실패했습니다: ${deleteError.message}`);
    }

    revalidatePath("/spec-log");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.",
    };
  }
}
