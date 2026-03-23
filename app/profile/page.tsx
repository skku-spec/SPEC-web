import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import { requireAuth, normalizeRole, canWrite } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";
import LogoutButton from "@/app/profile/LogoutButton";
import OwnedPostsSection from "@/components/profile/OwnedPostsSection";
import ProfileAvatarEditor from "@/components/profile/ProfileAvatarEditor";
import PublicProfileEditor from "@/components/profile/PublicProfileEditor";
import { getProfileExperiencesForOwner } from "@/lib/public-profile";
import { getBlogPostsByAuthorIdForOwner } from "@/lib/api";

type RoleMeta = {
  label: string;
  className: string;
};

const ROLE_META: Record<UserRole, RoleMeta> = {
  outsider: { label: "외부인", className: "bg-slate-100 text-slate-700" },
  runner: { label: "러너", className: "bg-teal-100 text-teal-700" },
  preneur: { label: "프러너", className: "bg-violet-100 text-violet-700" },
  member: { label: "부원", className: "bg-blue-100 text-blue-700" },
  admin: { label: "관리자", className: "bg-red-100 text-red-700" },
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
      ? `${profile.first_name} ${profile.last_name}`
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
    <div className="min-h-screen px-4 pb-24 pt-14 md:px-8 md:pt-20">
      <div className="mx-auto max-w-[720px]">
        <PageHeader title="내 프로필" align="left" />

        <section className="rounded-2xl border border-[#d7d5ca] bg-[#fcfcf7] p-6 shadow-[0_14px_35px_rgba(22,20,15,0.05)] md:p-8">
          <div className="flex items-start gap-4 md:gap-5">
            <ProfileAvatarEditor name={name} photoUrl={profile?.photo ?? ""} />

            <div className="min-w-0 flex-1">
              <p className="truncate font-['Pretendard',sans-serif] text-[26px] font-bold leading-tight text-[#16140f]">
                {name}
              </p>
              <p className="mt-1 truncate font-['Pretendard',sans-serif] text-[15px] text-[#16140f]/65">
                {email}
              </p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 font-['Pretendard',sans-serif] text-[12px] font-semibold ${roleMeta.className}`}
              >
                {roleMeta.label}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-3 rounded-xl border border-[#e1dfd4] bg-[#f8f8f2] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/60">
                가입일
              </span>
              <span className="font-['MaruBuri',serif] text-[15px] text-[#16140f]">{joinedAt}</span>
            </div>

            <div className="h-px bg-[#16140f]/8" />

            <div className="flex items-center justify-between gap-4">
              <span className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/60">
                기수
              </span>
              <span className="font-['MaruBuri',serif] text-[15px] text-[#16140f]">
                {profile?.batch || "-"}
              </span>
            </div>

            <div className="h-px bg-[#16140f]/8" />

            <div className="flex items-center justify-between gap-4">
              <span className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/60">Username</span>
              <span className="font-['MaruBuri',serif] text-[15px] text-[#16140f]">{username}</span>
            </div>

            <div className="h-px bg-[#16140f]/8" />

            <div className="flex items-center justify-between gap-4">
              <span className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/60">First Name</span>
              <span className="font-['MaruBuri',serif] text-[15px] text-[#16140f]">{firstName}</span>
            </div>

            <div className="h-px bg-[#16140f]/8" />

            <div className="flex items-center justify-between gap-4">
              <span className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/60">Last Name</span>
              <span className="font-['MaruBuri',serif] text-[15px] text-[#16140f]">{lastName}</span>
            </div>

            <div className="h-px bg-[#16140f]/8" />

            <div className="flex items-center justify-between gap-4">
              <span className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/60">LinkedIn URL</span>
              {linkedinUrl ? (
                <Link
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[60%] truncate font-['MaruBuri',serif] text-[15px] text-[#FF6C0F] underline underline-offset-4"
                >
                  {linkedinUrl}
                </Link>
              ) : (
                <span className="font-['MaruBuri',serif] text-[15px] text-[#16140f]">-</span>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/profile/edit"
              className="block w-full rounded-xl bg-[#FF6C0F] px-4 py-3 text-center font-['Pretendard',sans-serif] text-[15px] font-semibold text-white transition-colors hover:opacity-85"
            >
              프로필 수정
            </Link>
            <LogoutButton />
          </div>
        </section>

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
