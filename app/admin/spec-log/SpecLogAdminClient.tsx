"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { CURRENT_BATCH } from "@/lib/constants";
import {
  getEventsByBatch,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/actions/spec-log";

const BATCHES = ["1기", "2기", "3기", "4기"];

type EventItem = {
  id: string;
  title: string;
  description: string;
  batch: string;
  status: string;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator: { id: string; name: string } | null;
  logCount: number;
  participantCount: number;
  recentAuthors: { name: string }[];
};

type EventForm = {
  id?: string;
  title: string;
  description: string;
  batch: string;
  status: string;
  start_date: string;
  end_date: string;
};

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  batch: CURRENT_BATCH,
  status: "upcoming",
  start_date: "",
  end_date: "",
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "진행 중", bg: "bg-[#E6F9E6]", text: "text-[#2f9e44]" },
  upcoming: { label: "예정", bg: "bg-[#E8F0FE]", text: "text-[#2563EB]" },
  closed: { label: "종료", bg: "bg-[#f0efe6]", text: "text-[#6b6b5e]" },
};

const STATUS_FILTERS = [
  { value: "전체", key: "" },
  { value: "진행 중", key: "active" },
  { value: "예정", key: "upcoming" },
  { value: "종료", key: "closed" },
];

type SpecLogAdminClientProps = {
  initialEvents: EventItem[];
};

export default function SpecLogAdminClient({ initialEvents }: SpecLogAdminClientProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [batchFilter, setBatchFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!showModal && !showDeleteDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteDialog) {
          setShowDeleteDialog(false);
          setDeletingEvent(null);
        } else if (showModal) {
          setShowModal(false);
          setForm(EMPTY_FORM);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal, showDeleteDialog]);

  const refreshEvents = useCallback(() => {
    startTransition(async () => {
      const results = await Promise.all(BATCHES.map((b) => getEventsByBatch(b)));
      setEvents(results.flatMap((r) => r.data ?? []));
    });
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (event: EventItem) => {
    setForm({
      id: event.id,
      title: event.title,
      description: event.description,
      batch: event.batch,
      status: event.status,
      start_date: event.start_date,
      end_date: event.end_date,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.start_date || !form.end_date) {
      setToast({ type: "error", message: "제목, 시작일, 종료일은 필수입니다." });
      return;
    }

    startTransition(async () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        batch: form.batch,
        status: form.status,
        start_date: form.start_date,
        end_date: form.end_date,
      };

      const res = form.id
        ? await updateEvent(form.id, payload)
        : await createEvent(payload);

      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({
          type: "success",
          message: form.id ? "이벤트가 수정되었습니다." : "이벤트가 추가되었습니다.",
        });
        closeModal();
        refreshEvents();
      }
    });
  };

  const confirmDelete = (event: EventItem) => {
    setDeletingEvent(event);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!deletingEvent) return;

    startTransition(async () => {
      const res = await deleteEvent(deletingEvent.id);
      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({ type: "success", message: "이벤트가 삭제되었습니다." });
        refreshEvents();
      }
      setShowDeleteDialog(false);
      setDeletingEvent(null);
    });
  };

  const filtered = events.filter((e) => {
    if (batchFilter !== "전체" && e.batch !== batchFilter) return false;
    if (statusFilter !== "전체") {
      const match = STATUS_FILTERS.find((sf) => sf.value === statusFilter);
      if (match && e.status !== match.key) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => dateStr.slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
          SPEC 로그 관리
        </h1>
        <button
          type="button"
          onClick={openCreate}
          disabled={isPending}
          className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          이벤트 추가
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

      <div className="mb-4 flex gap-3">
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="h-8 rounded-md border border-[#ddd9cc] bg-white px-3 font-['Pretendard',sans-serif] text-xs text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
        >
          <option value="전체">전체 기수</option>
          {BATCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-[#ddd9cc] bg-white px-3 font-['Pretendard',sans-serif] text-xs text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
        >
          {STATUS_FILTERS.map((sf) => (
            <option key={sf.value} value={sf.value}>
              {sf.value === "전체" ? "전체 상태" : sf.value}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
        <table className="w-full">
          <thead className="bg-[#f0efe6] text-left">
            <tr>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                제목
              </th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                기수
              </th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                상태
              </th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                기간
              </th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                로그 수
              </th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]"
                >
                  등록된 이벤트가 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((event) => {
                const statusInfo = STATUS_MAP[event.status] ?? STATUS_MAP.closed;
                return (
                  <tr key={event.id} className="border-t border-[#ece8db]">
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {event.title}
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {event.batch}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {formatDate(event.start_date)} ~ {formatDate(event.end_date)}
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {event.logCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          disabled={isPending}
                          className="flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(event)}
                          disabled={isPending}
                          className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] transition-colors hover:underline disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          role="presentation"
        >
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                {form.id ? "이벤트 수정" : "이벤트 추가"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#6b6b5e] transition-colors hover:text-[#16140f]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  제목
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="이벤트 제목"
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>

              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                  설명
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="이벤트 설명 (선택)"
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                    기수
                  </label>
                  <select
                    value={form.batch}
                    onChange={(e) => setForm((prev) => ({ ...prev, batch: e.target.value }))}
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  >
                    {BATCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                    상태
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  >
                    <option value="active">진행 중</option>
                    <option value="upcoming">예정</option>
                    <option value="closed">종료</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                </div>
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
                  onClick={closeModal}
                  disabled={isPending}
                  className="flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f5f5ee] disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#ddd9cc] bg-white p-6">
            <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              이벤트 삭제
            </h3>
            <p className="mb-4 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              &ldquo;{deletingEvent.title}&rdquo; 이벤트를 삭제하시겠습니까?
              {deletingEvent.logCount > 0 && (
                <span className="mt-1 block font-['Pretendard',sans-serif] text-xs text-[#b42318]">
                  연관된 로그 {deletingEvent.logCount}개도 함께 삭제됩니다.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingEvent(null);
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
