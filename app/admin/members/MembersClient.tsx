"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  AlertTriangle,
  Users,
} from "lucide-react";
import {
  getAllMembers,
  createMember,
  updateMember,
  deleteMember,
  exportMembersCSV,
} from "@/lib/actions/members";
import type { MemberWithProfile } from "@/lib/actions/members";

import type { MemberType } from "@/lib/supabase/types";

const MEMBER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "러너", label: "러너" },
  { value: "프러너", label: "프러너" },
  { value: "alumni", label: "Alumni" },
];

const MEMBER_TYPE_STYLE: Record<MemberType, { bg: string; text: string }> = {
  "러너": { bg: "bg-teal-50", text: "text-teal-700" },
  "프러너": { bg: "bg-purple-50", text: "text-purple-700" },
  alumni: { bg: "bg-gray-100", text: "text-gray-600" },
};

function memberTypeLabel(t: string): string {
  if (t === "러너") return "러너";
  if (t === "프러너") return "프러너";
  return "Alumni";
}

function extractBatches(members: MemberWithProfile[]): string[] {
  const set = new Set<string>();
  for (const m of members) {
    if (m.learner_batch) set.add(m.learner_batch);
    if (m.preneur_batch) set.add(m.preneur_batch);
  }
  return Array.from(set).sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ""), 10);
    const numB = parseInt(b.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

type MemberForm = {
  name: string;
  student_id: string;
  phone: string;
  email: string;
  major: string;
  learner_batch: string;
  preneur_batch: string;
  member_type: MemberType;
  batch_tags: string;
  bio: string;
  notes: string;
};

const EMPTY_FORM: MemberForm = {
  name: "",
  student_id: "",
  phone: "",
  email: "",
  major: "",
  learner_batch: "",
  preneur_batch: "",
  member_type: "러너",
  batch_tags: "",
  bio: "",
  notes: "",
};

function memberToForm(m: MemberWithProfile): MemberForm {
  return {
    name: m.name,
    student_id: m.student_id ?? "",
    phone: m.phone ?? "",
    email: m.email ?? "",
    major: m.major ?? "",
    learner_batch: m.learner_batch ?? "",
    preneur_batch: m.preneur_batch ?? "",
    member_type: m.member_type as MemberType,
    batch_tags: (m.batch_tags ?? []).join(", "),
    bio: m.bio ?? "",
    notes: m.notes ?? "",
  };
}

type MembersClientProps = {
  initialMembers: MemberWithProfile[];
};

export default function MembersClient({ initialMembers }: MembersClientProps) {
  const [members, setMembers] = useState<MemberWithProfile[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const [showEditor, setShowEditor] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithProfile | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMember, setDeletingMember] = useState<MemberWithProfile | null>(null);

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const batches = extractBatches(members);

  const filtered = members.filter((m) => {
    if (selectedType && m.member_type !== selectedType) return false;
    if (selectedBatch) {
      if (m.learner_batch !== selectedBatch && m.preneur_batch !== selectedBatch) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = [m.name, m.student_id, m.email, m.major, m.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (showEditor && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showEditor]);

  const refreshMembers = useCallback(() => {
    startTransition(async () => {
      const res = await getAllMembers();
      if (res.data) setMembers(res.data);
    });
  }, []);

  const openCreate = () => {
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setShowEditor(true);
  };

  const openEdit = (m: MemberWithProfile) => {
    setEditingMember(m);
    setForm(memberToForm(m));
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingMember(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (field: keyof MemberForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setToast({ type: "error", message: "이름을 입력해주세요." });
      return;
    }

    const tags = form.batch_tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        student_id: form.student_id || null,
        phone: form.phone || null,
        email: form.email || null,
        major: form.major || null,
        learner_batch: form.learner_batch || null,
        preneur_batch: form.preneur_batch || null,
        batch_tags: tags,
        bio: form.bio || null,
        notes: form.notes || null,
      };

      const result = editingMember
        ? await updateMember(editingMember.id, { ...payload, member_type: form.member_type })
        : await createMember({ ...payload, member_type: form.member_type });

      if (result.error) {
        setToast({ type: "error", message: result.error });
        return;
      }

      setToast({
        type: "success",
        message: editingMember ? "멤버 정보가 수정되었습니다." : "새 멤버가 추가되었습니다.",
      });
      closeEditor();
      refreshMembers();
    });
  };

  const confirmDelete = (m: MemberWithProfile) => {
    setDeletingMember(m);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!deletingMember) return;
    startTransition(async () => {
      const result = await deleteMember(deletingMember.id);
      if (result.error) {
        setToast({ type: "error", message: result.error });
      } else {
        setToast({ type: "success", message: "멤버가 삭제되었습니다." });
        refreshMembers();
      }
      setShowDeleteDialog(false);
      setDeletingMember(null);
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      const filters: { batch?: string; member_type?: string; search?: string } = {};
      if (selectedBatch) filters.batch = selectedBatch;
      if (selectedType) filters.member_type = selectedType;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const result = await exportMembersCSV(filters);
      if (result.error || !result.data) {
        setToast({ type: "error", message: result.error ?? "CSV 내보내기에 실패했습니다." });
        return;
      }

      const bom = "\uFEFF";
      const blob = new Blob([bom + result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `members_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <section className="relative">
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-10 py-8">
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

      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-[#2f9e44]"
              : "border-red-200 bg-red-50 text-[#b42318]"
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-current opacity-60 hover:opacity-100">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
              멤버 관리
            </h1>
            <p className="mt-1 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
              총 {members.length}명
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              멤버 추가
            </button>
            <button
              onClick={handleExport}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              CSV 내보내기
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b5e]" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 학번, 이메일, 전공으로 검색..."
              className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 pl-10 pr-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
            />
          </div>

          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="h-10 appearance-none rounded-lg border border-[#ddd9cc] bg-white py-2.5 pl-4 pr-9 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
            >
              <option value="">기수 전체</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b5e]" strokeWidth={2} />
          </div>

          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 appearance-none rounded-lg border border-[#ddd9cc] bg-white py-2.5 pl-4 pr-9 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
            >
              {MEMBER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b5e]" strokeWidth={2} />
          </div>

          <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
            {filtered.length !== members.length
              ? `${filtered.length}명 / 전체 ${members.length}명`
              : `전체 ${members.length}명`}
          </p>
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white md:block">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">이름</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">학번</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">전공</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">기수</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">구분</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">역할 태그</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const initial = m.name.trim().charAt(0).toUpperCase() || "?";
                const batch = m.learner_batch || m.preneur_batch || "-";
                const typeStyle = MEMBER_TYPE_STYLE[m.member_type as MemberType] ?? MEMBER_TYPE_STYLE.alumni;

                return (
                  <tr key={m.id} className="border-t border-[#ece8db]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                            {m.name}
                          </p>
                          <p className="truncate font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                            {m.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {m.student_id || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {m.major || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {batch}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${typeStyle.bg} ${typeStyle.text}`}
                      >
                        {memberTypeLabel(m.member_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.batch_tags.length > 0
                          ? m.batch_tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex rounded-full bg-[#f0efe6] px-2 py-0.5 font-['Pretendard',sans-serif] text-xs font-medium text-[#4a4a40]"
                              >
                                {tag}
                              </span>
                            ))
                          : <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(m)}
                          className="inline-flex items-center gap-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          수정
                        </button>
                        <button
                          onClick={() => confirmDelete(m)}
                          className="inline-flex items-center gap-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr className="border-t border-[#ece8db]">
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-[#6b6b5e]" strokeWidth={1.5} />
                      <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                        {searchQuery.trim() || selectedBatch || selectedType
                          ? "검색 결과가 없습니다."
                          : "등록된 멤버가 없습니다."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          {filtered.map((m) => {
            const initial = m.name.trim().charAt(0).toUpperCase() || "?";
            const batch = m.learner_batch || m.preneur_batch || "-";
            const typeStyle = MEMBER_TYPE_STYLE[m.member_type as MemberType] ?? MEMBER_TYPE_STYLE.alumni;

            return (
              <div
                key={m.id}
                className="rounded-lg border border-[#ddd9cc] bg-white p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {m.name}
                    </p>
                    <p className="truncate font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      {m.slug}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${typeStyle.bg} ${typeStyle.text}`}
                  >
                    {memberTypeLabel(m.member_type)}
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">학번</span>
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{m.student_id || "-"}</p>
                  </div>
                  <div>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">전공</span>
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{m.major || "-"}</p>
                  </div>
                  <div>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">기수</span>
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{batch}</p>
                  </div>
                  <div>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">태그</span>
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {m.batch_tags.length > 0 ? m.batch_tags.join(", ") : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-[#ece8db] pt-3">
                  <button
                    onClick={() => openEdit(m)}
                    className="inline-flex items-center gap-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    수정
                  </button>
                  <button
                    onClick={() => confirmDelete(m)}
                    className="inline-flex items-center gap-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    삭제
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-[#ddd9cc] bg-white py-8">
              <Users className="h-8 w-8 text-[#6b6b5e]" strokeWidth={1.5} />
              <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                {searchQuery.trim() || selectedBatch || selectedType
                  ? "검색 결과가 없습니다."
                  : "등록된 멤버가 없습니다."}
              </p>
            </div>
          )}
        </div>

        {showEditor && (
          <div ref={editorRef} className="mt-6 rounded-lg border border-[#ddd9cc] bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
                {editingMember ? "멤버 수정" : "새 멤버 추가"}
              </h2>
              <button
                onClick={closeEditor}
                className="grid h-8 w-8 place-items-center rounded-md text-[#6b6b5e] transition-colors hover:bg-[#f0efe6]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput label="이름" required value={form.name} onChange={(v) => handleChange("name", v)} placeholder="홍길동" />
              <FieldInput label="학번" value={form.student_id} onChange={(v) => handleChange("student_id", v)} placeholder="2024123456" />
              <FieldInput label="전화번호" value={form.phone} onChange={(v) => handleChange("phone", v)} placeholder="010-1234-5678" />
              <FieldInput label="이메일" value={form.email} onChange={(v) => handleChange("email", v)} placeholder="email@example.com" />
              <FieldInput label="전공" value={form.major} onChange={(v) => handleChange("major", v)} placeholder="컴퓨터공학과" />
              <FieldInput label="러너 기수" value={form.learner_batch} onChange={(v) => handleChange("learner_batch", v)} placeholder="4기" />
              <FieldInput label="프러너 기수" value={form.preneur_batch} onChange={(v) => handleChange("preneur_batch", v)} placeholder="2기" />

              <div>
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">
                  구분
                </label>
                <div className="relative">
                  <select
                    value={form.member_type}
                    onChange={(e) => handleChange("member_type", e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-[#ddd9cc] bg-white py-2.5 pl-4 pr-9 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                  >
                    <option value="러너">러너</option>
                    <option value="프러너">프러너</option>
                    <option value="alumni">Alumni</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b5e]" strokeWidth={2} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <FieldInput
                  label="역할 태그"
                  value={form.batch_tags}
                  onChange={(v) => handleChange("batch_tags", v)}
                  placeholder="태그1, 태그2, 태그3 (쉼표로 구분)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">
                  소개
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={3}
                  placeholder="멤버 소개를 입력하세요..."
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">
                  관리자 메모
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  placeholder="관리자만 볼 수 있는 메모..."
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#ece8db] pt-4">
              <button
                onClick={closeEditor}
                className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex h-8 items-center rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-50"
              >
                {editingMember ? "수정 저장" : "추가하기"}
              </button>
            </div>
          </div>
        )}

        {showDeleteDialog && deletingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-lg border border-[#ddd9cc] bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-[#b42318]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                    멤버 삭제
                  </h3>
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
              </div>
              <p className="mb-5 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                <span className="font-semibold text-[#16140f]">{deletingMember.name}</span> 멤버를 정말 삭제하시겠습니까?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeletingMember(null);
                  }}
                  className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="inline-flex h-8 items-center rounded-md bg-[#b42318] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#b42318]/90 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type FieldInputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
};

function FieldInput({ label, value, onChange, placeholder, required }: FieldInputProps) {
  return (
    <div>
      <label className="mb-1 block font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">
        {label}
        {required && <span className="ml-0.5 text-[#b42318]">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
      />
    </div>
  );
}
