import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getBlogPosts, getBlogTags, getTagLabel } from "@/lib/api";

export const revalidate = 3600;

export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const label = await getTagLabel(tag);

  return {
    title: `${label} | SPEC 소식`,
    description: `SPEC의 ${label} 관련 소식입니다.`,
  };
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const tags = await getBlogTags();
  const posts = await getBlogPosts(tag);
  const tagExists = tags.some((currentTag) => currentTag.slug === tag);

  if (!tagExists) {
    notFound();
  }

  const label = await getTagLabel(tag);
  const tagLabelBySlug = new Map(tags.map((item) => [item.slug, item.label]));

  return (
    <section className="min-h-screen pb-24">
      <div className="border-b border-[#ddd9cc]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-4 md:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-['Pretendard',sans-serif] text-[14px] text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
          >
            <ArrowLeftIcon />
            All Posts
          </Link>
          <span className="text-[#c5c3b8]">/</span>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6C0F] px-3.5 py-1 font-['Pretendard',sans-serif] text-[13px] font-medium text-white">
            {label}
            <Link
              href="/blog"
              className="transition-opacity hover:opacity-70"
              aria-label="Clear tag filter"
            >
              <XIcon />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pt-10 md:px-8">
        <div className="flex gap-12">
          <div className="min-w-0 flex-1">
            <h1 className="mb-2 font-[system-ui] text-[clamp(1.75rem,3vw,2.5rem)] font-black leading-tight tracking-tight text-[#16140f]">
              {label}
            </h1>
            <p className="mb-8 font-['Pretendard',sans-serif] text-[15px] text-[#6b6b5e]">
              {posts.length} post{posts.length !== 1 && "s"}
            </p>

            {posts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-['Pretendard',sans-serif] text-[16px] text-[#6b6b5e]">
                  No posts found for this tag.
                </p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-[#ddd9cc]">
                {posts.map((post) => (
                  <article key={post.slug} className="py-7 first:pt-0">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group mb-1 block font-[system-ui] text-[20px] font-black leading-snug text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                    >
                      {post.title}
                    </Link>
                    <p className="mb-2 font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
                      by <span className="text-[#16140f]">{post.author}</span> &middot; {post.date}
                    </p>
                    <p className="mb-3 font-['Pretendard',sans-serif] text-[15px] font-normal leading-relaxed text-[#4a4a40]">
                      {post.excerpt}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {post.tags.map((postTag) => (
                        <Link
                          key={postTag}
                          href={`/blog/tag/${postTag}`}
                          className={`rounded-full px-2.5 py-0.5 font-['Pretendard',sans-serif] text-[11px] font-medium transition-colors ${
                            postTag === tag
                              ? "bg-[#FF6C0F] text-white"
                              : "bg-[#e8e6dc] text-[#4a4a40] hover:bg-[#FF6C0F] hover:text-white"
                          }`}
                        >
                          {tagLabelBySlug.get(postTag) ?? postTag}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
                    >
                      Read More <ArrowIcon />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="hidden w-[220px] shrink-0 lg:block">
            <p className="mb-4 font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#16140f]">
              Categories
            </p>
            <div className="flex flex-col gap-1.5">
              {tags.map((currentTag) => (
                <Link
                  key={currentTag.slug}
                  href={`/blog/tag/${currentTag.slug}`}
                  className={`rounded-lg px-3 py-1.5 font-['Pretendard',sans-serif] text-[14px] transition-colors ${
                    currentTag.slug === tag
                      ? "bg-[#FF6C0F] font-medium text-white"
                      : "text-[#4a4a40] hover:bg-[#e8e6dc] hover:text-[#16140f]"
                  }`}
                >
                  {currentTag.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
