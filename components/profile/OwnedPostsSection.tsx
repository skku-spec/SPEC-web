import Link from "next/link";

import type { BlogPost } from "@/lib/api";

type OwnedPostsSectionProps = {
  posts: BlogPost[];
};

export default function OwnedPostsSection({ posts }: OwnedPostsSectionProps) {
  return (
    <section className="mt-8 rounded-lg border border-[#ddd9cc] bg-white p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">
          내가 쓴 SPEC 블로그 글
        </h2>
        <Link
          href="/blog/write"
          className="inline-flex h-8 shrink-0 items-center rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90"
        >
          새 글 쓰기
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#6b6b5e]">
          아직 작성한 SPEC 블로그 글이 없습니다.
        </p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.slug} className="flex items-start justify-between gap-4 border-t border-[#ece8db] py-4 first:border-t-0 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                {post.published ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                  >
                    {post.title}
                  </Link>
                ) : (
                  <Link
                    href={`/blog/edit/${post.slug}`}
                    className="block truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                  >
                    {post.title}
                  </Link>
                )}
                <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{post.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {post.published ? (
                  <span className="rounded-full bg-[#E6F9E6] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">
                    공개
                  </span>
                ) : (
                  <span className="rounded-full bg-[#e8e6dc] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                    초안
                  </span>
                )}
                <Link
                  href={`/blog/edit/${post.slug}`}
                  className="font-['Pretendard',sans-serif] text-xs font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
                >
                  수정
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
