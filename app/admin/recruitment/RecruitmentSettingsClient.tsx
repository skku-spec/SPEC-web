"use client";

import { useState, useTransition, useCallback } from "react";
import { AlertTriangle, Plus, Trash2, Check, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";

import type {
  RecruitmentSettings,
  WaitlistEntry,
  RecruitmentStatus,
  TimelineStep,
} from "@/lib/types/recruitment";
import { STATUS_LABELS, STATUS_BADGE_STYLES } from "@/lib/types/recruitment";
import {
  upsertRecruitmentSettings,
  updateRecruitmentStatus,
  deleteWaitlistEntry,
} from "@/lib/actions/recruitment";
import CustomSelect from "@/components/ui/CustomSelect";
import { formatKoreanDate } from "@/lib/utils/koreanDate";

type Props = {
  allRecruitments: RecruitmentSettings[];
  activeRecruitment: RecruitmentSettings | null;
  waitlistEntries: WaitlistEntry[];
};

type FormData = {
  batch: string;
  batch_label: string;
  short_label: string;
  banner_label: string;
  hero_badge: string;
  status: RecruitmentStatus;
};

type LocalTimelineStep = TimelineStep & { _key: string };

const STATUS_OPTIONS: { value: RecruitmentStatus; label: string }[] = [
  { value: "recruiting", label: STATUS_LABELS.recruiting },
  { value: "reviewing", label: STATUS_LABELS.reviewing },
  { value: "closed", label: STATUS_LABELS.closed },
  { value: "upcoming", label: STATUS_LABELS.upcoming },
];

function emptyForm(nextBatch?: string): FormData {
  return {
    batch: nextBatch ?? "",
    batch_label: "",
    short_label: "",
    banner_label: "",
    hero_badge: "",
    status: "upcoming",
  };
}

function settingsToForm(s: RecruitmentSettings): FormData {
  return {
    batch: s.batch,
    batch_label: s.batch_label,
    short_label: s.short_label,
    banner_label: s.banner_label,
    hero_badge: s.hero_badge,
    status: s.status,
  };
}

function settingsToTimeline(s: RecruitmentSettings): LocalTimelineStep[] {
  const raw = (s.timeline_steps ?? []) as TimelineStep[];
  return raw.map((step, i) => ({ ...step, _key: `existing-${i}-${Date.now()}` }));
}

function makeKey() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newStep(): LocalTimelineStep {
  const now = new Date();
  return {
    _key: makeKey(),
    title: "",
    date: "",
    highlight: false,
    start: { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
    end: undefined,
  };
}

function formatDate(iso: string) {
  return formatKoreanDate(iso, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPhone(raw: string) {
  if (raw.length === 11) return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
  if (raw.length === 10) return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
  return raw;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 disabled:opacity-50"
    />
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  disabled,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-3 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 disabled:opacity-50"
    />
  );
}

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[#2f9e44]/30 bg-white px-4 py-3">
      <Check className="h-4 w-4 text-[#2f9e44]" strokeWidth={2} />
      <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#2f9e44]">
        {message}
      </span>
    </div>
  );
}

export default function RecruitmentSettingsClient({
  allRecruitments,
  activeRecruitment,
  waitlistEntries,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const initial = activeRecruitment ?? allRecruitments[0] ?? null;
  const [editingBatch, setEditingBatch] = useState<string | null>(initial?.batch ?? null);
  const [formData, setFormData] = useState<FormData>(
    initial ? settingsToForm(initial) : emptyForm("1"),
  );
  const [timelineSteps, setTimelineSteps] = useState<LocalTimelineStep[]>(
    initial ? settingsToTimeline(initial) : [],
  );

  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState(true);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateStep = useCallback(
    (key: string, patch: Partial<LocalTimelineStep>) => {
      setTimelineSteps((prev) =>
        prev.map((s) => (s._key === key ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  const removeStep = useCallback((key: string) => {
    setTimelineSteps((prev) => prev.filter((s) => s._key !== key));
  }, []);

  function handleStatusChange(newStatus: string) {
    if (!editingBatch) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await updateRecruitmentStatus(editingBatch, newStatus as RecruitmentStatus);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        updateField("status", newStatus as RecruitmentStatus);
        showToast("상태가 변경되었습니다.");
      }
    });
  }

  function handleSave() {
    setErrorMsg(null);
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const steps: TimelineStep[] = timelineSteps.map(({ _key, ...rest }) => rest);
      const result = await upsertRecruitmentSettings({
        ...formData,
        timeline_steps: steps,
      });
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setEditingBatch(formData.batch);
        showToast("설정이 저장되었습니다.");
      }
    });
  }

  function handleNewBatch() {
    const maxBatch = allRecruitments.reduce((max, r) => {
      const n = parseInt(r.batch, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextBatch = String(maxBatch + 1);
    setEditingBatch(null);
    setFormData(emptyForm(nextBatch));
    setTimelineSteps([]);
    setErrorMsg(null);
  }

  function handleLoadBatch(settings: RecruitmentSettings) {
    setEditingBatch(settings.batch);
    setFormData(settingsToForm(settings));
    setTimelineSteps(settingsToTimeline(settings));
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDeleteWaitlist(id: string) {
    startTransition(async () => {
      const result = await deleteWaitlistEntry(id);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        showToast("대기자가 삭제되었습니다.");
      }
    });
  }

  return (
    <section className="relative">
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-8 py-6">
            <svg
              className="h-8 w-8 animate-spin text-[#FF6C0F]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              처리 중입니다...
            </p>
          </div>
        </div>
      )}

      {toast && <SuccessToast message={toast} />}

      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">
          모집 관리
        </h1>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#b42318]/20 bg-[#FEE2E2] px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#b42318]" strokeWidth={2} />
            <p className="font-['Pretendard',sans-serif] text-sm font-medium text-[#b42318]">
              {errorMsg}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {editingBatch && (
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  현재 상태
                </h2>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${STATUS_BADGE_STYLES[formData.status]}`}
                >
                  {STATUS_LABELS[formData.status]}
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full max-w-xs">
                  <Label>상태 변경</Label>
                  <CustomSelect
                    value={formData.status}
                    onChange={handleStatusChange}
                    options={STATUS_OPTIONS}
                    disabled={isPending}
                    className="w-full"
                  />
                </div>
              </div>

              {formData.status === "recruiting" && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-[#FFF0E5] px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6C0F]" strokeWidth={2} />
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#FF6C0F]">
                    모집을 시작하면 다른 기수의 모집이 자동으로 마감됩니다.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
            <h2 className="mb-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {editingBatch ? `${editingBatch}기 설정` : "새 기수 등록"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>기수 번호</Label>
                <TextInput
                  value={formData.batch}
                  onChange={(v) => updateField("batch", v)}
                  placeholder="5"
                  disabled={isPending}
                />
              </div>

              <div>
                <Label>기수 라벨</Label>
                <TextInput
                  value={formData.batch_label}
                  onChange={(v) => updateField("batch_label", v)}
                  placeholder="SPEC 5기 러너"
                  disabled={isPending}
                />
              </div>

              <div>
                <Label>짧은 라벨</Label>
                <TextInput
                  value={formData.short_label}
                  onChange={(v) => updateField("short_label", v)}
                  placeholder="SPEC 5기 모집"
                  disabled={isPending}
                />
              </div>

              <div>
                <Label>배너 라벨</Label>
                <TextInput
                  value={formData.banner_label}
                  onChange={(v) => updateField("banner_label", v)}
                  placeholder="SPEC 5기 러너 모집 중"
                  disabled={isPending}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>히어로 뱃지</Label>
                <TextInput
                  value={formData.hero_badge}
                  onChange={(v) => updateField("hero_badge", v)}
                  placeholder="2026 Fall · 5기"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
            <button
              type="button"
              onClick={() => setExpandedTimeline((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#6b6b5e]" strokeWidth={2} />
                <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  모집 일정
                </h2>
                <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  {timelineSteps.length}개
                </span>
              </div>
              {expandedTimeline ? (
                <ChevronUp className="h-4 w-4 text-[#6b6b5e]" strokeWidth={2} />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#6b6b5e]" strokeWidth={2} />
              )}
            </button>

            {expandedTimeline && (
              <div className="mt-4 flex flex-col gap-4">
                {timelineSteps.length === 0 && (
                  <p className="py-4 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    등록된 일정이 없습니다.
                  </p>
                )}

                {timelineSteps.map((step, idx) => (
                  <div
                    key={step._key}
                    className="rounded-lg border border-[#ece8db] bg-[#fcfcf8] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                        일정 {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStep(step._key)}
                        disabled={isPending}
                        className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] hover:underline disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>제목</Label>
                        <TextInput
                          value={step.title}
                          onChange={(v) => updateStep(step._key, { title: v })}
                          placeholder="서류 접수"
                          disabled={isPending}
                        />
                      </div>
                      <div>
                        <Label>표시 날짜</Label>
                        <TextInput
                          value={step.date}
                          onChange={(v) => updateStep(step._key, { date: v })}
                          placeholder="3/24 ~ 4/7"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label>시작일</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <NumberInput
                            value={step.start.year}
                            onChange={(v) =>
                              updateStep(step._key, {
                                start: { ...step.start, year: v },
                              })
                            }
                            placeholder="년"
                            disabled={isPending}
                            min={2020}
                            max={2040}
                          />
                        </div>
                        <div className="w-20">
                          <NumberInput
                            value={step.start.month}
                            onChange={(v) =>
                              updateStep(step._key, {
                                start: { ...step.start, month: v },
                              })
                            }
                            placeholder="월"
                            disabled={isPending}
                            min={1}
                            max={12}
                          />
                        </div>
                        <div className="w-20">
                          <NumberInput
                            value={step.start.day}
                            onChange={(v) =>
                              updateStep(step._key, {
                                start: { ...step.start, day: v },
                              })
                            }
                            placeholder="일"
                            disabled={isPending}
                            min={1}
                            max={31}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Label>종료일</Label>
                        <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                          (선택)
                        </span>
                      </div>
                      {step.end ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <NumberInput
                              value={step.end.year}
                              onChange={(v) =>
                                updateStep(step._key, {
                                  end: { ...step.end!, year: v },
                                })
                              }
                              placeholder="년"
                              disabled={isPending}
                              min={2020}
                              max={2040}
                            />
                          </div>
                          <div className="w-20">
                            <NumberInput
                              value={step.end.month}
                              onChange={(v) =>
                                updateStep(step._key, {
                                  end: { ...step.end!, month: v },
                                })
                              }
                              placeholder="월"
                              disabled={isPending}
                              min={1}
                              max={12}
                            />
                          </div>
                          <div className="w-20">
                            <NumberInput
                              value={step.end.day}
                              onChange={(v) =>
                                updateStep(step._key, {
                                  end: { ...step.end!, day: v },
                                })
                              }
                              placeholder="일"
                              disabled={isPending}
                              min={1}
                              max={31}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => updateStep(step._key, { end: undefined })}
                            disabled={isPending}
                            className="font-['Pretendard',sans-serif] text-xs font-medium text-[#b42318] hover:underline disabled:opacity-50"
                          >
                            제거
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateStep(step._key, {
                              end: { ...step.start },
                            })
                          }
                          disabled={isPending}
                          className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
                        >
                          종료일 추가
                        </button>
                      )}
                    </div>

                    <label className="mt-3 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={step.highlight ?? false}
                        onChange={(e) =>
                          updateStep(step._key, { highlight: e.target.checked })
                        }
                        disabled={isPending}
                        className="h-4 w-4 rounded border-[#ddd9cc] text-[#FF6C0F] accent-[#FF6C0F]"
                      />
                      <span className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                        강조 표시
                      </span>
                    </label>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setTimelineSteps((prev) => [...prev, newStep()])}
                  disabled={isPending}
                  className="flex h-8 items-center gap-1.5 self-start rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  일정 추가
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !formData.batch.trim()}
              className="h-10 rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-50"
            >
              설정 저장
            </button>
            <button
              type="button"
              onClick={handleNewBatch}
              disabled={isPending}
              className="h-10 rounded-md border border-[#ddd9cc] px-4 font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
            >
              새 기수 등록
            </button>
          </div>

          <div>
            <h2 className="mb-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              기수 이력
            </h2>

            <div className="hidden overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white sm:block">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f0efe6] text-left">
                  <tr>
                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                      기수
                    </th>
                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                      라벨
                    </th>
                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                      상태
                    </th>
                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                      생성일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allRecruitments.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => handleLoadBatch(r)}
                      className={`cursor-pointer border-t border-[#ece8db] transition-colors hover:bg-[#fcfcf8] ${
                        editingBatch === r.batch ? "bg-[#FFF0E5]/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        {r.batch}기
                      </td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                        {r.batch_label}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${STATUS_BADGE_STYLES[r.status]}`}
                        >
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  ))}
                  {allRecruitments.length === 0 && (
                    <tr className="border-t border-[#ece8db]">
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]"
                      >
                        등록된 기수가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 sm:hidden">
              {allRecruitments.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleLoadBatch(r)}
                  className={`w-full rounded-lg border border-[#ddd9cc] bg-white p-4 text-left transition-colors hover:bg-[#fcfcf8] ${
                    editingBatch === r.batch ? "border-[#FF6C0F]/40 bg-[#FFF0E5]/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {r.batch}기
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${STATUS_BADGE_STYLES[r.status]}`}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <p className="mt-1 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    {r.batch_label}
                  </p>
                  <p className="mt-0.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                    {formatDate(r.created_at)}
                  </p>
                </button>
              ))}
              {allRecruitments.length === 0 && (
                <p className="py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  등록된 기수가 없습니다.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                모집 알림 대기자
              </h2>
              <span className="inline-flex rounded-full bg-[#E8F0FE] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
                {waitlistEntries.length}
              </span>
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white sm:block">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f0efe6] text-left">
                  <tr>
                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                      전화번호
                    </th>
                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                      등록일
                    </th>
                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">
                      삭제
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-[#ece8db]">
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                        {formatPhone(entry.phone)}
                      </td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteWaitlist(entry.id)}
                          disabled={isPending}
                          className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] hover:underline disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {waitlistEntries.length === 0 && (
                    <tr className="border-t border-[#ece8db]">
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]"
                      >
                        등록된 대기자가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 sm:hidden">
              {waitlistEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-[#ddd9cc] bg-white p-4"
                >
                  <div>
                    <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {formatPhone(entry.phone)}
                    </p>
                    <p className="mt-0.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteWaitlist(entry.id)}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[#b42318] transition-colors hover:bg-[#FEE2E2] disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
              {waitlistEntries.length === 0 && (
                <p className="py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  등록된 대기자가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
