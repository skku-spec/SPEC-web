"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Database, PostType } from "@/lib/supabase/types";
import { BLOG_WRITER_ROLES, isAdmin, type UserRole } from "@/lib/auth";
import { sanitizeHTML } from "@/lib/sanitize";
import { isValidUUID } from "@/lib/validators";

type ActionResult = {
  success: boolean;
  error?: string;
  slug?: string;
};

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type TagRow = Database["public"]["Tables"]["tags"]["Row"];

function isValidPostType(value: string): value is PostType {
  return value === "blog" || value === "news";
}

function parseStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
): Promise<string> {
  const base = slugify(title);
  if (!base) {
    return `post-${Date.now()}`;
  }

  const { data: existing } = await supabase
    .from("posts")
    .select("slug")
    .like("slug", `${base}%`);

  if (!existing || existing.length === 0) {
    return base;
  }

  const existingSlugs = new Set(existing.map((p) => p.slug));

  if (!existingSlugs.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingSlugs.has(`${base}-${suffix}`)) {
    suffix++;
  }

  return `${base}-${suffix}`;
}

function parseTags(formData: FormData): string[] {
  const fromArray = formData
    .getAll("tags")
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }

  const tagsField = parseStringField(formData, "tags");
  if (!tagsField) {
    return [];
  }

  if (tagsField.startsWith("[") && tagsField.endsWith("]")) {
    try {
      const parsed = JSON.parse(tagsField);
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean);

        return Array.from(new Set(normalized));
      }
    } catch {
      return tagsField
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return Array.from(
    new Set(
      tagsField
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function toTagLabel(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function revalidateBlogPaths(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");

  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

async function getCurrentUserAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ role: UserRole; isAdmin: boolean }> {
  const { data: profile, error } = await supabase.from("profiles").select("role, is_admin").eq("id", userId).maybeSingle();

  if (error) {
    throw new Error(`사용자 역할 확인에 실패했습니다: ${error.message}`);
  }

  return {
    role: (profile?.role as UserRole | null) ?? "outsider",
    isAdmin: isAdmin(profile),
  };
}

async function getPostForPermissionCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
): Promise<Pick<PostRow, "id" | "slug" | "author_id" | "featured" | "published">> {
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, slug, author_id, featured, published")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new Error(`게시글을 불러오지 못했습니다: ${error.message}`);
  }

  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  return post;
}

async function resolveTagIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagSlugs: string[],
): Promise<string[]> {
  if (tagSlugs.length === 0) {
    return [];
  }

  const { data: existingTags, error: existingError } = await supabase.from("tags").select("id, slug").in("slug", tagSlugs);

  if (existingError) {
    throw new Error(`기존 태그를 불러오지 못했습니다: ${existingError.message}`);
  }

  const existingSlugSet = new Set((existingTags ?? []).map((tag) => tag.slug));
  const missingSlugs = tagSlugs.filter((slug) => !existingSlugSet.has(slug));

  if (missingSlugs.length > 0) {
    const tagsToInsert: Database["public"]["Tables"]["tags"]["Insert"][] = missingSlugs.map((slug) => ({
      slug,
      label: toTagLabel(slug),
    }));

    const { error: insertTagsError } = await supabase.from("tags").insert(tagsToInsert);

    if (insertTagsError) {
      throw new Error(`누락된 태그 생성에 실패했습니다: ${insertTagsError.message}`);
    }
  }

  const { data: allTags, error: allTagsError } = await supabase.from("tags").select("id, slug").in("slug", tagSlugs);

  if (allTagsError) {
    throw new Error(`태그를 불러오지 못했습니다: ${allTagsError.message}`);
  }

  const tagIdMap = new Map((allTags ?? []).map((tag: Pick<TagRow, "id" | "slug">) => [tag.slug, tag.id]));

  return tagSlugs.map((slug) => tagIdMap.get(slug)).filter((id): id is string => Boolean(id));
}

async function upsertPostTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  tagSlugs: string[],
): Promise<void> {
  const uniqueSlugs = Array.from(new Set(tagSlugs));
  const tagIds = await resolveTagIds(supabase, uniqueSlugs);

  const { error: deleteError } = await supabase.from("post_tags").delete().eq("post_id", postId);
  if (deleteError) {
    throw new Error(`게시글의 기존 태그 삭제에 실패했습니다: ${deleteError.message}`);
  }

  if (tagIds.length === 0) {
    return;
  }

  const rows: Database["public"]["Tables"]["post_tags"]["Insert"][] = tagIds.map((tagId) => ({
    post_id: postId,
    tag_id: tagId,
  }));

  const { error: insertError } = await supabase.from("post_tags").insert(rows);
  if (insertError) {
    throw new Error(`게시글에 태그 연결에 실패했습니다: ${insertError.message}`);
  }
}

