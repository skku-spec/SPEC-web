"use client";

import { useRouter } from "next/navigation";
import type { BlogPost, TagInfo } from "@/lib/api";
import ArticleCard from "@/components/blog/ArticleCard";
import CategoryTabs from "@/components/blog/CategoryTabs";

type TagPageClientProps = {
  posts: BlogPost[];
  tags: TagInfo[];
  activeTag: string;
  totalCount: number;
};

export default function TagPageClient({
  posts,
  tags,
  activeTag,
  totalCount,
}: TagPageClientProps) {
  const router = useRouter();

  const handleTagChange = (tag: string | null) => {
    if (tag === null) {
      router.push("/blog");
    } else {
      router.push(`/blog/tag/${tag}`);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1100px] px-6 mt-6">
        <CategoryTabs
          tags={tags.map((t) => ({
            id: t.id || t.slug,
            name: t.label,
            slug: t.slug,
          }))}
          activeTag={activeTag}
          onTagChange={handleTagChange}
          totalCount={totalCount}
        />
      </div>

      <div className="mx-auto max-w-[1100px] px-6 mt-4">
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] py-4">
          전체 {totalCount}
        </p>
      </div>

      <div className="mx-auto max-w-[1100px] px-6">
        {posts.length === 0 ? (
          <p className="py-16 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            등록된 글이 없습니다.
          </p>
        ) : (
          <div>
            {posts.map((post) => (
              <ArticleCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                tags={post.tags.map((slug) => ({
                  name: slug,
                  slug,
                }))}
                authorName={post.author}
                authorCompany={post.authorCompany}
                authorJobTitle={post.authorJobTitle}
                authorAvatarUrl={post.authorAvatarUrl}
                date={post.date}
                coverImageUrl={post.imageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
