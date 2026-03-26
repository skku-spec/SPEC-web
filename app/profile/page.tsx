import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import { requireAuth, normalizeRole, canWrite } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";
import LogoutButton from "@/app/profile/LogoutButton";
import OwnedPostsSection from "@/components/profile/OwnedPostsSection";
import ProfileAvatarEditor from "@/components/profile/ProfileAvatarEditor";
import PublicProfileEditor from "@/components/profile/PublicProfileEditor";
import { getPublicAuthorHref } from "@/lib/public-profile";
import { getProfileExperiencesForOwner } from "@/lib/public-profile";
import { getBlogPostsByAuthorIdForOwner } from "@/lib/api";

type RoleMeta = {
  label: string;
  className: string;
};

const ROLE_META: Record<UserRole, RoleMeta> = {
  outsider: { label: "외부인", className: "bg-[#f0efe6] text-[#6b6b5e]" },
  learner: { label: "러너", className: "bg-[#E6F9E6] text-[#2f9e44]" },
  alumni: { label: "동문", className: "bg-[#E8F0FE] text-[#2563EB]" },
  preneur: { label: "프러너", className: "bg-[#FFF0E5] text-[#FF6C0F]" },
};

export const metadata: Metadata = {
  title: "내 프로필 | SPEC",
  description: "SPEC 멤버 프로필 페이지",
};

function formatDate(dateValue?: string | null) {
  if (!dateValue) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateValue));
}

export default async function ProfilePage() {
  const { user, profile } = await requireAuth();

  const name =
    profile?.first_name && profile?.last_name
      ? `${profile.last_name}${profile.first_name}`
      : profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "SPEC 멤버";
  const email = user.email || "-";
  const role = normalizeRole(profile?.role);
  const joinedAt = formatDate(profile?.created_at ?? user.created_at);
  const roleMeta = ROLE_META[role];
  const username = profile?.username?.trim() || "-";
  const firstName = profile?.first_name?.trim() || "-";
  const lastName = profile?.last_name?.trim() || "-";
  const linkedinUrl = profile?.linkedin_url?.trim() || "";
  const canEditPublicProfile = canWrite(role);
  const publicProfileHref = getPublicAuthorHref({
    slug: profile?.slug,
    role: profile?.role,
    profile_visibility: profile?.profile_visibility,
  });

  let experiences: Awaited<ReturnType<typeof getProfileExperiencesForOwner>> = [];
  let ownedPosts: Awaited<ReturnType<typeof getBlogPostsByAuthorIdForOwner>> = [];
  if (canEditPublicProfile) {
    try {
      [experiences, ownedPosts] = await Promise.all([
        getProfileExperiencesForOwner(user.id),
        getBlogPostsByAuthorIdForOwner(user.id),
      ]);
    } catch {
      experiences = [];
      ownedPosts = [];
    }
  }

  return (
    <div className="min-h-screen px-5 py-6 sm:px-8 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-[720px]">
        <PageHeader title="내 프로필" align="left" />

        <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="flex items-start gap-4 md:gap-5">
            <ProfileAvatarEditor name={name} photoUrl={profile?.photo ?? ""} />

            <div className="min-w-0 flex-1">
              <p className="truncate font-['Pretendard',sans-serif] text-xl font-semibold leading-tight text-[#16140f]">
                {name}
              </p>
              <p className="mt-1 truncate font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                {email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${roleMeta.className}`}
                >
                  {roleMeta.label}
                </span>
                {profile?.is_admin && (
                  <span className="inline-flex rounded-full bg-[#16140f] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white">
                    어드민
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                가입일
              </span>
              <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f]">{joinedAt}</span>
            </div>

            <div className="my-3 border-t border-[#ece8db]" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                기수
              </span>
              <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f]">
                {profile?.batch || "-"}
              </span>
            </div>

            <div className="my-3 border-t border-[#ece8db]" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">사용자명</span>
              <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f]">{username}</span>
            </div>

            <div className="my-3 border-t border-[#ece8db]" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">이름</span>
              <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f]">{firstName}</span>
            </div>

            <div className="my-3 border-t border-[#ece8db]" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">성</span>
              <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f]">{lastName}</span>
            </div>

            <div className="my-3 border-t border-[#ece8db]" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">LinkedIn</span>
              {linkedinUrl ? (
                <Link
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-['Pretendard',sans-serif] text-sm text-[#FF6C0F] underline underline-offset-4"
                >
                  {linkedinUrl}
                </Link>
              ) : (
                <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f]">-</span>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-[#ddd9cc] bg-white p-4">
            <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
              공개 프로필 링크
            </p>
            {publicProfileHref ? (
              <div className="mt-2 space-y-2">
                <p
                  className="truncate font-['Pretendard',sans-serif] text-sm text-[#16140f]"
                  title={publicProfileHref}
                >
                  {publicProfileHref}
                </p>
                <Link
                  href={publicProfileHref}
                  className="inline-flex font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F] underline underline-offset-4"
                >
                  공개 프로필 보기
                </Link>
              </div>
            ) : (
              <p className="mt-2 font-['Pretendard',sans-serif] text-xs leading-relaxed text-[#6b6b5e]">
                공개 프로필이 아직 비공개 상태입니다. 아래 공개 프로필 편집 영역에서 공개로 전환하면 이름이 들어간 공유 링크가 활성화됩니다.
              </p>
            )}
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile/edit"
            className="flex h-10 flex-1 items-center justify-center rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#16140f]/90"
          >
            프로필 수정
          </Link>
          <div className="flex-1">
            <LogoutButton />
          </div>
        </div>

        {profile && (
          <PublicProfileEditor
            initial={{
              name: profile.name ?? "",
              slug: profile.slug ?? "",
              headline: profile.headline ?? "",
              currentRole: profile.current_role ?? "",
              company: profile.company ?? "",
              bio: profile.bio ?? "",
              linkedinUrl: profile.linkedin_url ?? "",
              websiteUrl: profile.website_url ?? "",
              brunchUrl: profile.brunch_url ?? "",
              githubUrl: profile.github_url ?? "",
              profileVisibility: profile.profile_visibility === "public" ? "public" : "private",
            }}
            initialExperiences={experiences}
            isEditable={canEditPublicProfile}
          />
        )}

        {canEditPublicProfile && <OwnedPostsSection posts={ownedPosts} />}
      </div>
    </div>
  );
}
