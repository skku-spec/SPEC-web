"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";

export type FormValues = {
  title: string;
  targetCustomer: string;
  description: string;
  competitors: string;
  marketSize: string;
  teamMembers: string;
  pdfUrl: string;
  pdfName: string;
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

type UploadResponse = {
  success: boolean;
  error?: string;
  url?: string;
  name?: string;
};

function isUploadResponse(value: unknown): value is UploadResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.success === "boolean";
}

export default function IdeathonSubmissionForm({
  selectedIdeaTitle,
  formValues,
  isPending,
  formError,
  onChange,
  onSubmit,
}: IdeathonSubmissionFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const onPdfChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("PDF 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("파일 크기는 20MB 이하만 가능합니다.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload/ideathon-pdf", {
        method: "POST",
        body: uploadFormData,
      });
      const result: unknown = await response.json();

      if (!isUploadResponse(result)) {
        throw new Error("파일 업로드 응답을 확인하지 못했습니다.");
      }

      if (!response.ok || !result.success || !result.url) {
        throw new Error(result.error ?? "파일 업로드에 실패했습니다.");
      }

      onChange("pdfUrl", result.url);
      onChange("pdfName", result.name ?? file.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearPdf = () => {
    onChange("pdfUrl", "");
    onChange("pdfName", "");
    setUploadError(null);
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

      <div className="space-y-1.5">
        <label htmlFor="ideathon-pdf-upload" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
          PDF 자료 첨부
        </label>
        {formValues.pdfUrl ? (
          <div className="flex flex-col gap-3 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] px-4 py-3">
            <a
              href={formValues.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors duration-150 hover:text-[#FF6C0F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6C0F]/30"
            >
              <Paperclip className="h-4 w-4 text-[#FF6C0F]" />
              {formValues.pdfName || "첨부된 PDF 보기"}
            </a>
            <button
              type="button"
              onClick={clearPdf}
              className="inline-flex h-8 w-fit items-center gap-1 rounded-md border border-[#ddd9cc] bg-white px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] transition-colors duration-150 hover:border-[#b42318]/40 hover:bg-[#FEE2E2] active:bg-[#FEE2E2] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b42318]/20"
            >
              <X className="h-4 w-4" />
              PDF 제거
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              id="ideathon-pdf-upload"
              accept=".pdf"
              disabled={isUploading || isPending}
              onChange={onPdfChange}
              className="sr-only"
            />
            <label
              htmlFor="ideathon-pdf-upload"
              className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#ddd9cc] bg-white px-4 font-['Pretendard',sans-serif] text-sm text-[#4a4a40] transition-colors duration-150 hover:border-[#FF6C0F]/50 hover:bg-[#FFF0E5] hover:text-[#16140f] active:bg-[#FFF0E5] active:translate-y-px ${
                isUploading || isPending ? "pointer-events-none opacity-50" : "cursor-pointer"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF6C0F]" />
                  PDF 업로드 중...
                </>
              ) : (
                <>
                  <Paperclip className="h-4 w-4 text-[#6b6b5e]" />
                  PDF 파일 선택 (최대 20MB)
                </>
              )}
            </label>
          </div>
        )}
        {uploadError ? (
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318]">{uploadError}</p>
        ) : (
          <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">선택 사항입니다.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || isUploading}
        className="w-full flex h-10 items-center justify-center rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#FF6C0F] active:bg-[#FF6C0F] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6C0F]/30 disabled:cursor-not-allowed disabled:bg-[#16140f]/60 disabled:opacity-70 disabled:active:translate-y-0"
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
