"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X, BookOpen, Lightbulb } from "lucide-react";

import {
  getCurriculumWeeks,
  getCurriculumAreas,
  upsertCurriculumWeek,
  deleteCurriculumWeek,
  upsertCurriculumArea,
  deleteCurriculumArea,
} from "@/lib/actions/curriculum";
import type { CurriculumWeek, CurriculumArea } from "@/lib/actions/curriculum";

type Tab = "learner" | "preneur";

type WeekForm = {
  track: string;
  week_number: string;
  week_label: string;
  topic: string;
  objectives: string;
  assignment: string;
  notes: string;
  start_date: string;
  end_date: string;
  batch: string;
  sort_order: string;
};

type AreaForm = {
  track: string;
  area_number: string;
  title: string;
  subtitle: string;
  description: string;
  activities: { id: string; value: string }[];
  batch: string;
  sort_order: string;
};

const EMPTY_WEEK: WeekForm = {
  track: "learner",
  week_number: "",
  week_label: "",
  topic: "",
  objectives: "",
  assignment: "",
  notes: "",
  start_date: "",
  end_date: "",
  batch: "default",
  sort_order: "0",
};

const EMPTY_AREA: AreaForm = {
  track: "preneur",
  area_number: "",
  title: "",
  subtitle: "",
  description: "",
  activities: [],
  batch: "default",
  sort_order: "0",
};

function weekToForm(w: CurriculumWeek): WeekForm {
  return {
    track: w.track,
    week_number: w.week_number?.toString() ?? "",
    week_label: w.week_label,
    topic: w.topic,
    objectives: w.objectives ?? "",
    assignment: w.assignment ?? "",
    notes: w.notes ?? "",
    start_date: w.start_date ?? "",
    end_date: w.end_date ?? "",
    batch: w.batch,
    sort_order: w.sort_order.toString(),
  };
}

function areaToForm(a: CurriculumArea): AreaForm {
  return {
    track: a.track,
    area_number: a.area_number,
    title: a.title,
    subtitle: a.subtitle ?? "",
    description: a.description ?? "",
    activities: Array.isArray(a.activities)
      ? a.activities.map((activity) => ({ id: crypto.randomUUID(), value: activity }))
      : [],
    batch: a.batch,
    sort_order: a.sort_order.toString(),
  };
}

type Props = {
  initialWeeks: CurriculumWeek[];
  initialAreas: CurriculumArea[];
};

