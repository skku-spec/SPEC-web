"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { AlertTriangle, CopyPlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import {
  deleteFormField,
  duplicateFieldsForBatch,
  getAllFormFieldsBatches,
  getFormFields,
  upsertFormField,
} from "@/lib/actions/form-builder";
import type { ApplicationFormField, FormFieldType } from "@/lib/actions/form-builder";

type Props = {
  initialBatch: string;
  initialBatches: string[];
  initialFields: ApplicationFormField[];
};

type EditorForm = {
  id?: string;
  field_name: string;
  label: string;
  description: string;
  field_type: FormFieldType;
  required: boolean;
  min_length: string;
  max_length: string;
  placeholder: string;
  step_number: string;
  sort_order: string;
};

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "텍스트" },
  { value: "textarea", label: "긴 텍스트" },
  { value: "select", label: "선택" },
  { value: "number", label: "숫자" },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10";

function toEditorForm(field?: ApplicationFormField): EditorForm {
  if (!field) {
    return {
      field_name: "",
      label: "",
      description: "",
      field_type: "text",
      required: true,
      min_length: "",
      max_length: "",
      placeholder: "",
      step_number: "0",
      sort_order: "0",
    };
  }

  return {
    id: field.id,
    field_name: field.field_name,
    label: field.label,
    description: field.description ?? "",
    field_type: field.field_type,
    required: field.required,
    min_length: field.min_length?.toString() ?? "",
    max_length: field.max_length?.toString() ?? "",
    placeholder: field.placeholder ?? "",
    step_number: field.step_number.toString(),
    sort_order: field.sort_order.toString(),
  };
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function sortBatchList(batches: string[]): string[] {
  return [...batches].sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numB - numA;
    return b.localeCompare(a, "ko");
  });
}

