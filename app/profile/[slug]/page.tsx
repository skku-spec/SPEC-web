import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getPublicAuthorProfilePageData,
  getDisplayRoleLine,
  getPublicProfileLinks,
} from "@/lib/public-profile";
import { CURRENT_BATCH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { PublicProfile, PublicProfileExperience } from "@/lib/public-profile";
import type { BlogPost } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicAuthorProfilePageData(slug);

  if (!data) {
    return { title: "프로필을 찾을 수 없어요 | SPEC" };
  }

  const description = data.profile.headline || getDisplayRoleLine(data.profile) || "SPEC 멤버";

  return {
    title: `${data.profile.name} | SPEC`,
    description,
    alternates: { canonical: `/profile/${slug}` },
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

function ExternalLinkIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "S";
}

function formatExperienceDate(dateString: string | null): string {
  if (!dateString) return "";
  const [year, month] = dateString.split("-");
  if (!year || !month) return dateString;
  return `${year}.${month}`;
}

function HeroSection({ profile }: { profile: PublicProfile }) {
  const roleLine = getDisplayRoleLine(profile);
  const links = getPublicProfileLinks(profile);

  return (
    <header className="pb-10">
      <div className="flex flex-col items-center text-center">
        {profile.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photo}
            alt={`${profile.name} 프로필 사진`}
            className="h-28 w-28 shrink-0 rounded-full object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#FF6C0F] text-[38px] font-bold text-white sm:h-32 sm:w-32 sm:text-[44px]">
            {getInitials(profile.name)}
          </div>
        )}

        <div className="mt-5 min-w-0">
          <h1 className="font-[system-ui] text-[clamp(2.2rem,5vw,3.2rem)] font-black leading-[1.1] tracking-tight text-[#16140f]">
            {profile.name}
          </h1>

          {profile.headline && (
            <p className="mt-2 font-['Pretendard',sans-serif] text-[17px] font-normal leading-relaxed text-[#16140f]/70">
              {profile.headline}
            </p>
          )}

          {roleLine && (
            <p className="mt-1 font-['Pretendard',sans-serif] text-[14px] text-[#6b6b5e]">
              {roleLine}
            </p>
          )}

          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-[4px] bg-[#16140f]/5 px-2 py-0.5 font-['Pretendard',sans-serif] text-[12px] font-medium text-[#4a4a40] transition-colors hover:text-[#FF6C0F]"
                >
                  {link.label}
                  <ExternalLinkIcon />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AboutSection({ bio }: { bio: string }) {
  if (!bio.trim()) return null;

  return (
    <section className="pt-6 pb-2">
      <p className="font-['MaruBuri',serif] text-[16px] font-normal leading-[1.9] text-[#16140f] whitespace-pre-line">
        {bio}
      </p>
    </section>
  );
}

function ExperienceSection({ experiences }: { experiences: PublicProfileExperience[] }) {
  if (experiences.length === 0) return null;

  return (
    <section className="border-t border-[#ddd9cc] pt-10 pb-2">
      <p className="mb-5 font-['Pretendard',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6b5e]">
        Experience
      </p>
      <div className="space-y-0">
        {experiences.map((exp, idx) => {
          const startLabel = formatExperienceDate(exp.start_date);
          const endLabel = exp.is_current ? "현재" : formatExperienceDate(exp.end_date);
          const dateRange =
            startLabel && endLabel
              ? `${startLabel} – ${endLabel}`
              : startLabel || endLabel || null;

          return (
            <div
              key={exp.id}
              className={`py-5 ${
                idx < experiences.length - 1 ? "border-b border-[#e8e6dc]" : ""
              }`}
            >
              <p className="font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#16140f]">
                {exp.title}
              </p>
              <p className="mt-0.5 font-['Pretendard',sans-serif] text-[14px] text-[#6b6b5e]">
                {exp.organization}
              </p>
              {dateRange && (
                <p className="mt-1 font-['Pretendard',sans-serif] text-[12px] text-[#16140f]/45">
                  {dateRange}
                </p>
              )}
              {exp.description.trim() && (
                <p className="mt-2 font-['Pretendard',sans-serif] text-[13px] font-normal leading-relaxed text-[#4a4a40]">
                  {exp.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WritingSection({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-[#ddd9cc] pt-10">
      <p className="mb-5 font-['Pretendard',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6b5e]">
        Writing
      </p>
      <div className="space-y-0 divide-y divide-[#e8e6dc]">
        {posts.map((post) => (
          <article key={post.slug} className="py-6 first:pt-0">
            {post.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-x-2 gap-y-1">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex text-[11px] font-['Pretendard',sans-serif] font-medium uppercase tracking-[0.08em] text-[#6b6b5e]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/blog/${post.slug}`}
              className="mb-1 block font-['Pretendard',sans-serif] text-[22px] font-semibold leading-[1.25] tracking-tight text-[#16140f] transition-colors hover:text-[#FF6C0F]"
            >
              {post.title}
            </Link>
            <p className="mb-2 font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
              {post.date}
            </p>
            {post.excerpt && (
              <p className="mb-3 font-['MaruBuri',serif] text-[15px] font-normal leading-relaxed text-[#4a4a40] line-clamp-3">
                {post.excerpt}
              </p>
            )}
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
            >
              더 읽기 <ArrowIcon />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function PublicAuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicAuthorProfilePageData(slug);

  if (!data) {
    const supabase = await createClient();
    const { data: member } = await supabase
      .from("members")
      .select("slug")
      .eq("slug", slug)
      .eq("preneur_batch", CURRENT_BATCH)
      .maybeSingle();

    if (member) {
      redirect(`/people/${slug}`);
    }

    notFound();
  }

  const { profile, experiences, posts } = data;

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-[720px] px-4 pt-14 md:px-8 md:pt-20">
        <Link
          href="/people"
          className="mb-8 inline-flex items-center gap-2 font-['Pretendard',sans-serif] text-[14px] text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
        >
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
          People
        </Link>

        <HeroSection profile={profile} />

        <div className="space-y-8">
          <AboutSection bio={profile.bio} />
          <ExperienceSection experiences={experiences} />
          <WritingSection posts={posts} />
        </div>

        {!profile.bio.trim() && experiences.length === 0 && posts.length === 0 && (
          <p className="mt-12 text-center font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/40">
            아직 공개된 정보가 없어요.
          </p>
        )}
      </div>
    </div>
  );
}
