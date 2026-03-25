"use client";

type TagInfo = { id: string; name: string; slug: string };

type CategoryTabsProps = {
  tags: TagInfo[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  totalCount?: number;
};

export default function CategoryTabs({
  tags,
  activeTag,
  onTagChange,
  totalCount,
}: CategoryTabsProps) {
  return (
    <div
      className="category-tabs-scroll flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style>{`
        .category-tabs-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <button
        type="button"
        onClick={() => onTagChange(null)}
        className={
          activeTag === null
            ? "shrink-0 whitespace-nowrap rounded-full bg-[#16140f] px-4 py-1.5 font-['Pretendard',sans-serif] text-sm font-semibold text-white"
            : "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 font-['Pretendard',sans-serif] text-sm font-medium text-[#6b6b5e] transition-colors hover:bg-[#e8e6dc] hover:text-[#16140f]"
        }
      >
        {totalCount !== undefined ? `전체보기 (${totalCount})` : "전체보기"}
      </button>

      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onTagChange(tag.slug)}
          className={
            activeTag === tag.slug
              ? "shrink-0 whitespace-nowrap rounded-full bg-[#16140f] px-4 py-1.5 font-['Pretendard',sans-serif] text-sm font-semibold text-white"
              : "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 font-['Pretendard',sans-serif] text-sm font-medium text-[#6b6b5e] transition-colors hover:bg-[#e8e6dc] hover:text-[#16140f]"
          }
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