export default function FormBuilderClient({ initialBatch, initialBatches, initialFields }: Props) {
  const [selectedBatch, setSelectedBatch] = useState(initialBatch);
  const [batches, setBatches] = useState(sortBatchList(initialBatches));
  const [fields, setFields] = useState(initialFields);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<EditorForm>(toEditorForm());
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditMode = Boolean(form.id);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadBatchFields = useCallback((batch: string) => {
    if (!batch) {
      setFields([]);
      return;
    }

    startTransition(async () => {
      const result = await getFormFields(batch);
      if (result.success) {
        setFields(result.data ?? []);
        setErrorMsg(null);
      } else {
        setErrorMsg(result.error ?? "필드 목록을 불러오지 못했습니다.");
      }
    });
  }, []);

  const refreshBatches = useCallback((nextSelected?: string) => {
    startTransition(async () => {
      const result = await getAllFormFieldsBatches();
      if (!result.success) {
        setErrorMsg(result.error ?? "기수 목록을 불러오지 못했습니다.");
        return;
      }

      const sorted = sortBatchList(result.data ?? []);
      setBatches(sorted);

      const preferred = nextSelected && sorted.includes(nextSelected)
        ? nextSelected
        : sorted[0] ?? "";
      setSelectedBatch(preferred);

      if (preferred) {
        const fieldsResult = await getFormFields(preferred);
        if (fieldsResult.success) {
          setFields(fieldsResult.data ?? []);
          setErrorMsg(null);
        } else {
          setErrorMsg(fieldsResult.error ?? "필드 목록을 불러오지 못했습니다.");
        }
      } else {
        setFields([]);
      }
    });
  }, []);

  const groupedByStep = useMemo(() => {
    const map = new Map<number, ApplicationFormField[]>();
    for (const field of fields) {
      const list = map.get(field.step_number) ?? [];
      list.push(field);
      map.set(field.step_number, list);
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    for (const [, list] of entries) {
      list.sort((a, b) => a.sort_order - b.sort_order);
    }
    return entries;
  }, [fields]);

  const handleBatchChange = (batch: string) => {
    setSelectedBatch(batch);
    setEditorOpen(false);
    setForm(toEditorForm());
    loadBatchFields(batch);
  };

  const handleOpenCreate = () => {
    if (!selectedBatch) {
      showToast("먼저 기수를 선택해주세요.", "error");
      return;
    }
    setForm(toEditorForm());
    setEditorOpen(true);
  };

  const handleOpenEdit = (field: ApplicationFormField) => {
    setForm(toEditorForm(field));
    setEditorOpen(true);
  };

  const handleCancelEdit = () => {
    setEditorOpen(false);
    setForm(toEditorForm());
    setErrorMsg(null);
  };

  const handleSave = () => {
    if (!selectedBatch) {
      showToast("기수를 먼저 선택해주세요.", "error");
      return;
    }

    if (!form.field_name.trim()) {
      showToast("필드 이름을 입력해주세요.", "error");
      return;
    }

    if (!form.label.trim()) {
      showToast("라벨을 입력해주세요.", "error");
      return;
    }

    startTransition(async () => {
      const result = await upsertFormField({
        id: form.id,
        batch: selectedBatch,
        field_name: form.field_name,
        label: form.label,
        description: form.description.trim() || null,
        field_type: form.field_type,
        required: form.required,
        min_length: parseOptionalNumber(form.min_length),
        max_length: parseOptionalNumber(form.max_length),
        placeholder: form.placeholder.trim() || null,
        step_number: parseOptionalNumber(form.step_number) ?? 0,
        sort_order: parseOptionalNumber(form.sort_order) ?? 0,
      });

      if (!result.success) {
        setErrorMsg(result.error ?? "필드 저장 중 오류가 발생했습니다.");
        return;
      }

      const refreshed = await getFormFields(selectedBatch);
      if (refreshed.success) {
        setFields(refreshed.data ?? []);
      }

      setEditorOpen(false);
      setForm(toEditorForm());
      setErrorMsg(null);
      showToast(isEditMode ? "필드가 수정되었습니다." : "필드가 추가되었습니다.", "success");
    });
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("이 필드를 삭제하시겠습니까?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteFormField(id);
      if (!result.success) {
        setErrorMsg(result.error ?? "필드 삭제 중 오류가 발생했습니다.");
        return;
      }

      if (selectedBatch) {
        const refreshed = await getFormFields(selectedBatch);
        if (refreshed.success) {
          setFields(refreshed.data ?? []);
        }
      }

      setErrorMsg(null);
      showToast("필드가 삭제되었습니다.", "success");
    });
  };

  const handleDuplicateBatch = () => {
    if (!selectedBatch) {
      showToast("복사할 원본 기수를 선택해주세요.", "error");
      return;
    }

    const input = window.prompt("새 기수 번호를 입력해주세요.");
    const targetBatch = input?.trim() ?? "";
    if (!targetBatch) return;

    startTransition(async () => {
      const result = await duplicateFieldsForBatch(selectedBatch, targetBatch);
      if (!result.success) {
        setErrorMsg(result.error ?? "기수 복사 중 오류가 발생했습니다.");
        return;
      }

      setEditorOpen(false);
      setForm(toEditorForm());
      showToast(`${selectedBatch}기 필드를 ${targetBatch}기로 복사했습니다.`, "success");
      refreshBatches(targetBatch);
    });
  };

  return (
    <section className="relative">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg border px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold ${
            toast.type === "success"
              ? "border-[#2f9e44]/20 bg-[#E6F9E6] text-[#2f9e44]"
              : "border-[#b42318]/20 bg-[#FEE2E2] text-[#b42318]"
          }`}
        >
          {toast.message}
        </div>
      )}

      <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
        지원서 폼 빌더
      </h1>

      {errorMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#b42318]/20 bg-[#FEE2E2] px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b42318]" strokeWidth={2} />
          <p className="font-['Pretendard',sans-serif] text-sm font-medium text-[#b42318]">
            {errorMsg}
          </p>
        </div>
      )}

      <div className="mb-5 rounded-lg border border-[#ddd9cc] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label
              htmlFor="batch-selector"
              className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]"
            >
              기수 선택
            </label>
            <select
              id="batch-selector"
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              disabled={isPending || batches.length === 0}
              className={INPUT_CLASS}
            >
              {batches.length === 0 && <option value="">등록된 기수 없음</option>}
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}기
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDuplicateBatch}
            disabled={isPending || !selectedBatch}
            className="flex h-10 items-center gap-1.5 rounded-md border border-[#ddd9cc] px-4 font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
          >
            <CopyPlus className="h-4 w-4" strokeWidth={2} />
            새 기수 복사
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={isPending || !selectedBatch}
            className="flex h-10 items-center gap-1.5 rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            필드 추가
          </button>
        </div>
      </div>

      {editorOpen && (
        <div className="mb-5 rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
              {isEditMode ? "필드 수정" : "필드 추가"}
            </h2>
            <span className="rounded-full bg-[#FFF0E5] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
              {selectedBatch}기
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                field_name
              </label>
              <input
                type="text"
                value={form.field_name}
                onChange={(e) => setForm((prev) => ({ ...prev, field_name: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="startup_idea"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                label
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="창업 아이디어"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={INPUT_CLASS}
                placeholder="필드 설명을 입력해주세요."
              />
            </div>

            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                field_type
              </label>
              <select
                value={form.field_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, field_type: e.target.value as FormFieldType }))
                }
                className={INPUT_CLASS}
              >
                {FIELD_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm((prev) => ({ ...prev, required: e.target.checked }))}
                className="h-4 w-4 rounded border-[#ddd9cc] accent-[#FF6C0F]"
              />
              <span className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">필수 항목</span>
            </label>

            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                min_length
              </label>
              <input
                type="number"
                value={form.min_length}
                onChange={(e) => setForm((prev) => ({ ...prev, min_length: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="50"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                max_length
              </label>
              <input
                type="number"
                value={form.max_length}
                onChange={(e) => setForm((prev) => ({ ...prev, max_length: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="5000"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                step_number
              </label>
              <input
                type="number"
                value={form.step_number}
                onChange={(e) => setForm((prev) => ({ ...prev, step_number: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                sort_order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                placeholder
              </label>
              <input
                type="text"
                value={form.placeholder}
                onChange={(e) => setForm((prev) => ({ ...prev, placeholder: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="입력 안내 문구"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" strokeWidth={2} />
              저장
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isPending}
              className="flex h-8 items-center gap-1.5 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              취소
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {groupedByStep.map(([stepNumber, stepFields]) => (
          <div key={stepNumber} className="rounded-lg border border-[#ddd9cc] bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b border-[#f0efe6] pb-3">
              <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                Step {stepNumber}
              </h2>
              <span className="rounded-full bg-[#E8F0FE] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
                {stepFields.length}개 필드
              </span>
            </div>

            <div className="space-y-3">
              {stepFields.map((field) => (
                <article key={field.id} className="rounded-lg border border-[#ece8db] bg-[#fcfcf8] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                        {field.field_name}
                      </p>
                      <p className="mt-1 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        {field.label}
                      </p>
                      <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                        {field.description || "설명이 없습니다."}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(field)}
                        disabled={isPending}
                        className="flex h-8 items-center gap-1.5 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-white disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(field.id)}
                        disabled={isPending}
                        className="flex h-8 items-center gap-1.5 rounded-md border border-[#FEE2E2] bg-white px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#FEE2E2] disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#E8F0FE] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
                      {field.field_type}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                        field.required
                          ? "bg-[#E6F9E6] text-[#2f9e44]"
                          : "bg-[#f0efe6] text-[#6b6b5e]"
                      }`}
                    >
                      {field.required ? "필수" : "선택"}
                    </span>
                    <span className="rounded-full bg-[#f0efe6] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      min {field.min_length ?? "-"}
                    </span>
                    <span className="rounded-full bg-[#f0efe6] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      max {field.max_length ?? "-"}
                    </span>
                    <span className="rounded-full bg-[#FFF0E5] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
                      step {field.step_number}
                    </span>
                    <span className="rounded-full bg-[#f0efe6] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                      sort {field.sort_order}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="rounded-lg border border-[#ddd9cc] bg-white py-8 text-center">
            <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
              등록된 폼 필드가 없습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
