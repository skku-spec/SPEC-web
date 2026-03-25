import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getProfilesForDirectory, getPublicAuthorHref, resolveDirectoryProfileLink } from "@/lib/public-profile";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type MemberRow = Database["public"]["Tables"]["members"]["Row"];

interface Person {
  name: string;
  slug: string;
  href: string;
  title: string;
  bio: string;
  photo: string;
  isLead?: boolean;
  isPartner?: boolean;
  isMentor?: boolean;
  twitter?: string;
  linkedin?: string;
  website?: string;
  company?: string;
  batch?: string;
}

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face";

type MemberWithProfileLink = Pick<
  MemberRow,
  | "name"
  | "slug"
  | "role"
  | "bio"
  | "photo_url"
  | "batch_tags"
  | "parts"
  | "member_type"
  | "linkedin_url"
  | "public_profile_id"
>;

function isManagingLead(member: Pick<MemberRow, "batch_tags" | "parts">): boolean {
  const tags = member.batch_tags ?? [];
  const parts = member.parts ?? [];
  const hasLeadTag = tags.some((tag) => tag.includes("회장") || tag.includes("부회장"));
  const isCommunityLead = tags.some((tag) => tag.includes("커뮤니티")) || parts.includes("커뮤니티");
  return hasLeadTag && !isCommunityLead;
}

function getMemberTitle(member: Pick<MemberRow, "role" | "member_type" | "batch_tags" | "parts">): string {
  if (member.role && member.role.trim()) {
    return member.role;
  }
  if (member.member_type === "러너") {
    return "Learner";
  }
  if (isManagingLead(member)) {
    return "Managing Lead";
  }
  return "Preneur";
}

function mapMemberToPerson(
  member: MemberWithProfileLink,
  profileLink: {
    slug: string | null;
    role: string | null;
    profile_visibility: string | null;
  } | null,
): Person {
  const publicHref = getPublicAuthorHref(profileLink);

  return {
    name: member.name,
    slug: member.slug,
    href: publicHref ?? `/people/${member.slug}`,
    title: getMemberTitle(member),
    bio: member.bio ?? "",
    photo: member.photo_url ?? DEFAULT_PHOTO,
    isLead: isManagingLead(member),
    linkedin: member.linkedin_url ?? undefined,
  };
}

async function getPersonPageData(
  slug: string,
): Promise<{ person: Person; otherPartners: Person[]; personHref: string } | null> {
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("name, slug, role, bio, photo_url, batch_tags, parts, member_type, linkedin_url, public_profile_id")
    .eq("slug", slug)
    .or("preneur_batch.eq.4기,learner_batch.eq.4기")
    .maybeSingle();

  if (!member) {
    return null;
  }

  const { data: relatedMemberRows } = await supabase
    .from("members")
    .select("name, slug, role, bio, photo_url, batch_tags, parts, member_type, linkedin_url, public_profile_id")
    .or("preneur_batch.eq.4기,learner_batch.eq.4기")
    .neq("slug", slug)
    .order("name", { ascending: true })
    .limit(4);

  const relatedMembers = (relatedMemberRows ?? []) as MemberWithProfileLink[];
  const linkedProfileIds = [member.public_profile_id, ...relatedMembers.map((relatedMember) => relatedMember.public_profile_id)].filter(
    (value): value is string => Boolean(value)
  );
  const profileLookup = await getProfilesForDirectory(
    linkedProfileIds,
    [member.slug, ...relatedMembers.map((relatedMember) => relatedMember.slug)]
  );
  const memberProfile = resolveDirectoryProfileLink(member.public_profile_id, member.slug, profileLookup);
  const person = mapMemberToPerson(member as MemberWithProfileLink, memberProfile);

  return {
    person,
    personHref: person.href,
    otherPartners: relatedMembers.map((relatedMember) =>
      mapMemberToPerson(relatedMember, resolveDirectoryProfileLink(relatedMember.public_profile_id, relatedMember.slug, profileLookup))
    ),
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const pageData = await getPersonPageData(slug);

  if (!pageData) {
    return { title: "멤버를 찾을 수 없습니다 | SPEC" };
  }

  const descriptionSource = pageData.person.bio || pageData.person.title;

  return {
    title: `${pageData.person.name} | SPEC — 성균관대 창업학회`,
    description: descriptionSource.slice(0, 160),
  };
}

export default async function PersonPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const pageData = await getPersonPageData(slug);

  if (!pageData) {
    notFound();
  }

  if (pageData.personHref !== `/people/${slug}`) {
    redirect(pageData.personHref);
  }

  const { person, otherPartners } = pageData;

  const bioParagraphs = person.bio
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <div className="px-4 pb-24 pt-12 md:pt-16">
      <div className="mx-auto max-w-[720px]">
        <Link
          href="/people"
          className="mb-8 inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[0.875rem] font-medium text-[#FF6C0F] transition-colors hover:text-[#e55c00]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="rotate-180"
          >
            <path
              d="M6 12l4-4-4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          전체 멤버
        </Link>

        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
          <figure className="h-[200px] w-[200px] shrink-0 overflow-hidden rounded-2xl bg-[#e8e8df] md:h-[260px] md:w-[260px]">
            <img
              src={person.photo}
              alt={person.name}
              width={260}
              height={260}
              className="h-full w-full object-cover"
            />
          </figure>

          <div className="flex-1">
            <h1
              className="mb-1 text-[clamp(2rem,4vw,3rem)] font-bold uppercase leading-tight tracking-tight text-[#16140f]"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {person.name}
            </h1>
            <p className="mb-1 font-['Pretendard',sans-serif] text-[1.125rem] font-normal text-[#FF6C0F]">
              {person.title}
            </p>
            {person.company && (
              <p className="mb-4 font-['Pretendard',sans-serif] text-[0.9375rem] font-normal text-[#16140f]/50">
                {person.company}
              </p>
            )}

            <div className="flex gap-3">
              {person.twitter && (
                <a
                  href={`https://twitter.com/${person.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/60 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                  aria-label={`${person.name} on Twitter`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {person.linkedin && (
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/60 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                  aria-label={`${person.name} on LinkedIn`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
              {person.website && (
                <a
                  href={person.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/60 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                  aria-label={`${person.name}'s website`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {bioParagraphs.length > 0 && (
          <article className="mt-10 border-t border-[#16140f]/10 pt-8">
            {bioParagraphs.map((paragraph, i) => (
              <p
                key={i}
                className="mb-5 font-['MaruBuri',serif] text-[17px] font-normal leading-[1.75] text-[#16140f] last:mb-0"
              >
                {paragraph}
              </p>
            ))}
          </article>
        )}

        <section className="mt-16 border-t border-[#16140f]/10 pt-10">
          <h2 className="mb-6 font-['Pretendard',sans-serif] text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[#16140f]/50">
            Other Members
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {otherPartners.map((partner) => (
              <Link
                key={partner.slug}
                href={partner.href}
                className="group block cursor-pointer rounded-lg p-3 transition-colors hover:bg-[#eceadf]"
              >
                <figure className="mb-2 aspect-square w-full overflow-hidden rounded-lg bg-[#e8e8df]">
                  <img
                    src={partner.photo}
                    alt={partner.name}
                    width={160}
                    height={160}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </figure>
                <div className="font-['MaruBuri',serif] text-[0.875rem] font-semibold leading-tight text-[#16140f] transition-colors group-hover:text-[#FF6C0F]">
                  {partner.name}
                </div>
                <div className="font-['Pretendard',sans-serif] text-[0.75rem] font-normal text-[#16140f]/50">
                  {partner.title}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
