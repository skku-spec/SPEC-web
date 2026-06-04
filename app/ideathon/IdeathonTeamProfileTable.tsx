"use client";

import { TableProperties } from "lucide-react";

import type { IdeathonBoardProfile } from "@/lib/actions/ideathon-profiles";

type Props = {
  readonly profiles: readonly IdeathonBoardProfile[];
  readonly onOpen: (profile: IdeathonBoardProfile) => void;
};

function roleLabel(role: IdeathonBoardProfile["role"]): string {
  return role === "preneur" ? "프러너" : "러너";
}

export default function IdeathonTeamProfileTable({ profiles, onOpen }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
      <table className="min-w-[860px] w-full" aria-label="아이디어톤 러너 프러너 명단">
        <thead className="bg-[#f0efe6] text-left">
          <tr>
            {["사진", "이름", "구분", "학과", "학번", "학년", "능력 태그", "관심 태그", "12월 목표", "열람"].map((header) => (
              <th key={header} className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {profiles.length === 0 ? (
            <tr className="border-t border-[#ece8db]">
              <td colSpan={10} className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                조건에 맞는 소개가 없습니다.
              </td>
            </tr>
          ) : (
            profiles.map((profile) => (
              <tr key={profile.id} className="border-t border-[#ece8db]">
                <td className="px-4 py-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-[#e8e6dc]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                </td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  {profile.name}
                </td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  {roleLabel(profile.role)}
                </td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  {profile.department}
                </td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  {profile.student_id}
                </td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  {profile.grade}
                </td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  {profile.ability_tags.join(", ")}
                </td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  {profile.interest_tags.join(", ") || "-"}
                </td>
                <td className="max-w-[220px] px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  <span className="line-clamp-2">{profile.december_goal}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpen(profile)}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f] transition-colors hover:border-[#FF6C0F]/50 hover:bg-[#FFF0E5]"
                  >
                    <TableProperties className="h-4 w-4" strokeWidth={2} />
                    {profile.name} 열어보기
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
