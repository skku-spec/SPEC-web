import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
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

interface TeamDescription {
  name: string;
  description: string;
}

const TEAM_DESCRIPTIONS: TeamDescription[] = [
  {
    name: "Contents",
    description:
      "창업가 인터뷰 영상 기획·제작, 알럼나이 성공 사례 콘텐츠화, 릴스·숏폼 제작, 유튜브·인스타그램 운영",
  },
  {
    name: "Partnerships",
    description:
      "VC 네트워킹, IR 지원, 창업 멘토 섭외, 데모데이 심사위원·연사 섭외, 기관 협업",
  },
  {
    name: "Engineering",
    description:
      "내부 소프트웨어 개발, 멘토링 신청·과제 관리·KPI 트래킹 시스템 구축, 운영 업무 자동화",
  },
  {
    name: "Design",
    description:
      "포스터·카드뉴스 디자인, 브랜드 아이덴티티 관리, 홍보물 제작, SNS 콘텐츠 디자인",
  },
  {
    name: "Community",
    description: "멤버 간 네트워킹, 알럼나이·동문 모임 운영, 커뮤니티 활성화",
  },
];

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face";

const MEMBER_PHOTOS: Record<string, string> = {
  "권민재": "/images/member/권민재.png",
  "김동인": "/images/member/김동인.png",
  "김주현": "/images/member/김주현.png",
  "김혜민": "/images/member/김혜민.png",
  "류영상": "/images/member/류영상.png",
  "서원준": "/images/member/서원준.png",
  "신지은": "/images/member/신지은.png",
  "이송목": "/images/member/이송목.png",
  "이연서": "/images/member/이연서.png",
  "임영빈": "/images/member/임영빈.png",
  "장지민": "/images/member/장지민.png",
  "전도현": "/images/member/전도현.png",
  "전선희": "/images/member/전선희.png",
  "최윤정": "/images/member/최윤정.png",
  "한지상": "/images/member/한지상.png",
};

type MemberWithProfileLink = Pick<
  MemberRow,
  "name" | "slug" | "role" | "bio" | "photo_url" | "batch_tags" | "public_profile_id"
>;

export const metadata: Metadata = {
  title: "멤버 | SPEC — 성균관대 창업학회",
  description: "SPEC 창업학회의 Managing Lead, Preneur, Learner를 만나보세요.",
};

function isManagingLead(member: Pick<MemberRow, "name" | "batch_tags">): boolean {
  if (member.name === "전도현" || member.name === "한지상") {
    return true;
  }

  return (member.batch_tags ?? []).some(
    (tag) => tag.includes("4기 회장") || tag.includes("4기 부회장"),
  );
}

function getMemberTitle(member: Pick<MemberRow, "role" | "name" | "batch_tags">): string {
  if (member.role && member.role.trim()) {
    return member.role;
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
    photo: MEMBER_PHOTOS[member.name] ?? member.photo_url ?? DEFAULT_PHOTO,
    isLead: isManagingLead(member),
  };
}

