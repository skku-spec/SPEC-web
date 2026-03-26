import type { Metadata } from "next";
import PostsClient from "@/app/admin/posts/PostsClient";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostWithAuthor = Post & {
  authorName: string;
};

export const metadata: Metadata = {
  title: "게시글 관리 | SPEC Admin",
};

export default async function AdminPostsPage() {
  const supabase = await createClient();

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Failed to load posts:", postsError.message);
  }

  const rows = posts ?? [];
  const authorIds = [...new Set(rows.map((p) => p.author_id))];

  let profileMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", authorIds);

    profileMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  }

  const postsWithAuthor: PostWithAuthor[] = rows.map((post) => ({
    ...post,
    authorName: profileMap.get(post.author_id) ?? "Unknown",
  }));

  return <PostsClient initialPosts={postsWithAuthor} />;
}