function parsePostPayload(formData: FormData) {
  const title = parseStringField(formData, "title");
  const excerpt = parseStringField(formData, "excerpt");
  const content = parseStringField(formData, "content");
  const image_url = parseStringField(formData, "image_url");
  const tags = parseTags(formData);
  const typeValue = parseStringField(formData, "type");
  const publishedValue = parseStringField(formData, "published");

  if (!title || !excerpt || !content || !typeValue) {
    throw new Error("필수 게시글 항목이 누락되었습니다.");
  }

  if (!isValidPostType(typeValue)) {
    throw new Error("유효하지 않은 게시글 유형입니다. 'news' 또는 'blog'여야 합니다.");
  }

  return {
    title,
    excerpt,
    content,
    image_url,
    tags,
    type: typeValue,
    published: publishedValue === "true",
  };
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`인증에 실패했습니다: ${userError.message}`);
    }

    if (!user) {
      throw new Error("게시글을 작성하려면 로그인이 필요합니다.");
    }

    const profile = await getCurrentUserAccess(supabase, user.id);
    if (!BLOG_WRITER_ROLES.includes(profile.role)) {
      throw new Error("게시글을 작성할 권한이 없습니다.");
    }

    const payload = parsePostPayload(formData);
    const sanitizedContent = sanitizeHTML(payload.content);

    if (payload.type === "news" && !profile.isAdmin) {
      throw new Error("뉴스 게시글은 관리자만 작성할 수 있습니다.");
    }

    const generatedSlug = await generateUniqueSlug(supabase, payload.title);

    const postInsert: Database["public"]["Tables"]["posts"]["Insert"] = {
      title: payload.title,
      slug: generatedSlug,
      excerpt: payload.excerpt,
      content: sanitizedContent,
      type: payload.type,
      image_url: payload.image_url,
      author_id: user.id,
      featured: false,
      published: payload.published,
    };

    const { data: post, error: insertError } = await supabase.from("posts").insert(postInsert).select("id, slug").single();

    if (insertError) {
      throw new Error(`게시글 생성에 실패했습니다: ${insertError.message}`);
    }

    await upsertPostTags(supabase, post.id, payload.tags);
    revalidateBlogPaths(post.slug);

    return { success: true, slug: post.slug };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "게시글 생성에 실패했습니다.",
    };
  }
}

export async function updatePost(postId: string, formData: FormData): Promise<ActionResult> {
  if (!isValidUUID(postId)) {
    return { success: false, error: "유효하지 않은 게시글 ID입니다." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`인증에 실패했습니다: ${userError.message}`);
    }

    if (!user) {
      throw new Error("게시글을 수정하려면 로그인이 필요합니다.");
    }

    const profile = await getCurrentUserAccess(supabase, user.id);
    const userIsAdmin = profile.isAdmin;

    const existingPost = await getPostForPermissionCheck(supabase, postId);
    if (!userIsAdmin && existingPost.author_id !== user.id) {
      throw new Error("이 게시글을 수정할 권한이 없습니다.");
    }

    const payload = parsePostPayload(formData);
    const sanitizedContent = sanitizeHTML(payload.content);

    if (payload.type === "news" && !userIsAdmin) {
      throw new Error("뉴스 게시글은 관리자만 게시할 수 있습니다.");
    }

    const updatePayload: Database["public"]["Tables"]["posts"]["Update"] = {
      title: payload.title,
      excerpt: payload.excerpt,
      content: sanitizedContent,
      type: payload.type,
      image_url: payload.image_url,
      published: payload.published,
    };

    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update(updatePayload)
      .eq("id", postId)
      .select("id, slug")
      .single();

    if (updateError) {
      throw new Error(`게시글 수정에 실패했습니다: ${updateError.message}`);
    }

    await upsertPostTags(supabase, postId, payload.tags);
    revalidateBlogPaths(updatedPost.slug);

    return { success: true, slug: updatedPost.slug };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "게시글 수정에 실패했습니다.",
    };
  }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  if (!isValidUUID(postId)) {
    return { success: false, error: "유효하지 않은 게시글 ID입니다." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`인증에 실패했습니다: ${userError.message}`);
    }

    if (!user) {
      throw new Error("게시글을 삭제하려면 로그인이 필요합니다.");
    }

    const profile = await getCurrentUserAccess(supabase, user.id);
    const userIsAdmin = profile.isAdmin;

    const existingPost = await getPostForPermissionCheck(supabase, postId);
    if (!userIsAdmin && existingPost.author_id !== user.id) {
      throw new Error("이 게시글을 삭제할 권한이 없습니다.");
    }

    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId);
    if (deleteError) {
      throw new Error(`게시글 삭제에 실패했습니다: ${deleteError.message}`);
    }

    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.",
    };
  }
}

export async function toggleFeatured(postId: string): Promise<ActionResult> {
  if (!isValidUUID(postId)) {
    return { success: false, error: "유효하지 않은 게시글 ID입니다." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`인증에 실패했습니다: ${userError.message}`);
    }

    if (!user) {
      throw new Error("추천 상태를 변경하려면 로그인이 필요합니다.");
    }

    const profile = await getCurrentUserAccess(supabase, user.id);
    if (!profile.isAdmin) {
      throw new Error("추천 게시글은 관리자만 변경할 수 있습니다.");
    }

    const post = await getPostForPermissionCheck(supabase, postId);
    const { error: updateError } = await supabase
      .from("posts")
      .update({ featured: !post.featured })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`추천 상태 변경에 실패했습니다: ${updateError.message}`);
    }

    revalidateBlogPaths(post.slug);

    return { success: true, slug: post.slug };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "추천 상태 변경에 실패했습니다.",
    };
  }
}

export async function togglePublished(postId: string): Promise<ActionResult> {
  if (!isValidUUID(postId)) {
    return { success: false, error: "유효하지 않은 게시글 ID입니다." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`인증에 실패했습니다: ${userError.message}`);
    }

    if (!user) {
      throw new Error("게시 상태를 변경하려면 로그인이 필요합니다.");
    }

    const profile = await getCurrentUserAccess(supabase, user.id);
    const userIsAdmin = profile.isAdmin;

    const post = await getPostForPermissionCheck(supabase, postId);
    if (!userIsAdmin && post.author_id !== user.id) {
      throw new Error("이 게시글을 게시할 권한이 없습니다.");
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({ published: !post.published })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`게시 상태 변경에 실패했습니다: ${updateError.message}`);
    }

    revalidateBlogPaths(post.slug);

    return { success: true, slug: post.slug };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "게시 상태 변경에 실패했습니다.",
    };
  }
}
