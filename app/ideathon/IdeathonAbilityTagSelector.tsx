"use client";

import { splitTeamProfileTags } from "@/app/ideathon/ideathon-team-profile-form-utils";

type Props = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly helperText?: string;
  readonly ariaLabel?: string;
};

const ABILITY_TAG_OPTIONS = ["기획", "개발", "디자인", "마케팅", "영업", "리서치", "운영", "재무", "데이터", "AI"] as const;
const ABILITY_TAG_OPTION_SET = new Set<string>(ABILITY_TAG_OPTIONS);

function mergeTagOptions(selectedTags: readonly string[]): readonly string[] {
  const customTags = selectedTags.filter((tag) => !ABILITY_TAG_OPTION_SET.has(tag));
  return [...ABILITY_TAG_OPTIONS, ...customTags];
}

function serializeTags(tags: readonly string[]): string {
  return tags.join(", ");
}

export default function IdeathonAbilityTagSelector({
  value,
  onChange,
  helperText = "본인을 가장 잘 보여주는 능력을 선택해 주세요.",
  ariaLabel = "능력 태그 선택",
}: Props) {
  const selectedTags = splitTeamProfileTags(value);
  const options = mergeTagOptions(selectedTags);

  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((selectedTag) => selectedTag !== tag)
      : [...selectedTags, tag];
    onChange(serializeTags(nextTags));
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
        {options.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleTag(tag)}
              className={`inline-flex h-8 items-center rounded-md border px-3 font-['Pretendard',sans-serif] text-xs font-semibold transition-colors ${
                isSelected
                  ? "border-[#16140f] bg-[#16140f] text-white"
                  : "border-[#ddd9cc] bg-white text-[#4a4a40] hover:border-[#FF6C0F]/50 hover:bg-[#FFF0E5]"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <p className="font-['Pretendard',sans-serif] text-xs leading-5 text-[#6b6b5e]">
        {helperText}
      </p>
    </div>
  );
}
