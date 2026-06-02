"use client";

import type { ChangeEvent } from "react";
import { Send } from "lucide-react";

export type FormValues = {
  title: string;
  targetCustomer: string;
  description: string;
  competitors: string;
  marketSize: string;
  teamMembers: string;
};

type IdeathonSubmissionFormProps = {
  selectedIdeaTitle: string | null;
  formValues: FormValues;
  isPending: boolean;
  formError: string | null;
  onChange: (name: keyof FormValues, value: string) => void;
  onSubmit: () => void;
};

const textFields = [
  {
    id: "targetCustomer",
    label: "타깃 고객",
    name: "target_customer",
    placeholder: "예: 해외 저널 투고를 준비하는 국내 대학원생 및 신진 연구자",
  },
  {
    id: "teamMembers",
    label: "참여 중인 팀원 / 구하는 파트너 정보",
    name: "team_members",
    placeholder: "예: 현재 기획 1명 구성 완료 / React Frontend 개발 경력이 있거나 AI 모델 핏 연구에 관심 있는 개발자 파트너 모집",
  },
  {
    id: "marketSize",
    label: "시장 규모 / 초기 가설",
    name: "market_size",
    placeholder: "예: 연 매출 200억 원의 B2B 니치 시장 등",
  },
] as const;

const COMMON_FIELD_CLASS =
  "w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none transition-colors";

export default function IdeathonSubmissionForm({
  selectedIdeaTitle,
  formValues,
  isPending,
  formError,
  onChange,
  onSubmit,
}: IdeathonSubmissionFormProps) {
  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target;
    if (field.name === "title") {
      onChange("title", field.value);
      return;
    }
    if (field.name === "target_customer") {
      onChange("targetCustomer", field.value);
      return;
    }
    if (field.name === "team_members") {
      onChange("teamMembers", field.value);
      return;
    }
    onChange("marketSize", field.value);
  };

  const onTextareaChange = (name: keyof FormValues) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(name, event.target.value);
  };

  return (
    <div className="space-y-6">
      {formError && (
        <div className="rounded-md border border-[#b42318]/20 bg-[#FEE2E2] p-4 text-sm text-[#b42318] font-['Pretendard',sans-serif]">
          {formError}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="title" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
          아이디어명 / 프로젝트명 <span className="text-[#FF6C0F]">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formValues.title}
          onChange={onInputChange}
          placeholder="예: AI 기반 학술 연구 번역 협업 툴"
          className={COMMON_FIELD_CLASS}
        />
      </div>

      {textFields.map((field) => (
        <div className="space-y-1.5" key={field.id}>
          <label
            htmlFor={field.name}
            className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]"
          >
            {field.label}
          </label>
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={
              field.id === "targetCustomer"
                ? formValues.targetCustomer
                : field.id === "teamMembers"
                  ? formValues.teamMembers
                  : formValues.marketSize
            }
            onChange={onInputChange}
            placeholder={field.placeholder}
            className={COMMON_FIELD_CLASS}
          />
        </div>
      ))}

      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]"
        >
          해결하려는 문제 및 솔루션 설명 <span className="text-[#FF6C0F]">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          value={formValues.description}
          onChange={onTextareaChange("description")}
          placeholder="어떤 문제를 어떻게 혁신적으로 해결하고자 하는지 구체적으로 적어주세요."
          className={`${COMMON_FIELD_CLASS} resize-none`}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="competitors"
          className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]"
        >
          경쟁사 분석 및 차별점
        </label>
        <textarea
          id="competitors"
          name="competitors"
          rows={3}
          value={formValues.competitors}
          onChange={onTextareaChange("competitors")}
          placeholder="기존 대안이나 경쟁 서비스는 무엇이며, 본 솔루션만의 차별화 장벽은 무엇인가요?"
          className={`${COMMON_FIELD_CLASS} resize-none`}
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="w-full flex h-10 items-center justify-center rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "제출 중..." : selectedIdeaTitle ? "아이디어 수정하기" : "아이디어 제출하기"}
        {!isPending ? <Send className="ml-2 h-4 w-4" /> : null}
      </button>

      {selectedIdeaTitle ? (
        <p className="text-xs font-['Pretendard',sans-serif] text-[#6b6b5e]">
          선택한 아이디어: {selectedIdeaTitle}
        </p>
      ) : (
        <p className="text-xs font-['Pretendard',sans-serif] text-[#6b6b5e]">새 아이디어로 제출합니다.</p>
      )}
    </div>
  );
}
