"use client";

import { useMemo, useState, useTransition, type SyntheticEvent } from "react";

import { savePublicProfile } from "@/lib/actions/public-profile";
import type { PublicProfileExperience } from "@/lib/public-profile";
type PublicProfileEditorProps = {
  initial: {
    name: string;
    slug: string;
    headline: string;
    currentRole: string;
    company: string;
    bio: string;
    linkedinUrl: string;
    websiteUrl: string;
    brunchUrl: string;
    githubUrl: string;
  };
  initialExperiences: PublicProfileExperience[];
  isEditable?: boolean;
};

type EditableExperience = {
  clientId: string;
  id?: string;
  organization: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
};

function createClientId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `exp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mapInitialExperience(experience: PublicProfileExperience): EditableExperience {
  return {
    clientId: experience.id,
    id: experience.id,
    organization: experience.organization,
    title: experience.title,
    startDate: experience.start_date ?? "",
    endDate: experience.end_date ?? "",
    isCurrent: experience.is_current,
    description: experience.description,
  };
}

function ExperienceEditor({
  experiences,
  disabled,
  onAdd,
  onMove,
  onRemove,
  onChange,
}: {
  experiences: EditableExperience[];
  disabled: boolean;
  onAdd: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, next: EditableExperience) => void;
}) {
  return (
    <section className="rounded-2xl border border-[#e1dfd4] bg-[#f8f8f2] p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-[system-ui] text-[1.15rem] font-black text-[#16140f]">Experience</h3>
          <p className="mt-1 font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e]">
            현재/이전 경험을 순서대로 정리해 주세요. 위아래 이동으로 공개 순서를 조정할 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="inline-flex h-10 items-center justify-center rounded-full border border-[#16140f]/12 bg-white px-4 font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f] transition-colors hover:border-[#FF6C0F] hover:text-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          경력 추가
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#d7d5ca] bg-white px-4 py-6 text-center font-['Pretendard',sans-serif] text-[14px] text-[#6b6b5e]">
          아직 추가된 경력이 없습니다.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {experiences.map((experience, index) => (
            <article key={experience.clientId} className="rounded-2xl border border-[#ddd9cc] bg-white p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-['Pretendard',sans-serif] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#16140f]/45">
                  Experience {index + 1}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onMove(index, -1)}
                    disabled={disabled || index === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd9cc] text-[#16140f] transition-colors hover:border-[#FF6C0F] hover:text-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(index, 1)}
                    disabled={disabled || index === experiences.length - 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd9cc] text-[#16140f] transition-colors hover:border-[#FF6C0F] hover:text-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[#f0c3ba] px-3 font-['Pretendard',sans-serif] text-[12px] font-semibold text-[#b42318] transition-colors hover:border-[#d63a19] hover:text-[#d63a19] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">회사 / 조직</span>
                  <input
                    value={experience.organization}
                    onChange={(event) => onChange(index, { ...experience, organization: event.target.value })}
                    disabled={disabled}
                    maxLength={80}
                    className="w-full rounded-xl border border-[#ddd9cc] bg-[#fcfcf7] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">역할</span>
                  <input
                    value={experience.title}
                    onChange={(event) => onChange(index, { ...experience, title: event.target.value })}
                    disabled={disabled}
                    maxLength={80}
                    className="w-full rounded-xl border border-[#ddd9cc] bg-[#fcfcf7] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">시작일</span>
                  <input
                    type="date"
                    value={experience.startDate}
                    onChange={(event) => onChange(index, { ...experience, startDate: event.target.value })}
                    disabled={disabled}
                    className="w-full rounded-xl border border-[#ddd9cc] bg-[#fcfcf7] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">종료일</span>
                  <input
                    type="date"
                    value={experience.endDate}
                    onChange={(event) => onChange(index, { ...experience, endDate: event.target.value })}
                    disabled={disabled || experience.isCurrent}
                    className="w-full rounded-xl border border-[#ddd9cc] bg-[#fcfcf7] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </div>

              <label className="mt-4 flex items-center gap-3 rounded-xl bg-[#f8f8f2] px-4 py-3">
                <input
                  type="checkbox"
                  checked={experience.isCurrent}
                  onChange={(event) =>
                    onChange(index, {
                      ...experience,
                      isCurrent: event.target.checked,
                      endDate: event.target.checked ? "" : experience.endDate,
                    })
                  }
                  disabled={disabled}
                  className="h-4 w-4 rounded border-[#ddd9cc] text-[#FF6C0F] focus:ring-[#FF6C0F]"
                />
                <span className="font-['Pretendard',sans-serif] text-[14px] text-[#16140f]">현재 재직 중</span>
              </label>

              <label className="mt-4 block space-y-2">
                <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">설명</span>
                <textarea
                  value={experience.description}
                  onChange={(event) => onChange(index, { ...experience, description: event.target.value })}
                  disabled={disabled}
                  rows={4}
                  maxLength={300}
                  className="w-full rounded-2xl border border-[#ddd9cc] bg-[#fcfcf7] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function PublicProfileEditor({ initial, initialExperiences, isEditable = true }: PublicProfileEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [name, setName] = useState(initial.name);
  const [headline, setHeadline] = useState(initial.headline);
  const [currentRole, setCurrentRole] = useState(initial.currentRole);
  const [company, setCompany] = useState(initial.company);
  const [bio, setBio] = useState(initial.bio);
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl);
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl);
  const [brunchUrl, setBrunchUrl] = useState(initial.brunchUrl);
  const [githubUrl, setGithubUrl] = useState(initial.githubUrl);
  
  const [experiences, setExperiences] = useState<EditableExperience[]>(() => initialExperiences.map(mapInitialExperience));

  const serializedExperiences = useMemo(
    () =>
      JSON.stringify(
        experiences.map((experience) => ({
          id: experience.id,
          organization: experience.organization,
          title: experience.title,
          startDate: experience.startDate,
          endDate: experience.endDate,
          isCurrent: experience.isCurrent,
          description: experience.description,
        })),
      ),
    [experiences],
  );

  const disabled = isPending || !isEditable;

  const addExperience = () => {
    setExperiences((current) => [
      ...current,
      {
        clientId: createClientId(),
        organization: "",
        title: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      },
    ]);
  };

  const moveExperience = (index: number, direction: -1 | 1) => {
    setExperiences((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const updateExperience = (index: number, nextExperience: EditableExperience) => {
    setExperiences((current) => current.map((experience, currentIndex) => (currentIndex === index ? nextExperience : experience)));
  };

  const removeExperience = (index: number) => {
    setExperiences((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEditable) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(() => {
      void (async () => {
        const result = await savePublicProfile(formData);
        if (!result.success) {
          setErrorMessage(result.error ?? "공개 프로필 저장에 실패했어요.");
          return;
        }

        setSuccessMessage("공개 프로필이 저장되었어요.");
      })();
    });
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#d7d5ca] bg-[#fcfcf7] p-6 shadow-[0_14px_35px_rgba(22,20,15,0.05)] md:p-8">
      <div className="mb-6">
        <p className="font-['Pretendard',sans-serif] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#16140f]/45">
          Public Profile
        </p>
        <h2 className="mt-2 font-[system-ui] text-[clamp(1.7rem,4vw,2.2rem)] font-black leading-tight text-[#16140f]">
          공개 프로필 편집
        </h2>
        <p className="mt-2 font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#6b6b5e]">
          소개, 링크, 경력, 공개 여부를 저장하면 공개 프로필 페이지 `/profile/{initial.slug}`에 반영됩니다.
        </p>
      </div>

      {!isEditable && (
        <div className="mb-6 rounded-2xl border border-[#ead8a7] bg-[#fff7df] px-4 py-4 font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#8b5e00]">
          현재 계정은 공개 프로필을 저장할 수 없습니다. 공개 프로필은 부원 또는 관리자만 만들 수 있어요.
        </div>
      )}

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-[#f2c9c3] bg-[#fff3f1] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#b42318]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-[#cae5d1] bg-[#eff9f2] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#25643b]">
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="experiences" value={serializedExperiences} />

        <section className="rounded-2xl border border-[#e1dfd4] bg-[#f8f8f2] p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">공개 주소</span>
              <div className="rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f]/80">
                /profile/{initial.slug}
              </div>
              <p className="font-['Pretendard',sans-serif] text-[12px] text-[#6b6b5e]">
                현재 버전에서는 공개 링크 주소를 변경할 수 없습니다.
              </p>
            </label>

            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">이름</span>
              <input name="name" value={name} onChange={(event) => setName(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>

            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">한 줄 소개</span>
              <input name="headline" value={headline} onChange={(event) => setHeadline(event.target.value)} disabled={disabled} maxLength={80} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>

            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">현재 역할</span>
              <input name="current_role" value={currentRole} onChange={(event) => setCurrentRole(event.target.value)} disabled={disabled} maxLength={50} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>

            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">현재 소속</span>
              <input name="company" value={company} onChange={(event) => setCompany(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">자기소개</span>
              <textarea name="bio" value={bio} onChange={(event) => setBio(event.target.value)} disabled={disabled} rows={6} maxLength={600} className="w-full rounded-2xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e1dfd4] bg-[#f8f8f2] p-5 md:p-6">
          <div className="mb-4">
            <h3 className="font-[system-ui] text-[1.15rem] font-black text-[#16140f]">링크</h3>
            <p className="mt-1 font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
              LinkedIn, Website, Brunch, GitHub 링크를 연결할 수 있어요.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">LinkedIn URL</span>
              <input name="linkedin_url" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">Website URL</span>
              <input name="website_url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">Brunch URL</span>
              <input name="brunch_url" value={brunchUrl} onChange={(event) => setBrunchUrl(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
            <label className="space-y-2">
              <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/70">GitHub URL</span>
              <input name="github_url" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F] disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
          </div>
        </section>

        <ExperienceEditor
          experiences={experiences}
          disabled={disabled}
          onAdd={addExperience}
          onMove={moveExperience}
          onRemove={removeExperience}
          onChange={updateExperience}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
            저장 후 `/profile`, `/blog`, `/profile/[slug]`에 반영됩니다.
          </p>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#FF6C0F] px-6 font-['Pretendard',sans-serif] text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "저장 중..." : "공개 프로필 저장"}
          </button>
        </div>
      </form>
    </section>
  );
}
