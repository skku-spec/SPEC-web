"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { SPEC_LOG_ENGAGE_ROLES, type UserRole } from "@/lib/auth";

type ActionResult = {
  success: boolean;
  error?: string;
  added: boolean;
};

export type LogReactionSummary = {
  emoji: string;
  count: number;
  userIds: string[];
};

const ALLOWED_EMOJIS = ["👍", "🔥", "❤️", "🎉", "🤔", "👀"] as const;

const WRITER_ROLES = new Set<UserRole>(SPEC_LOG_ENGAGE_ROLES);

export async function toggleLogReaction(logId: string, emoji: string): Promise<ActionResult> {
  try {
    if (!ALLOWED_EMOJIS.includes(emoji as (typeof ALLOWED_EMOJIS)[number])) {
      throw new Error("유효하지 않은 리액션 이모지입니다.");
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
      throw new Error("리액션을 남기려면 로그인이 필요합니다.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`사용자 역할 확인에 실패했습니다: ${profileError.message}`);
    }

    if (!WRITER_ROLES.has((profile?.role as UserRole | null) ?? "outsider")) {
      throw new Error("리액션 권한이 없습니다.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("spec_log_reactions")
      .select("id")
      .eq("log_id", logId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existingError) {
      throw new Error(`기존 리액션 확인에 실패했습니다: ${existingError.message}`);
    }

    if (existing) {
      const { error: deleteError } = await supabase.from("spec_log_reactions").delete().eq("id", existing.id);
      if (deleteError) {
        throw new Error(`리액션 제거에 실패했습니다: ${deleteError.message}`);
      }

      revalidatePath("/spec-log");

      return { success: true, added: false };
    }

    const { error: insertError } = await supabase.from("spec_log_reactions").insert({
      log_id: logId,
      user_id: user.id,
      emoji,
    });

    if (insertError) {
      throw new Error(`리액션 추가에 실패했습니다: ${insertError.message}`);
    }

    revalidatePath("/spec-log");

    return { success: true, added: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "리액션 토글에 실패했습니다.",
      added: false,
    };
  }
}

export async function getLogReactions(logId: string): Promise<LogReactionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spec_log_reactions")
    .select("emoji, user_id")
    .eq("log_id", logId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  const grouped = new Map<string, { count: number; userIds: string[] }>();

  for (const row of data ?? []) {
    if (!ALLOWED_EMOJIS.includes(row.emoji as (typeof ALLOWED_EMOJIS)[number])) {
      continue;
    }

    const current = grouped.get(row.emoji) ?? { count: 0, userIds: [] };
    current.count += 1;
    current.userIds.push(row.user_id);
    grouped.set(row.emoji, current);
  }

  return Array.from(grouped.entries()).map(([emoji, value]) => ({
    emoji,
    count: value.count,
    userIds: value.userIds,
  }));
}
