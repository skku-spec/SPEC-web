import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getBlogPosts, getBlogTags, getTagLabel } from "@/lib/api";
import TagPageClient from "./TagPageClient";

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
  const { posts, totalCount } = await getBlogPosts({ tag });
  const tagExists = tags.some((currentTag) => currentTag.slug === tag);

  if (!tagExists) {
    notFound();
  }

  const label = await getTagLabel(tag);

  return (
    <section className="min-h-screen bg-[#f5f5ee] pb-24">
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

      <div className="mx-auto max-w-[1100px] px-6 pt-10">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
          {label}
        </h1>
      </div>

      <TagPageClient
        posts={posts}
        tags={tags}
        activeTag={tag}
        totalCount={totalCount}
      />
    </section>
  );
}
