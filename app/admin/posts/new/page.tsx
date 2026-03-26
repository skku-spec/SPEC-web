import type { Metadata } from "next";
import Link from "next/link";

import PostEditorForm from "@/app/blog/PostEditorForm";

export const metadata: Metadata = {
  title: "새 게시글 | SPEC Admin",
};

export default function AdminCreateNewsPostPage() {
  return (
    <>
      <section>
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-3">
          <Link
            href="/admin/posts"
            className="w-fit font-['Pretendard',sans-serif] text-sm font-medium text-[#6b6b5e] hover:text-[#16140f]"
          >
            Back to Posts
          </Link>
          <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Create News Post</h1>
          <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            Use post type SPEC News in the editor options below.
          </p>
        </div>
      </section>
      <PostEditorForm mode="create" />
    </>
  );
}
