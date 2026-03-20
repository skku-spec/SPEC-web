"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { useUser } from "@/hooks/useUser";
import type { BlogPost, TagInfo } from "@/lib/api";
import type { UserRole } from "@/lib/auth";

const WRITER_ROLES: UserRole[] = ["runner", "preneur", "admin"];

type BlogPageClientProps = {
  posts: BlogPost[];
  tags: TagInfo[];
};

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

function getTagLabel(tags: TagInfo[], slug: string) {
  return tags.find((tag) => tag.slug === slug)?.label ?? slug;
}

export default function BlogPageClient({ posts, tags }: BlogPageClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "news" | "blog">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { role, isAuthenticated } = useUser();

  const tabs = [
    { id: "all" as const, label: "전체" },
    { id: "news" as const, label: "SPEC 소식" },
    { id: "blog" as const, label: "SPEC 블로그" },
  ];

  const canWrite = isAuthenticated && WRITER_ROLES.includes(role);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    
    // Search filter
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.excerpt.toLowerCase().includes(q) ||
          post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    
    // Tab filter
    if (activeTab !== "all") {
      result = result.filter((post) => post.type === activeTab);
    }
    
    return result;
  }, [activeTab, posts, debouncedQuery]);

  const featuredPost = useMemo(
    () => filteredPosts.find((post) => post.featured) ?? filteredPosts[0],
    [filteredPosts],
  );

  const recentPosts = useMemo(
    () => filteredPosts.filter((post) => post.slug !== featuredPost?.slug).slice(0, 3),
    [featuredPost?.slug, filteredPosts],
  );

  const allPosts = useMemo(
    () => filteredPosts.filter((post) => post.slug !== featuredPost?.slug),
    [featuredPost?.slug, filteredPosts],
  );

  return (
    <section className="min-h-screen bg-[#f5f5ee] pb-24">
      <div>
        <div className="mx-auto max-w-[1100px] px-6 pt-14 pb-8 text-center">
          <h1
            className="text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.15] tracking-tight uppercase text-[#16140f]"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            SPEC Stories
          </h1>
        </div>
      </div>

      <div>
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4 md:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] font-[500] border-b-[2px] transition-colors ${
                  activeTab === tab.id
                    ? "border-b-[oklch(0.705_0.213_47.604)] text-[#16140f]"
                    : "border-b-transparent text-[#8a8a7e]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative flex-1 md:w-[320px] md:flex-none">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="font-['Pretendard',sans-serif] h-[38px] w-full min-w-0 flex-1 rounded-[6px] border-[1px] border-[#d9d9cc] px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[oklch(0.705_0.213_47.604)] md:w-[320px] md:flex-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b5e] hover:text-[#16140f]"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
            {canWrite && (
              <Link
                href="/blog/write"
                className="inline-flex h-[38px] shrink-0 items-center rounded-[6px] bg-[#FF6C0F] px-4 font-['Pretendard',sans-serif] text-[14px] font-medium text-white transition-opacity hover:opacity-85"
              >
                글쓰기
              </Link>
            )}
        </div>
      </div>

      {featuredPost && (
        <div>
          <div className="mx-auto max-w-[1200px] px-6 py-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
              <div className="max-w-[518px] shrink-0">
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {featuredPost.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag}`}
                      className="inline-flex rounded-[4px] bg-[oklch(0.928_0.008_231.39)] px-[8px] py-[2px] font-['Pretendard',sans-serif] text-[12px] font-[500] text-[#4a4a40] transition-opacity hover:opacity-70"
                    >
                      {getTagLabel(tags, tag)}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="group mb-3 block font-['Pretendard',sans-serif] text-[30px] font-semibold leading-[1.2] tracking-tight text-[#000000] transition-colors hover:text-[#FF6C0F]"
                >
                  {featuredPost.title}
                </Link>
                <p className="sr-only font-['Pretendard',sans-serif] text-[14px] text-[#5a6270]">
                  {featuredPost.author}
                </p>
                <p className="mb-5 font-['MaruBuri',serif] text-[18px] font-normal leading-relaxed text-[#000000]">
                  {featuredPost.excerpt}
                </p>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 font-['Pretendard',sans-serif] text-[16px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
                >
                  더 읽기 <ArrowIcon />
                </Link>
              </div>
              {featuredPost.imageUrl && (
                <Link href={`/blog/${featuredPost.slug}`} className="block flex-1">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={featuredPost.imageUrl}
                      alt={featuredPost.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div id="recent-posts">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <h3 className="mb-8 font-['Pretendard',sans-serif] text-[20px] font-semibold text-[oklch(0.705_0.213_47.604)]">
            최근 소식
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article key={post.slug} className="group">
                {post.imageUrl && (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mb-4 block overflow-hidden rounded-lg"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </Link>
                )}
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag}`}
                      className="inline-flex rounded-[4px] bg-[oklch(0.928_0.008_231.39)] px-[8px] py-[2px] font-['Pretendard',sans-serif] text-[12px] font-[500] text-[#4a4a40] transition-opacity hover:opacity-70"
                    >
                      {getTagLabel(tags, tag)}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mb-2 block font-['Pretendard',sans-serif] text-[20px] font-semibold leading-snug text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                >
                  {post.title}
                </Link>
                <p className="sr-only font-['Pretendard',sans-serif] text-[14px] text-[#5a6270]">
                  {post.author}
                </p>
                <p className="mb-3 font-['MaruBuri',serif] text-[18px] font-normal leading-relaxed text-[#4a4a40] line-clamp-2">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[16px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
                >
                  더 읽기 <ArrowIcon />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div id="all-posts" className="mx-auto max-w-[1200px] px-6 pt-12">
        <div className="flex gap-12">
          <div className="min-w-0 flex-1">
            <h3 className="mb-6 font-['Pretendard',sans-serif] text-[20px] font-semibold text-[oklch(0.705_0.213_47.604)]">
              전체 글
            </h3>
            {allPosts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[#6b6b5e] font-['Pretendard',sans-serif]">
                  {debouncedQuery ? `"${debouncedQuery}"에 대한 검색 결과가 없습니다.` : "게시글이 없습니다."}
                </p>
              </div>
            ) : (
            <div className="space-y-0">
              {allPosts.map((post) => (
                <article key={post.slug} className="py-7 first:pt-0">
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog/tag/${tag}`}
                        className="inline-flex rounded-[4px] bg-[oklch(0.928_0.008_231.39)] px-[8px] py-[2px] font-['Pretendard',sans-serif] text-[12px] font-[500] text-[#4a4a40] transition-opacity hover:opacity-70"
                      >
                        {getTagLabel(tags, tag)}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group mb-1 block font-['Pretendard',sans-serif] text-[30px] font-semibold leading-snug text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                  >
                    {post.title}
                  </Link>
                  <p className="sr-only mb-2 font-['Pretendard',sans-serif] text-[14px] text-[#5a6270]">
                    <span className="text-[#16140f]">{post.author}</span> &middot; {post.date}
                  </p>
                  <p className="mb-3 font-['MaruBuri',serif] text-[18px] font-normal leading-relaxed text-[#4a4a40]">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[16px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
                  >
                    더 읽기 <ArrowIcon />
                  </Link>
                </article>
              ))}
            </div>
            )}
            </div>
          </div>

          <aside className="hidden w-[220px] shrink-0 lg:block">
            <p className="mb-4 font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#16140f]">
              카테고리
            </p>
            <div className="flex flex-col gap-1.5">
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className="rounded-lg px-3 py-1.5 font-['Pretendard',sans-serif] text-[14px] text-[#4a4a40] transition-colors hover:bg-[#e8e6dc] hover:text-[#FF6C0F]"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
