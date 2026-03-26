"use server";

import { revalidatePath } from "next/cache";

import { BLOG_WRITER_ROLES, isAdmin, type UserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ActionResult = {
  success: boolean;
  error?: string;
};

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type CommentWithAuthor = {
  id: string;
  postId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    slug: string;
    photo: string;
  };
};

async function getCurrentUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ role: UserRole; is_admin?: boolean }> {
  const { data: profile, error } = await supabase.from("profiles").select("role, is_admin").eq("id", userId).maybeSingle();

  if (error) {
    throw new Error(`Failed to verify user role: ${error.message}`);
  }

  return {
    role: (profile?.role as UserRole | null) ?? "outsider",
    is_admin: profile?.is_admin,
  };
}

export async function addComment(postId: string, content: string, parentId?: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`Authentication failed: ${userError.message}`);
    }

    if (!user) {
      throw new Error("You must be logged in to comment.");
    }

    const profile = await getCurrentUserProfile(supabase, user.id);
    if (!BLOG_WRITER_ROLES.includes(profile.role)) {
      throw new Error("You do not have permission to comment.");
    }

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new Error("Comment cannot be empty.");
    }

    const insertPayload: Database["public"]["Tables"]["comments"]["Insert"] = {
      post_id: postId,
      author_id: user.id,
      content: normalizedContent,
      parent_id: parentId ?? null,
    };

    const { error: insertError } = await supabase.from("comments").insert(insertPayload);
    if (insertError) {
      throw new Error(`Failed to add comment: ${insertError.message}`);
    }

    revalidatePath("/blog");
    revalidatePath("/blog/[slug]");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add comment.",
    };
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`Authentication failed: ${userError.message}`);
    }

    if (!user) {
      throw new Error("You must be logged in to delete comments.");
    }

    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("id, author_id")
      .eq("id", commentId)
      .maybeSingle();

    if (commentError) {
      throw new Error(`Failed to find comment: ${commentError.message}`);
    }

    if (!comment) {
      throw new Error("Comment not found.");
    }

    const profile = await getCurrentUserProfile(supabase, user.id);
    const canDelete = comment.author_id === user.id || isAdmin(profile);

    if (!canDelete) {
      throw new Error("You do not have permission to delete this comment.");
    }

    const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId);
    if (deleteError) {
      throw new Error(`Failed to delete comment: ${deleteError.message}`);
    }

    revalidatePath("/blog");
    revalidatePath("/blog/[slug]");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete comment.",
    };
  }
}

export async function getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("id, post_id, author_id, content, parent_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    return [];
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  const authorIds = Array.from(new Set(comments.map((comment) => comment.author_id)));
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, slug, photo")
    .in("id", authorIds);

  if (profilesError) {
    return [];
  }

  const profileById = new Map<string, Pick<ProfileRow, "id" | "name" | "slug" | "photo">>(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return comments.map((comment) => {
    const author = profileById.get(comment.author_id);

    return {
      id: comment.id,
      postId: comment.post_id,
      content: comment.content,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
      author: {
        id: comment.author_id,
        name: author?.name ?? "Unknown",
        slug: author?.slug ?? "",
        photo: author?.photo ?? "",
      },
    };
  });
}
