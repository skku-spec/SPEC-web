"use client";

import { CheckCircle, ImagePlus, PencilLine } from "lucide-react";
import Image from "next/image";

import { getIdeathonTeamProfileCopy } from "@/app/ideathon/ideathon-team-profile-copy";
import { splitTeamProfileTags } from "@/app/ideathon/ideathon-team-profile-form-utils";
import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";
import type { TeamProfileFormState } from "@/app/ideathon/ideathon-team-profile-form-utils";

type Props = {
  readonly data: IdeathonBoardData;
  readonly form: TeamProfileFormState;
  readonly notice: string | null;
  readonly onEdit: () => void;
};

export default function IdeathonTeamProfileSummary({ data, form, notice, onEdit }: Props) {
  const abilityTags = splitTeamProfileTags(form.abilityTags);
  const department = form.department.trim() || data.member?.department || "학과 미입력";
  const photoUrl = form.imageUrl.trim();
  const copy = getIdeathonTeamProfileCopy(data.currentUser.role);
  const abilityText = abilityTags.join(", ");

  return (
    <section id="ideathon-team-profile-form" className="rounded-lg border border-[#ddd9cc] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[#ddd9cc] bg-[#e8e6dc]">
            {photoUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={photoUrl}
                  alt={`${data.currentUser.name} 팀빌딩 보드 사진`}
                  fill
                  sizes="64px"
                  priority
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grid h-full place-items-center">
                <ImagePlus className="h-5 w-5 text-[#6b6b5e]" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F9E6] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">
              <CheckCircle className="h-4 w-4" strokeWidth={2} />
              소개 작성 완료
            </div>
            <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">
              {data.currentUser.name}
            </h3>
            <p className="mt-1 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              {department}
            </p>
            {abilityTags.length > 0 ? (
              <p className="mt-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                {copy.summaryAbilityPrefix ? `${copy.summaryAbilityPrefix}: ${abilityText}` : abilityText}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#2f9e44]">
                {notice}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#ddd9cc] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8] md:w-auto"
        >
          <PencilLine className="h-4 w-4" strokeWidth={2} />
          내 소개 수정하기
        </button>
      </div>
    </section>
  );
}
