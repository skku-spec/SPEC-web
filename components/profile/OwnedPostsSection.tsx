import Link from "next/link";

import type { BlogPost } from "@/lib/api";

type OwnedPostsSectionProps = {
  posts: BlogPost[];
};

export default function OwnedPostsSection({ posts }: OwnedPostsSectionProps) {
  return (
    <section className="mt-8 rounded-2xl border border-[#d7d5ca] bg-[#fcfcf7] p-6 shadow-[0_14px_35px_rgba(22,20,15,0.05)] md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-['Pretendard',sans-serif] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#16140f]/45">
            My Writing
          </p>
          <h2 className="mt-2 font-[system-ui] text-[clamp(1.35rem,3vw,1.8rem)] font-black leading-tight text-[#16140f]">
            내가 쓴 SPEC 블로그 글
          </h2>
        </div>
        <Link
          href="/blog/write"
          className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#FF6C0F] px-4 font-['Pretendard',sans-serif] text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          새 글 쓰기
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#6b6b5e]">
          아직 작성한 SPEC 블로그 글이 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-[#e1dfd4]">
          {posts.map((post) => (
            <li key={post.slug} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                {post.published ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block truncate font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                  >
                    {post.title}
                  </Link>
                ) : (
                  <Link
                    href={`/blog/edit/${post.slug}`}
                    className="block truncate font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                  >
                    {post.title}
                  </Link>
                )}
                <p className="mt-1 font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">{post.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {post.published ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-['Pretendard',sans-serif] text-[11px] font-semibold text-green-700">
                    공개
                  </span>
                ) : (
                  <span className="rounded-full bg-[#e8e6dc] px-2.5 py-0.5 font-['Pretendard',sans-serif] text-[11px] font-semibold text-[#6b6b5e]">
                    초안
                  </span>
                )}
                <Link
                  href={`/blog/edit/${post.slug}`}
                  className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
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