export default function CurriculumClient({ initialWeeks, initialAreas }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("learner");
  const [weeks, setWeeks] = useState<CurriculumWeek[]>(initialWeeks);
  const [areas, setAreas] = useState<CurriculumArea[]>(initialAreas);

  const [showWeekEditor, setShowWeekEditor] = useState(false);
  const [editingWeek, setEditingWeek] = useState<CurriculumWeek | null>(null);
  const [weekForm, setWeekForm] = useState<WeekForm>(EMPTY_WEEK);

  const [showAreaEditor, setShowAreaEditor] = useState(false);
  const [editingArea, setEditingArea] = useState<CurriculumArea | null>(null);
  const [areaForm, setAreaForm] = useState<AreaForm>(EMPTY_AREA);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "week" | "area"; id: string; label: string } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if ((showWeekEditor || showAreaEditor) && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showWeekEditor, showAreaEditor]);

  const refreshWeeks = useCallback(() => {
    startTransition(async () => {
      const res = await getCurriculumWeeks("learner");
      if (res.data) setWeeks(res.data);
    });
  }, []);

  const refreshAreas = useCallback(() => {
    startTransition(async () => {
      const res = await getCurriculumAreas("preneur");
      if (res.data) setAreas(res.data);
    });
  }, []);

  const openCreateWeek = () => {
    setEditingWeek(null);
    setWeekForm({ ...EMPTY_WEEK, sort_order: weeks.length.toString() });
    setShowWeekEditor(true);
  };

  const openEditWeek = (w: CurriculumWeek) => {
    setEditingWeek(w);
    setWeekForm(weekToForm(w));
    setShowWeekEditor(true);
  };

  const closeWeekEditor = () => {
    setShowWeekEditor(false);
    setEditingWeek(null);
    setWeekForm(EMPTY_WEEK);
  };

  const handleSaveWeek = () => {
    if (!weekForm.week_label.trim() || !weekForm.topic.trim()) {
      setToast({ type: "error", message: "주차 라벨과 주제는 필수입니다." });
      return;
    }

    startTransition(async () => {
      const result = await upsertCurriculumWeek({
        id: editingWeek?.id,
        track: weekForm.track,
        week_number: weekForm.week_number ? parseInt(weekForm.week_number, 10) : null,
        week_label: weekForm.week_label,
        topic: weekForm.topic,
        objectives: weekForm.objectives || null,
        assignment: weekForm.assignment || null,
        notes: weekForm.notes || null,
        start_date: weekForm.start_date || null,
        end_date: weekForm.end_date || null,
        batch: weekForm.batch || "default",
        sort_order: parseInt(weekForm.sort_order, 10) || 0,
      });

      if (!result.success) {
        setToast({ type: "error", message: result.error ?? "저장에 실패했습니다." });
        return;
      }

      setToast({
        type: "success",
        message: editingWeek ? "주차가 수정되었습니다." : "주차가 추가되었습니다.",
      });
      closeWeekEditor();
      refreshWeeks();
    });
  };

  const openCreateArea = () => {
    setEditingArea(null);
    setAreaForm({ ...EMPTY_AREA, sort_order: areas.length.toString() });
    setShowAreaEditor(true);
  };

  const openEditArea = (a: CurriculumArea) => {
    setEditingArea(a);
    setAreaForm(areaToForm(a));
    setShowAreaEditor(true);
  };

  const closeAreaEditor = () => {
    setShowAreaEditor(false);
    setEditingArea(null);
    setAreaForm(EMPTY_AREA);
  };

  const handleSaveArea = () => {
    if (!areaForm.area_number.trim() || !areaForm.title.trim()) {
      setToast({ type: "error", message: "영역 번호와 제목은 필수입니다." });
      return;
    }

    startTransition(async () => {
      const result = await upsertCurriculumArea({
        id: editingArea?.id,
        track: areaForm.track,
        area_number: areaForm.area_number,
        title: areaForm.title,
        subtitle: areaForm.subtitle || null,
        description: areaForm.description || null,
        activities: areaForm.activities.map((a) => a.value).filter((a) => a.trim()),
        batch: areaForm.batch || "default",
        sort_order: parseInt(areaForm.sort_order, 10) || 0,
      });

      if (!result.success) {
        setToast({ type: "error", message: result.error ?? "저장에 실패했습니다." });
        return;
      }

      setToast({
        type: "success",
        message: editingArea ? "영역이 수정되었습니다." : "영역이 추가되었습니다.",
      });
      closeAreaEditor();
      refreshAreas();
    });
  };

  const confirmDelete = (type: "week" | "area", id: string, label: string) => {
    setDeleteTarget({ type, id, label });
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result =
        deleteTarget.type === "week"
          ? await deleteCurriculumWeek(deleteTarget.id)
          : await deleteCurriculumArea(deleteTarget.id);

      if (!result.success) {
        setToast({ type: "error", message: result.error ?? "삭제에 실패했습니다." });
      } else {
        setToast({ type: "success", message: "삭제되었습니다." });
        if (deleteTarget.type === "week") refreshWeeks();
        else refreshAreas();
      }
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    });
  };

  const addActivity = () => {
    setAreaForm((prev) => ({
      ...prev,
      activities: [...prev.activities, { id: crypto.randomUUID(), value: "" }],
    }));
  };

  const updateActivity = (id: string, value: string) => {
    setAreaForm((prev) => {
      const next = prev.activities.map((activity) => (activity.id === id ? { ...activity, value } : activity));
      return { ...prev, activities: next };
    });
  };

  const removeActivity = (id: string) => {
    setAreaForm((prev) => ({
      ...prev,
      activities: prev.activities.filter((activity) => activity.id !== id),
    }));
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "learner", label: "러너 트랙" },
    { key: "preneur", label: "프러너 트랙" },
  ];

  return (
    <section className="relative">
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-10 py-8">
            <svg
              className="h-8 w-8 animate-spin text-[#FF6C0F]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <title>처리 중</title>
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

      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-[#2f9e44]"
              : "border-red-200 bg-red-50 text-[#b42318]"
          }`}
        >
          {toast.message}
          <button type="button" onClick={() => setToast(null)} className="ml-2 text-current opacity-60 hover:opacity-100">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}

      {showDeleteDialog && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#ddd9cc] bg-white p-6">
            <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              삭제 확인
            </h3>
            <p className="mb-6 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              &ldquo;{deleteTarget.label}&rdquo;을(를) 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteTarget(null);
                }}
                className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-8 rounded-md bg-[#b42318] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
          커리큘럼 관리
        </h1>

        <div className="mb-6 flex gap-1 rounded-lg border border-[#ddd9cc] bg-[#f0efe6] p-1">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-4 py-2 font-['Pretendard',sans-serif] text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-[#16140f]"
                  : "text-[#6b6b5e] hover:text-[#16140f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "learner" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                총 {weeks.length}개 주차
              </p>
              <button
                type="button"
                onClick={openCreateWeek}
                className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                주차 추가
              </button>
            </div>

            {showWeekEditor && (
              <div ref={editorRef} className="mb-4 rounded-lg border border-[#ddd9cc] bg-white p-5">
                <h3 className="mb-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  {editingWeek ? "주차 수정" : "주차 추가"}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="curriculum-week-number" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      주차 번호
                    </label>
                    <input
                      id="curriculum-week-number"
                      type="number"
                      value={weekForm.week_number}
                      onChange={(e) => setWeekForm((p) => ({ ...p, week_number: e.target.value }))}
                      placeholder="1"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="curriculum-week-label" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      주차 라벨 *
                    </label>
                    <input
                      id="curriculum-week-label"
                      type="text"
                      value={weekForm.week_label}
                      onChange={(e) => setWeekForm((p) => ({ ...p, week_label: e.target.value }))}
                      placeholder="Week 1"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="curriculum-week-topic" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      주제 *
                    </label>
                    <input
                      id="curriculum-week-topic"
                      type="text"
                      value={weekForm.topic}
                      onChange={(e) => setWeekForm((p) => ({ ...p, topic: e.target.value }))}
                      placeholder="주제를 입력하세요"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="curriculum-week-objectives" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      학습 목표
                    </label>
                    <textarea
                      id="curriculum-week-objectives"
                      value={weekForm.objectives}
                      onChange={(e) => setWeekForm((p) => ({ ...p, objectives: e.target.value }))}
                      placeholder="학습 목표를 입력하세요"
                      rows={3}
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="curriculum-week-assignment" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      과제
                    </label>
                    <textarea
                      id="curriculum-week-assignment"
                      value={weekForm.assignment}
                      onChange={(e) => setWeekForm((p) => ({ ...p, assignment: e.target.value }))}
                      placeholder="과제 내용을 입력하세요"
                      rows={2}
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="curriculum-week-notes" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      비고
                    </label>
                    <input
                      id="curriculum-week-notes"
                      type="text"
                      value={weekForm.notes}
                      onChange={(e) => setWeekForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="비고"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="curriculum-week-start-date" className="mb-1 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      시작 날짜
                    </label>
                    <input
                      id="curriculum-week-start-date"
                      type="date"
                      value={weekForm.start_date}
                      onChange={(e) =>
                        setWeekForm((p) => ({
                          ...p,
                          start_date: e.target.value,
                          end_date: e.target.value ? p.end_date : "",
                        }))
                      }
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="curriculum-week-end-date" className="mb-1 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      종료 날짜 (선택)
                    </label>
                    <input
                      id="curriculum-week-end-date"
                      type="date"
                      value={weekForm.end_date}
                      disabled={!weekForm.start_date}
                      onChange={(e) => setWeekForm((p) => ({ ...p, end_date: e.target.value }))}
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10 disabled:cursor-not-allowed disabled:bg-[#f5f5ee] disabled:text-[#6b6b5e]"
                    />
                    <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      여러 날에 걸친 이벤트만 설정 (예: 해커톤)
                    </p>
                  </div>
                  <div>
                    <label htmlFor="curriculum-week-sort-order" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      정렬 순서
                    </label>
                    <input
                      id="curriculum-week-sort-order"
                      type="number"
                      value={weekForm.sort_order}
                      onChange={(e) => setWeekForm((p) => ({ ...p, sort_order: e.target.value }))}
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeWeekEditor}
                    className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWeek}
                    disabled={isPending}
                    className="h-8 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {editingWeek ? "수정" : "추가"}
                  </button>
                </div>
              </div>
            )}

            {weeks.length === 0 && !showWeekEditor ? (
              <div className="rounded-lg border border-[#ddd9cc] bg-white py-16 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-[#6b6b5e]" strokeWidth={1.5} />
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  등록된 주차가 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {weeks.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-lg border border-[#ddd9cc] bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {w.week_number != null && (
                            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#FFF0E5] px-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
                              {w.week_number}
                            </span>
                          )}
                          <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                            {w.week_label}
                          </span>
                        </div>
                        <p className="mb-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                          {w.topic}
                        </p>
                        {w.objectives && (
                          <div className="mb-1">
                            <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                              목표:
                            </span>
                            <span className="ml-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                              {w.objectives}
                            </span>
                          </div>
                        )}
                        {w.assignment && (
                          <div className="mb-1">
                            <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                              과제:
                            </span>
                            <span className="ml-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                              {w.assignment}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditWeek(w)}
                          className="flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete("week", w.id, w.week_label)}
                          className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] hover:underline px-2"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "preneur" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                총 {areas.length}개 영역
              </p>
              <button
                type="button"
                onClick={openCreateArea}
                className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                영역 추가
              </button>
            </div>

            {showAreaEditor && (
              <div ref={editorRef} className="mb-4 rounded-lg border border-[#ddd9cc] bg-white p-5">
                <h3 className="mb-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  {editingArea ? "영역 수정" : "영역 추가"}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="curriculum-area-number" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      영역 번호 *
                    </label>
                    <input
                      id="curriculum-area-number"
                      type="text"
                      value={areaForm.area_number}
                      onChange={(e) => setAreaForm((p) => ({ ...p, area_number: e.target.value }))}
                      placeholder="A1"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="curriculum-area-title" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      제목 *
                    </label>
                    <input
                      id="curriculum-area-title"
                      type="text"
                      value={areaForm.title}
                      onChange={(e) => setAreaForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="영역 제목"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="curriculum-area-subtitle" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      부제
                    </label>
                    <input
                      id="curriculum-area-subtitle"
                      type="text"
                      value={areaForm.subtitle}
                      onChange={(e) => setAreaForm((p) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="부제를 입력하세요"
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="curriculum-area-description" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      설명
                    </label>
                    <textarea
                      id="curriculum-area-description"
                      value={areaForm.description}
                      onChange={(e) => setAreaForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="영역 설명을 입력하세요"
                      rows={3}
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      활동 목록
                    </div>
                    <div className="space-y-2">
                            {areaForm.activities.map((activity) => (
                          <div key={activity.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={activity.value}
                              onChange={(e) => updateActivity(activity.id, e.target.value)}
                              placeholder="활동"
                              className="flex-1 rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                            />
                            <button
                              type="button"
                              onClick={() => removeActivity(activity.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#ddd9cc] text-[#b42318]"
                            >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addActivity}
                        className="flex h-8 items-center gap-1.5 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        활동 추가
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="curriculum-area-sort-order" className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      정렬 순서
                    </label>
                    <input
                      id="curriculum-area-sort-order"
                      type="number"
                      value={areaForm.sort_order}
                      onChange={(e) => setAreaForm((p) => ({ ...p, sort_order: e.target.value }))}
                      className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeAreaEditor}
                    className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveArea}
                    disabled={isPending}
                    className="h-8 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {editingArea ? "수정" : "추가"}
                  </button>
                </div>
              </div>
            )}

            {areas.length === 0 && !showAreaEditor ? (
              <div className="rounded-lg border border-[#ddd9cc] bg-white py-16 text-center">
                <Lightbulb className="mx-auto mb-3 h-8 w-8 text-[#6b6b5e]" strokeWidth={1.5} />
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  등록된 영역이 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {areas.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-[#ddd9cc] bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#E8F0FE] px-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
                            {a.area_number}
                          </span>
                          <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                            {a.title}
                          </span>
                        </div>
                        {a.subtitle && (
                          <p className="mb-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                            {a.subtitle}
                          </p>
                        )}
                        {a.description && (
                          <p className="mb-2 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                            {a.description}
                          </p>
                        )}
                        {Array.isArray(a.activities) && a.activities.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {a.activities.map((act) => (
                              <li
                                key={act}
                                className="flex items-start gap-2 font-['Pretendard',sans-serif] text-xs text-[#4a4a40]"
                              >
                                <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-[#6b6b5e]" />
                                {act}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditArea(a)}
                          className="flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete("area", a.id, a.title)}
                          className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] hover:underline px-2"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
