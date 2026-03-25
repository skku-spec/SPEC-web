"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = {
  success: boolean;
  error?: string;
};

export type TagWithPostCount = {
  id: string;
  label: string;
  slug: string;
  postCount: number;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getTagsWithPostCount(): Promise<TagWithPostCount[]> {
  const supabase = createAdminClient();

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, label, slug")
    .order("label", { ascending: true });

  if (tagsError) {
    console.error("Failed to load tags:", tagsError.message);
    return [];
  }

  if (!tags || tags.length === 0) {
    return [];
  }

  const { data: postTags, error: postTagsError } = await supabase
    .from("post_tags")
    .select("tag_id");

  if (postTagsError) {
    console.error("Failed to load post_tags:", postTagsError.message);
  }

  const countMap = new Map<string, number>();
  for (const row of postTags ?? []) {
    countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1);
  }

  return tags.map((tag) => ({
    id: tag.id,
    label: tag.label,
    slug: tag.slug,
    postCount: countMap.get(tag.id) ?? 0,
  }));
}

export async function createTag(label: string, slug: string): Promise<ActionResult> {
  try {
    const trimmedLabel = label.trim();
    const trimmedSlug = slug.trim() || slugify(trimmedLabel);

    if (!trimmedLabel) {
      return { success: false, error: "태그 이름을 입력해주세요." };
    }

    if (!trimmedSlug) {
      return { success: false, error: "슬러그를 생성할 수 없습니다." };
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", trimmedSlug)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "동일한 슬러그의 태그가 이미 존재합니다." };
    }

    const { error: insertError } = await supabase
      .from("tags")
      .insert({ label: trimmedLabel, slug: trimmedSlug });

    if (insertError) {
      throw new Error(`Failed to create tag: ${insertError.message}`);
    }

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "태그 생성에 실패했습니다.",
    };
  }
}

export async function updateTag(tagId: string, label: string, slug: string): Promise<ActionResult> {
  try {
    const trimmedLabel = label.trim();
    const trimmedSlug = slug.trim() || slugify(trimmedLabel);

    if (!trimmedLabel) {
      return { success: false, error: "태그 이름을 입력해주세요." };
    }

    if (!trimmedSlug) {
      return { success: false, error: "슬러그를 생성할 수 없습니다." };
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", trimmedSlug)
      .neq("id", tagId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "동일한 슬러그의 태그가 이미 존재합니다." };
    }

    const { error: updateError } = await supabase
      .from("tags")
      .update({ label: trimmedLabel, slug: trimmedSlug })
      .eq("id", tagId);

    if (updateError) {
      throw new Error(`Failed to update tag: ${updateError.message}`);
    }

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "태그 수정에 실패했습니다.",
    };
  }
}

export async function deleteTag(tagId: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();

    const { error: junctionError } = await supabase
      .from("post_tags")
      .delete()
      .eq("tag_id", tagId);

    if (junctionError) {
      throw new Error(`Failed to remove tag associations: ${junctionError.message}`);
    }

    const { error: deleteError } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId);

    if (deleteError) {
      throw new Error(`Failed to delete tag: ${deleteError.message}`);
    }

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "태그 삭제에 실패했습니다.",
    };
  }
}
