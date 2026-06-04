"use client";

import { ExternalLink, X } from "lucide-react";

import type { IdeathonBoardProfile } from "@/lib/actions/ideathon-profiles";

type Props = {
  readonly profile: IdeathonBoardProfile;
  readonly isOwner: boolean;
  readonly onClose: () => void;
  readonly onEdit: () => void;
};

function roleLabel(role: IdeathonBoardProfile["role"]): string {
  return role === "preneur" ? "프러너" : "러너";
}

function FieldBlock({ title, body }: { readonly title: string; readonly body: string }) {
  return (
    <section>
      <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
        {title}
      </h3>
      <p className="mt-2 whitespace-pre-line font-['Pretendard',sans-serif] text-sm leading-6 text-[#4a4a40]">
        {body}
      </p>
    </section>
  );
}

export default function IdeathonTeamProfileModal({ profile, isOwner, onClose, onEdit }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16140f]/60 px-4 py-6 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${profile.name} 소개`}
        className="max-h-[88vh] w-full max-w-[760px] overflow-y-auto rounded-lg border border-[#ddd9cc] bg-white"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ece8db] bg-white px-5 py-4">
          <div>
            <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
              {roleLabel(profile.role)}
            </p>
            <h2 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f]">
              {profile.name} 소개
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
            닫기
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr]">
          <div>
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-[#e8e6dc]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" />
            </div>
            <div className="mt-4 space-y-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              <p>{profile.department}</p>
              <p>{profile.student_id} · {profile.grade} · {profile.age}세</p>
              {profile.major ? <p>{profile.major}</p> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...profile.ability_tags, ...profile.interest_tags].map((tag) => (
                <span key={tag} className="rounded-full bg-[#f0efe6] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <FieldBlock title="창업인 이유" body={profile.startup_reason} />
            <FieldBlock title="팀에서의 성향" body={profile.team_style} />
            <FieldBlock title="12월 데모데이까지 얻어가고 싶은 것" body={profile.december_goal} />
            <FieldBlock title="함께 찾는 팀원" body={profile.looking_for_teammates} />
            {profile.appeal ? <FieldBlock title="자유 어필" body={profile.appeal} /> : null}
            {isOwner ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#FF6C0F]"
              >
                내 소개 수정하기
              </button>
            ) : null}
            {(profile.portfolio_url || profile.sns_url) && (
              <div className="flex flex-wrap gap-3 border-t border-[#ece8db] pt-4">
                {profile.portfolio_url ? (
                  <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-2 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
                    <ExternalLink className="h-4 w-4" strokeWidth={2} />
                    포트폴리오 열기
                  </a>
                ) : null}
                {profile.sns_url ? (
                  <a href={profile.sns_url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-2 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
                    <ExternalLink className="h-4 w-4" strokeWidth={2} />
                    SNS 열기
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
