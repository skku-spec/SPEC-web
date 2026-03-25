import Link from "next/link";
import type { BlogPost } from "@/lib/api";

type TrendingSidebarProps = {
  posts: BlogPost[];
};

export default function TrendingSidebar({ posts }: TrendingSidebarProps) {
  const items = posts.slice(0, 9);

  return (
    <aside className="hidden lg:block w-[280px] shrink-0">
      <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] mb-4">
        오늘 많이 본 아티클
      </h2>

      <div>
        {items.map((post, i) => {
          const rank = i + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={post.slug}
              className="py-3 border-b border-[#ece8db] last:border-b-0"
            >
              <span
                className={`font-['Pretendard',sans-serif] text-xl font-black ${
                  isTop3 ? "text-[#FF6C0F]" : "text-[#6b6b5e]"
                }`}
              >
                {rank}
              </span>

              <Link
                href={`/blog/${post.slug}`}
                className="font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f] line-clamp-2 hover:text-[#FF6C0F] transition-colors mt-1 block"
              >
                {post.title}
              </Link>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-5 w-5 rounded-full bg-[#e8e6dc] grid place-items-center shrink-0 overflow-hidden">
                  {post.authorAvatarUrl ? (
                    <img
                      src={post.authorAvatarUrl}
                      alt={post.author}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#4a4a40]">
                      {post.author.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  {post.author} · {post.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
