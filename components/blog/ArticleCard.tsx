import Image from "next/image";
import Link from "next/link";

import { formatRelativeTime } from "@/lib/utils/relativeTime";

type ArticleCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  tags: { name: string; slug: string }[];
  authorName: string;
  authorCompany?: string;
  authorJobTitle?: string;
  authorAvatarUrl?: string;
  date: string;
  coverImageUrl?: string;
};

export default function ArticleCard({
  slug,
  title,
  excerpt,
  tags,
  authorName,
  authorCompany,
  authorJobTitle,
  authorAvatarUrl,
  date,
  coverImageUrl,
}: ArticleCardProps) {
  const authorInitial = authorName.charAt(0);

  const metaParts: string[] = [];
  if (authorCompany) metaParts.push(authorCompany);
  if (authorJobTitle) metaParts.push(authorJobTitle);
  const metaText = metaParts.join(" · ");

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block border-t border-[#ece8db] py-5 first:border-t-0"
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]"
                >
                  # {tag.name}
                </span>
              ))}
            </div>
          )}

          <h3 className="mt-1.5 font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f] line-clamp-2 transition-colors group-hover:text-[#FF6C0F]">
            {title}
          </h3>

          <p className="mt-1.5 font-['Pretendard',sans-serif] text-sm text-[#4a4a40] line-clamp-2">
            {excerpt}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8e6dc]">
              {authorAvatarUrl ? (
                <Image
                  src={authorAvatarUrl}
                  alt={authorName}
                  width={28}
                  height={28}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  {authorInitial}
                </span>
              )}
            </div>

            <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {authorName}
            </span>

            {metaText && (
              <>
                <span className="text-[#ddd9cc]">&middot;</span>
                <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  {metaText}
                </span>
              </>
            )}

            <span className="text-[#ddd9cc]">&middot;</span>
            <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              {formatRelativeTime(date)}
            </span>
          </div>
        </div>

        {coverImageUrl && (
          <div className="hidden w-[200px] shrink-0 md:block">
            <Image
              src={coverImageUrl}
              alt={title}
              width={200}
              height={150}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
