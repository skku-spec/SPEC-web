import Link from "next/link";

type AuthorBioProps = {
  name: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  avatarUrl?: string;
  profileHref?: string;
};

export default function AuthorBio({
  name,
  company,
  jobTitle,
  bio,
  avatarUrl,
  profileHref,
}: AuthorBioProps) {
  const subtitle =
    company && jobTitle
      ? `${company} · ${jobTitle}`
      : company || jobTitle || null;

  const nameEl = profileHref ? (
    <Link
      href={profileHref}
      className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f] hover:text-[#FF6C0F] transition-colors"
    >
      {name}
    </Link>
  ) : (
    <span className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
      {name}
    </span>
  );

  return (
    <div className="border-t border-[#ddd9cc] pt-8 mt-10">
      <div className="flex gap-4 items-start">
        <div className="h-14 w-14 rounded-full bg-[#e8e6dc] shrink-0 grid place-items-center overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#4a4a40]">
              {name.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          {nameEl}

          {subtitle && (
            <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] mt-0.5">
              {subtitle}
            </p>
          )}

          {bio && (
            <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] mt-2 line-clamp-3">
              {bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
