"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { Plus, Pencil, Trash2, X, FolderPlus, HelpCircle } from "lucide-react";
import {
  getAllFaqItems,
  upsertFaqItem,
  deleteFaqItem,
} from "@/lib/actions/faq";
import type { FaqItem } from "@/lib/actions/faq";

type FaqForm = {
  id?: string;
  section: string;
  section_title: string;
  question: string;
  answer: string;
  sort_order: number;
};

const EMPTY_FORM: FaqForm = {
  section: "",
  section_title: "",
  question: "",
  answer: "",
  sort_order: 0,
};

type GroupedSection = {
  section: string;
  section_title: string;
  items: FaqItem[];
};

function groupBySection(items: FaqItem[]): GroupedSection[] {
  const map = new Map<string, GroupedSection>();
  for (const item of items) {
    let group = map.get(item.section);
    if (!group) {
      group = {
        section: item.section,
        section_title: item.section_title,
        items: [],
      };
      map.set(item.section, group);
    }
    group.items.push(item);
  }
  return Array.from(map.values());
}

type FaqClientProps = {
  initialItems: FaqItem[];
};

export default function FaqClient({ initialItems }: FaqClientProps) {
  const [items, setItems] = useState<FaqItem[]>(initialItems);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<FaqForm>(EMPTY_FORM);
  const [showNewSection, setShowNewSection] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FaqItem | null>(null);

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const sections = groupBySection(items);
  const existingSections = sections.map((s) => ({
    section: s.section,
    section_title: s.section_title,
  }));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshItems = useCallback(() => {
    startTransition(async () => {
      const res = await getAllFaqItems();
      if (res.data) setItems(res.data);
    });
  }, []);

  const openCreate = (section?: string, sectionTitle?: string) => {
    setForm({
      ...EMPTY_FORM,
      section: section ?? "",
      section_title: sectionTitle ?? "",
      sort_order:
        section != null
          ? (sections
              .find((s) => s.section === section)
              ?.items.reduce(
                (max, i) => Math.max(max, i.sort_order),
                0,
              ) ?? 0) + 1
          : 0,
    });
    setShowEditor(true);
    setShowNewSection(false);
  };

  const openEdit = (item: FaqItem) => {
    setForm({
      id: item.id,
      section: item.section,
      section_title: item.section_title,
      question: item.question,
      answer: item.answer,
      sort_order: item.sort_order,
    });
    setShowEditor(true);
    setShowNewSection(false);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.section.trim() || !form.question.trim()) {
      setToast({ type: "error", message: "섹션과 질문은 필수입니다." });
      return;
    }

    startTransition(async () => {
      const res = await upsertFaqItem({
        id: form.id,
        section: form.section.trim(),
        section_title: form.section_title.trim(),
        question: form.question.trim(),
        answer: form.answer.trim(),
        sort_order: form.sort_order,
      });

      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({
          type: "success",
          message: form.id
            ? "FAQ 항목이 수정되었습니다."
            : "FAQ 항목이 추가되었습니다.",
        });
        closeEditor();
        refreshItems();
      }
    });
  };

  const confirmDelete = (item: FaqItem) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!deletingItem) return;

    startTransition(async () => {
      const res = await deleteFaqItem(deletingItem.id);
      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({ type: "success", message: "FAQ 항목이 삭제되었습니다." });
        refreshItems();
      }
      setShowDeleteDialog(false);
      setDeletingItem(null);
    });
  };

  const openNewSection = () => {
    setShowNewSection(true);
    setForm({ ...EMPTY_FORM });
    setShowEditor(true);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
          FAQ 관리
        </h1>
        <button
          type="button"
          onClick={openNewSection}
          disabled={isPending}
          className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-50"
        >
          <FolderPlus className="h-3.5 w-3.5" strokeWidth={2} />
          섹션 추가
        </button>
      </div>

      {toast && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 font-['Pretendard',sans-serif] text-sm ${
            toast.type === "success"
              ? "border-[#2f9e44]/20 bg-[#E6F9E6] text-[#2f9e44]"
              : "border-[#b42318]/20 bg-[#FEE2E2] text-[#b42318]"
          }`}
        >
          {toast.message}
        </div>
      )}

      {showEditor && (
        <div className="mb-6 rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {form.id ? "FAQ 수정" : showNewSection ? "새 섹션 추가" : "질문 추가"}
            </h2>
            <button
              type="button"
              onClick={closeEditor}
              className="text-[#6b6b5e] transition-colors hover:text-[#16140f]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  섹션 키
                </label>
                {showNewSection || !existingSections.length ? (
                  <input
                    type="text"
                    value={form.section}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        section: e.target.value,
                      }))
                    }
                    placeholder="예: general, application"
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                ) : (
                  <select
                    value={form.section}
                    onChange={(e) => {
                      const selected = existingSections.find(
                        (s) => s.section === e.target.value,
                      );
                      setForm((prev) => ({
                        ...prev,
                        section: e.target.value,
                        section_title: selected?.section_title ?? prev.section_title,
                      }));
                    }}
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  >
                    <option value="">섹션 선택</option>
                    {existingSections.map((s) => (
                      <option key={s.section} value={s.section}>
                        {s.section} — {s.section_title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  섹션 제목
                </label>
                <input
                  type="text"
                  value={form.section_title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      section_title: e.target.value,
                    }))
                  }
                  placeholder="예: 일반 질문"
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                질문
              </label>
              <textarea
                value={form.question}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, question: e.target.value }))
                }
                rows={2}
                placeholder="질문을 입력하세요"
                className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
              />
            </div>

            <div>
              <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                답변
              </label>
              <textarea
                value={form.answer}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, answer: e.target.value }))
                }
                rows={4}
                placeholder="답변을 입력하세요"
                className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
              />
            </div>

            <div className="w-32">
              <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                정렬 순서
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sort_order: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-50"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={closeEditor}
                disabled={isPending}
                className="flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {sections.length === 0 && !showEditor && (
        <div className="rounded-lg border border-[#ddd9cc] bg-white py-16 text-center">
          <HelpCircle
            className="mx-auto mb-3 h-8 w-8 text-[#6b6b5e]"
            strokeWidth={1.5}
          />
          <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            등록된 FAQ 항목이 없습니다.
          </p>
          <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
            &ldquo;섹션 추가&rdquo; 버튼을 눌러 첫 번째 FAQ를 만들어보세요.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {sections.map((group) => (
          <div key={group.section}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  {group.section_title}
                </h2>
                <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  {group.section}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreate(group.section, group.section_title)}
                disabled={isPending}
                className="flex h-8 items-center gap-1.5 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                질문 추가
              </button>
            </div>

            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#ddd9cc] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        {item.question}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                        {item.answer}
                      </p>
                      <p className="mt-2 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                        정렬: {item.sort_order}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        disabled={isPending}
                        className="flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(item)}
                        disabled={isPending}
                        className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] transition-colors hover:underline disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showDeleteDialog && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#ddd9cc] bg-white p-6">
            <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              FAQ 삭제
            </h3>
            <p className="mb-4 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              &ldquo;{deletingItem.question}&rdquo; 항목을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingItem(null);
                }}
                disabled={isPending}
                className="flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex h-8 items-center rounded-md bg-[#b42318] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#b42318]/90 disabled:opacity-50"
              >
                {isPending ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
