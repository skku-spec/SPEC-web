"use client";

import Link from "next/link";
import { useTransition } from "react";

import { deletePost, toggleFeatured, togglePublished } from "@/lib/actions/posts";
import type { PostWithAuthor } from "./page";
import type { PostType } from "@/lib/supabase/types";

type PostsClientProps = {
  initialPosts: PostWithAuthor[];
};

const TYPE_COLORS: Record<PostType, string> = {
  news: "#FF6C0F",
  blog: "#3B82F6",
};

function getAuthorName(post: PostWithAuthor) {
  return post.authorName;
}

export default function PostsClient({ initialPosts }: PostsClientProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(() => {
      void (async () => {
        const result = await action();

        if (!result.success) {
          window.alert(result.error ?? "Action failed.");
          return;
        }

      })();
    });
  };

  const handleDelete = (postId: string) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) {
      return;
    }

    runAction(() => deletePost(postId));
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Posts</h1>
          <Link
            href="/admin/posts/new"
            className="inline-flex h-10 items-center rounded-md bg-[#FF6C0F] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white"
          >
            New News Post
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Title</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Type</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Author</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Published</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Featured</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialPosts.map((post) => (
                <tr key={post.id} className="border-t border-[#ece8db]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] hover:text-[#FF6C0F]"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold capitalize text-white"
                      style={{ backgroundColor: TYPE_COLORS[post.type] }}
                    >
                      {post.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    {getAuthorName(post)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runAction(() => togglePublished(post.id))}
                      className={`inline-flex h-8 min-w-16 items-center justify-center rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                        post.published ? "bg-[#2f9e44]" : "bg-[#6b6b5e]"
                      }`}
                    >
                      {post.published ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runAction(() => toggleFeatured(post.id))}
                      className={`inline-flex h-8 min-w-16 items-center justify-center rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                        post.featured ? "bg-[#FF6C0F]" : "bg-[#6b6b5e]"
                      }`}
                    >
                      {post.featured ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(post.id)}
                      className="text-sm font-semibold text-[#b42318] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
