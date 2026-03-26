"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

import { useUser } from "@/hooks/useUser";
import type { BlogPost, TagInfo } from "@/lib/api";
import { BLOG_WRITER_ROLES } from "@/lib/auth-shared";
import ArticleCard from "@/components/blog/ArticleCard";
import CategoryTabs from "@/components/blog/CategoryTabs";
import { SortSelect } from "@/components/blog/SortSelect";
import { Pagination } from "@/components/blog/Pagination";
import TrendingSidebar from "@/components/blog/TrendingSidebar";

type BlogPageClientProps = {
  posts: BlogPost[];
  totalCount: number;
  tags: TagInfo[];
  trendingPosts: BlogPost[];
};

function getTagLabel(tags: TagInfo[], slug: string) {
  return tags.find((tag) => tag.slug === slug)?.label ?? slug;
}

export default function BlogPageClient({
  posts,
  totalCount,
  tags,
  trendingPosts,
}: BlogPageClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "views">("newest");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [displayPosts, setDisplayPosts] = useState<BlogPost[]>(posts);
  const [displayTotalCount, setDisplayTotalCount] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);

  const { role, isAuthenticated } = useUser();
  const canWrite = isAuthenticated && BLOG_WRITER_ROLES.includes(role);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [activeTag, sort, debouncedQuery]);

  useEffect(() => {
    // Use SSR data for the initial default state to avoid a redundant fetch
    if (!activeTag && sort === "newest" && page === 1 && !debouncedQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayPosts(posts);
      setDisplayTotalCount(totalCount);
      return;
    }

    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (debouncedQuery) params.set("search", debouncedQuery);

    setIsLoading(true);
    fetch(`/api/blog/posts?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setDisplayPosts(data.posts);
        setDisplayTotalCount(data.totalCount);
      })
      .finally(() => setIsLoading(false));
  }, [activeTag, sort, page, debouncedQuery, posts, totalCount]);

  const categoryTabsTags = tags.map((t) => ({
    id: t.id,
    name: t.label,
    slug: t.slug,
  }));

  const totalPages = Math.ceil(displayTotalCount / 20);

  return (
    <section className="min-h-screen bg-[#f5f5ee] pb-24">
      <div className="mx-auto max-w-[1100px] px-6 pt-14 pb-4 text-center">
        <h1 className="font-[system-ui] text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.15] tracking-tight text-[#16140f]">
          SPEC Stories
        </h1>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 mt-6">
        <CategoryTabs
          tags={categoryTabsTags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
        />
      </div>

      <div className="mx-auto max-w-[1100px] px-6 mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
          <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            전체 {displayTotalCount}
          </span>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b5e]" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="h-[38px] w-full sm:w-[280px] rounded-lg border border-[#ddd9cc] bg-white pl-9 pr-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none"
              />
            </div>

            <SortSelect value={sort} onChange={setSort} />

            {canWrite && (
              <Link
                href="/blog/write"
                className="h-8 shrink-0 inline-flex items-center rounded-md bg-[#FF6C0F] px-4 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-opacity hover:opacity-85"
              >
                글쓰기
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 flex gap-10">
        <div
          className={`flex-1 min-w-0${isLoading ? " opacity-60 pointer-events-none transition-opacity" : ""}`}
        >
          {displayPosts.length === 0 ? (
            <div className="py-16 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
              등록된 글이 없습니다.
            </div>
          ) : (
            displayPosts.map((post) => (
              <ArticleCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                tags={post.tags.map((slug) => ({
                  name: getTagLabel(tags, slug),
                  slug,
                }))}
                authorName={post.author}
                authorCompany={post.authorCompany}
                authorJobTitle={post.authorJobTitle}
                authorAvatarUrl={post.authorAvatarUrl}
                date={post.date}
                coverImageUrl={post.imageUrl}
              />
            ))
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        <TrendingSidebar posts={trendingPosts} />
      </div>
    </section>
  );
}
