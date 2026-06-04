"use client";

import { useEffect, useState, useTransition } from "react";
import { ImagePlus, Save, Upload } from "lucide-react";

import {
  buildInitialTeamProfileFormState,
  isUploadResult,
  prepareIdeathonProfileImageForUpload,
  splitTeamProfileTags,
} from "@/app/ideathon/ideathon-team-profile-form-utils";
import { upsertMyIdeathonProfile } from "@/lib/actions/ideathon-profiles";
import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";
import type { TeamProfileFormState } from "@/app/ideathon/ideathon-team-profile-form-utils";

type Props = {
  readonly data: IdeathonBoardData;
  readonly onSaved: () => Promise<void>;
};

type UploadPhase = "idle" | "preparing" | "uploading";

export default function IdeathonTeamProfileForm({ data, onSaved }: Props) {
  const [form, setForm] = useState<TeamProfileFormState>(() => buildInitialTeamProfileFormState(data));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const isUploading = uploadPhase !== "idle";

  useEffect(() => {
    setForm(buildInitialTeamProfileFormState(data));
  }, [data]);

  const updateField = (key: keyof TeamProfileFormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError(null);
    setNotice(null);
    setUploadPhase("preparing");

    try {
      const uploadFile = await prepareIdeathonProfileImageForUpload(file);
      const uploadData = new FormData();
      uploadData.set("image", uploadFile);
      setUploadPhase("uploading");

      const response = await fetch("/api/upload/ideathon-profile-image", {
        method: "POST",
        body: uploadData,
      });
      const result: unknown = await response.json();

      if (!isUploadResult(result) || !result.success || !result.url) {
        setError(isUploadResult(result) ? result.error ?? "사진 업로드에 실패했습니다." : "사진 업로드에 실패했습니다.");
        return;
      }

      updateField("imageUrl", result.url);
      setNotice(uploadFile.size < file.size ? "모바일 업로드를 위해 사진을 가볍게 줄였어요." : "사진이 업로드되었습니다.");
    } finally {
      setUploadPhase("idle");
    }
  };

  const submit = () => {
    startTransition(async () => {
      setError(null);
      setNotice(null);

      const payload = new FormData();
      payload.set("photo_url", form.imageUrl.trim());
      payload.set("department", form.department.trim());
      payload.set("major", form.major.trim());
      payload.set("age", form.age.trim());
      payload.set("student_id", form.studentId.trim());
      payload.set("grade", form.grade.trim());
      splitTeamProfileTags(form.abilityTags).forEach((tag) => payload.append("ability_tags", tag));
      splitTeamProfileTags(form.interestTags).forEach((tag) => payload.append("interest_tags", tag));
      payload.set("startup_reason", form.startupReason.trim());
      payload.set("team_style", form.teamStyle.trim());
      payload.set("december_goal", form.decemberGoal.trim());
      payload.set("looking_for_teammates", form.lookingForTeammates.trim());
      payload.set("appeal", form.freeAppeal.trim());
      payload.set("portfolio_url", form.portfolioUrl.trim());
      payload.set("sns_url", form.snsUrl.trim());

      const result = await upsertMyIdeathonProfile(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setNotice("내 소개가 저장되었습니다.");
      await onSaved();
    });
  };

  const inputClass = "rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#6b6b5e] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10";
  const textareaClass = `${inputClass} min-h-[104px] resize-y leading-6`;
  const labelClass = "font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]";
  const uploadLabel = uploadPhase === "preparing" ? "사진 줄이는 중" : uploadPhase === "uploading" ? "사진 업로드 중" : "사진 업로드";

  return (
    <section id="ideathon-team-profile-form" className="rounded-lg border border-[#ddd9cc] bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f]">
            내 소개 작성하기
          </h3>
          <p className="mt-2 font-['Pretendard',sans-serif] text-sm leading-6 text-[#6b6b5e]">
            지금 형성되는 팀은 12월 데모데이까지 함께 달리게 됩니다. 본인을 진실되게 써주세요.
          </p>
        </div>
        <span className="rounded-full bg-[#FFF0E5] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
          {data.currentUser.role === "preneur" ? "프러너" : "러너"}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="w-full max-w-[240px] md:max-w-none">
          <div className="aspect-[4/5] overflow-hidden rounded-lg border border-[#ddd9cc] bg-[#e8e6dc]">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="내 팀빌딩 보드 사진" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                <ImagePlus className="h-8 w-8 text-[#6b6b5e]" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <label className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ddd9cc] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]">
            <Upload className="h-4 w-4" strokeWidth={2} />
            {uploadLabel}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(event) => {
                void handleImageChange(event.target.files?.[0] ?? null);
              }}
            />
          </label>
          <p className="mt-2 font-['Pretendard',sans-serif] text-xs leading-5 text-[#6b6b5e]">
            모바일 사진은 업로드 전에 자동으로 가볍게 줄입니다.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>이름</span>
              <input className={inputClass} value={data.currentUser.name} readOnly />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>학과</span>
              <input className={inputClass} placeholder="예: 경영학과" value={form.department} onChange={(event) => updateField("department", event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>나이</span>
              <input className={inputClass} placeholder="예: 23" value={form.age} inputMode="numeric" onChange={(event) => updateField("age", event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>학번</span>
              <input className={inputClass} placeholder="예: 2024123456" value={form.studentId} onChange={(event) => updateField("studentId", event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>학년</span>
              <input className={inputClass} placeholder="예: 2학년" value={form.grade} onChange={(event) => updateField("grade", event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>전공</span>
              <input className={inputClass} placeholder="예: 글로벌경영" value={form.major} onChange={(event) => updateField("major", event.target.value)} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={labelClass}>능력 태그</span>
            <input className={inputClass} placeholder="예: 기획, 개발, 디자인" value={form.abilityTags} onChange={(event) => updateField("abilityTags", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>관심 분야 태그</span>
            <input className={inputClass} placeholder="예: B2B, SaaS, 커머스" value={form.interestTags} onChange={(event) => updateField("interestTags", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>창업인 이유</span>
            <textarea className={textareaClass} rows={3} placeholder="왜 지금 창업을 해보고 싶은지 솔직하게 적어주세요." value={form.startupReason} onChange={(event) => updateField("startupReason", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>팀에서의 성향</span>
            <textarea className={textareaClass} rows={3} placeholder="일할 때 편한 방식, 의사결정 스타일, 강한 역할을 적어주세요." value={form.teamStyle} onChange={(event) => updateField("teamStyle", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>12월 데모데이까지 얻어가고 싶은 것</span>
            <textarea className={textareaClass} rows={3} placeholder="12월까지 팀과 함께 만들고 싶은 결과를 적어주세요." value={form.decemberGoal} onChange={(event) => updateField("decemberGoal", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>함께 찾는 팀원</span>
            <textarea className={textareaClass} rows={3} placeholder="어떤 동료와 함께 달리고 싶은지 적어주세요." value={form.lookingForTeammates} onChange={(event) => updateField("lookingForTeammates", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>자유 어필 (선택)</span>
            <textarea className={textareaClass} rows={3} placeholder="본인을 더 잘 보여줄 수 있는 말을 자유롭게 적어주세요." value={form.freeAppeal} onChange={(event) => updateField("freeAppeal", event.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>포트폴리오</span>
              <input className={inputClass} placeholder="https://..." value={form.portfolioUrl} onChange={(event) => updateField("portfolioUrl", event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>SNS</span>
              <input className={inputClass} placeholder="https://instagram.com/..." value={form.snsUrl} onChange={(event) => updateField("snsUrl", event.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {(error || notice) && (
        <p className={`mt-4 font-['Pretendard',sans-serif] text-sm font-semibold ${error ? "text-[#b42318]" : "text-[#2f9e44]"}`}>
          {error ?? notice}
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || isUploading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#FF6C0F] disabled:cursor-not-allowed disabled:bg-[#6b6b5e] sm:w-auto"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          {isPending ? "저장 중" : "내 소개 저장하기"}
        </button>
      </div>
    </section>
  );
}
