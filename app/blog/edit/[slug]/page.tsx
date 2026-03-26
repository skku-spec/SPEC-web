import { notFound } from "next/navigation";

import PostEditorForm from "@/app/blog/PostEditorForm";
import { getBlogPostBySlugForOwner, getBlogTags } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export const revalidate = 60;

export default async function BlogEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, profile } = await requireAuth();
  const [post, tags] = await Promise.all([getBlogPostBySlugForOwner(slug), getBlogTags()]);

  if (!post) {
    notFound();
  }

  const isOwner = post.authorId === user.id;
  const isAdmin = profile?.is_admin === true;

  if (!isOwner && !isAdmin) {
    notFound();
  }

  return <PostEditorForm mode="edit" post={post} initialTags={tags} />;
}
