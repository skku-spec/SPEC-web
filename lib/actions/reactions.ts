"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { BLOG_WRITER_ROLES, type UserRole } from "@/lib/auth";

type ActionResult = {
  success: boolean;
  error?: string;
  added: boolean;
};

export type ReactionSummary = {
  emoji: string;
  count: number;
  userIds: string[];
};

// Defined inline — cannot export non-async values from "use server" files.
// Shared constant also in components/blog/ReactionBar.tsx
const ALLOWED_EMOJIS = ["👍", "🔥", "❤️", "🎉", "🤔", "👀"] as const;

const WRITER_ROLES = new Set<UserRole>(BLOG_WRITER_ROLES);

export async function toggleReaction(postId: string, emoji: string): Promise<ActionResult> {
  try {
    if (!ALLOWED_EMOJIS.includes(emoji as (typeof ALLOWED_EMOJIS)[number])) {
      throw new Error("유효하지 않은 이모지입니다.");
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
      throw new Error("반응을 남기려면 로그인이 필요합니다.");
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
      throw new Error("반응을 남길 권한이 없습니다.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existingError) {
      throw new Error(`기존 반응 확인에 실패했습니다: ${existingError.message}`);
    }

    if (existing) {
      const { error: deleteError } = await supabase.from("reactions").delete().eq("id", existing.id);
      if (deleteError) {
        throw new Error(`반응 삭제에 실패했습니다: ${deleteError.message}`);
      }

      revalidatePath("/blog");
      revalidatePath("/blog/[slug]");

      return { success: true, added: false };
    }

    const { error: insertError } = await supabase.from("reactions").insert({
      post_id: postId,
      user_id: user.id,
      emoji,
    });

    if (insertError) {
      throw new Error(`반응 등록에 실패했습니다: ${insertError.message}`);
    }

    revalidatePath("/blog");
    revalidatePath("/blog/[slug]");

    return { success: true, added: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "반응 처리에 실패했습니다.",
      added: false,
    };
  }
}

export async function getReactionsByPost(postId: string): Promise<ReactionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("emoji, user_id")
    .eq("post_id", postId)
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
