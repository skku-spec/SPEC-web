"use client";

import { ExternalLink, UserRound } from "lucide-react";

import { getIdeathonProfileFocusText, getIdeathonTeamProfileCopy } from "@/app/ideathon/ideathon-team-profile-copy";
import type { IdeathonBoardProfile } from "@/lib/actions/ideathon-profiles";

type Props = {
  readonly profile: IdeathonBoardProfile;
  readonly onOpen: (profile: IdeathonBoardProfile) => void;
};

export default function IdeathonTeamProfileCard({ profile, onOpen }: Props) {
  const copy = getIdeathonTeamProfileCopy(profile.role);

  return (
    <article className="overflow-hidden rounded-lg border border-[#ddd9cc] bg-white">
      <button
        type="button"
        onClick={() => onOpen(profile)}
        className="block w-full text-left transition-colors hover:bg-[#fcfcf8] active:bg-[#FFF0E5]"
        aria-label={`${profile.name} 열어보기`}
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#e8e6dc]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">
                {profile.name}
              </h3>
              <p className="mt-1 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                {profile.department} · {profile.grade} · {profile.age}세
              </p>
            </div>
            <span className="rounded-full bg-[#FFF0E5] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
              {copy.roleLabel}
            </span>
          </div>

          {profile.ability_tags.length > 0 ? (
            <div className="grid gap-2">
              <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                {copy.cardAbilityLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.ability_tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#ddd9cc] bg-white px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {profile.interest_tags.length > 0 ? (
            <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
              {profile.interest_tags.join(", ")}
            </p>
          ) : null}

          <p className="line-clamp-3 font-['Pretendard',sans-serif] text-sm leading-6 text-[#4a4a40]">
            {getIdeathonProfileFocusText(profile)}
          </p>

          <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">
            <UserRound className="h-4 w-4" strokeWidth={2} />
            {profile.name} 열어보기
          </span>
        </div>
      </button>
      {(profile.portfolio_url || profile.sns_url) && (
        <div className="border-t border-[#ece8db] px-5 py-3">
          <div className="flex flex-wrap gap-3">
            {profile.portfolio_url ? (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <ExternalLink className="h-4 w-4" strokeWidth={2} />
                포트폴리오
              </a>
            ) : null}
            {profile.sns_url ? (
              <a
                href={profile.sns_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <ExternalLink className="h-4 w-4" strokeWidth={2} />
                SNS
              </a>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