function LeadCard({ person }: { person: Person }) {
  return (
    <li>
      <Link href={person.href} className="group -mx-3 flex cursor-pointer gap-5 rounded-xl px-3 py-6 transition-colors hover:bg-[#eceadf]">
        <figure className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full bg-[#e8e8df]">
          <img
            src={person.photo}
            alt={person.name}
            width={100}
            height={100}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </figure>
        <div className="flex flex-col">
          <div className="mb-1">
            <div className="font-['MaruBuri',serif] text-[1.125rem] font-semibold leading-tight text-[#16140f] transition-colors group-hover:text-[#FF6C0F]">
              {person.name}
            </div>
            <div className="font-['Pretendard',sans-serif] text-[0.875rem] font-normal text-[#16140f]/70">
              {(() => {
                if (!person.isLead) return person.title;
                const parts = person.title.split(" | ");
                return parts.length > 1 ? (
                  <>
                    <span className="text-[#FF6C0F]">{parts[0]}</span>
                    {" | "}
                    {parts.slice(1).join(" | ")}
                  </>
                ) : (
                  <span className="text-[#FF6C0F]">{person.title}</span>
                );
              })()}
            </div>
          </div>
          {person.bio && (
            <p className="whitespace-pre-line font-['MaruBuri',serif] text-[0.875rem] font-normal leading-relaxed text-[#16140f]/80">
              {person.bio}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function PreneurCard({ person }: { person: Person }) {
  return (
    <li>
      <Link href={person.href} className="group -mx-2 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-[#eceadf]">
        <figure className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-full bg-[#e8e8df]">
          <img
            src={person.photo}
            alt={person.name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </figure>
        <div>
          <div className="font-['MaruBuri',serif] text-[0.9375rem] font-semibold leading-tight text-[#16140f] transition-colors group-hover:text-[#FF6C0F]">
            {person.name}
          </div>
          <div className="font-['Pretendard',sans-serif] text-[0.8125rem] font-normal text-[#16140f]/60">
            {(() => {
              if (!person.isLead) return person.title;
              const parts = person.title.split(" | ");
              return parts.length > 1 ? (
                <>
                  <span className="text-[#FF6C0F]">{parts[0]}</span>
                  {" | "}
                  {parts.slice(1).join(" | ")}
                </>
              ) : (
                <span className="text-[#FF6C0F]">{person.title}</span>
              );
            })()}
          </div>
          {person.bio && (
            <p className="mt-1 whitespace-pre-line font-['MaruBuri',serif] text-[0.8125rem] font-normal leading-relaxed text-[#16140f]/60">
              {person.bio}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function TeamDescriptionBlock({ team }: { team: TeamDescription }) {
  return (
    <div className="py-2">
      <span className="font-['Pretendard',sans-serif] text-[0.875rem] font-semibold text-[#16140f]">
        {team.name}
      </span>
      <span className="font-['Pretendard',sans-serif] text-[0.875rem] font-normal text-[#16140f]/60">
        {" — "}
        {team.description}
      </span>
    </div>
  );
}

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: memberRows } = await supabase
    .from("members")
    .select("name, slug, role, bio, photo_url, batch_tags, public_profile_id")
    .eq("preneur_batch", "4기")
    .order("name", { ascending: true });

  const preneurMembers = (memberRows ?? []) as MemberWithProfileLink[];
  const linkedProfileIds = preneurMembers
    .map((member) => member.public_profile_id)
    .filter((value): value is string => Boolean(value));
  const profileLookup = await getProfilesForDirectory(linkedProfileIds, preneurMembers.map((member) => member.slug));

  const managingLeads = preneurMembers
    .filter((member) => isManagingLead(member))
    .map((member) => mapMemberToPerson(member, resolveDirectoryProfileLink(member.public_profile_id, member.slug, profileLookup)));

  const preneurs = preneurMembers
    .filter((member) => !isManagingLead(member))
    .map((member) => mapMemberToPerson(member, resolveDirectoryProfileLink(member.public_profile_id, member.slug, profileLookup)));

  return (
    <div className="px-4 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[1100px]">
        <PageHeader title="People" />

        <section className="mb-12">
          <h2 className="mb-2 border-b border-[#16140f]/10 pb-3 font-['Pretendard',sans-serif] text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[#16140f]/50">
            Managing Lead
          </h2>
          <ul>
            {managingLeads.map((person) => (
              <LeadCard key={person.slug} person={person} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-2 border-b border-[#16140f]/10 pb-3 font-['Pretendard',sans-serif] text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[#16140f]/50">
            Preneur
          </h2>
          <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {preneurs.map((person) => (
              <PreneurCard key={person.slug} person={person} />
            ))}
          </ul>

          <div className="mt-8 border-t border-[#16140f]/10 pt-6">
            <h3 className="mb-3 font-['Pretendard',sans-serif] text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[#16140f]/50">
              Teams
            </h3>
            <div className="space-y-1">
              {TEAM_DESCRIPTIONS.map((team) => (
                <TeamDescriptionBlock key={team.name} team={team} />
              ))}
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-2 border-b border-[#16140f]/10 pb-3 font-['Pretendard',sans-serif] text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[#16140f]/50">
            Learner
          </h2>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-['MaruBuri',serif] text-[1.125rem] font-semibold text-[#16140f]/40">
              아직 없음
            </p>
            <p className="mt-1 font-['Pretendard',sans-serif] text-[0.875rem] font-normal text-[#16140f]/30">
              모집 중
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
