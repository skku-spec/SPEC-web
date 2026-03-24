"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormFieldType = "text" | "textarea" | "select" | "number";

export type ApplicationFormField = {
  id: string;
  batch: string;
  field_name: string;
  label: string;
  description: string | null;
  field_type: FormFieldType;
  required: boolean;
  min_length: number | null;
  max_length: number | null;
  placeholder: string | null;
  options: unknown;
  step_number: number;
  sort_order: number;
  is_active: boolean;
};

type UpsertFormFieldInput = {
  id?: string;
  batch: string;
  field_name: string;
  label: string;
  description?: string | null;
  field_type?: FormFieldType;
  required?: boolean;
  min_length?: number | null;
  max_length?: number | null;
  placeholder?: string | null;
  options?: unknown;
  step_number?: number;
  sort_order?: number;
  is_active?: boolean;
};

// "application_form_fields" isn't in the generated Database type yet — remove this
// cast after running `supabase gen types` to regenerate lib/supabase/types.ts.
type TableName = never;
const TABLE = "application_form_fields" as TableName;

function revalidateFormBuilderPaths() {
  revalidatePath("/admin/form-builder");
  revalidatePath("/apply");
}

function parseBatchNumber(batch: string): number {
  const n = parseInt(batch, 10);
  return Number.isNaN(n) ? Number.NEGATIVE_INFINITY : n;
}

function sortBatchesDesc(batches: string[]): string[] {
  return [...batches].sort((a, b) => {
    const numA = parseBatchNumber(a);
    const numB = parseBatchNumber(b);
    if (numA !== Number.NEGATIVE_INFINITY && numB !== Number.NEGATIVE_INFINITY) {
      return numB - numA;
    }
    return b.localeCompare(a, "ko");
  });
}

export async function getFormFields(batch: string): Promise<{
  success: boolean;
  data?: ApplicationFormField[];
  error?: string;
}> {
  try {
    const trimmedBatch = batch.trim();
    if (!trimmedBatch) {
      return { success: false, error: "기수를 지정해주세요." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("batch", trimmedBatch)
      .eq("is_active", true)
      .order("step_number")
      .order("sort_order");

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as ApplicationFormField[] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "폼 필드를 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getAllFormFieldsBatches(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    await requireRole("preneur");

    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("batch")
      .order("batch", { ascending: false });

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as { batch: string }[];
    const uniqueBatches = Array.from(
      new Set(rows.map((row) => row.batch).filter(Boolean)),
    );

    return { success: true, data: sortBatchesDesc(uniqueBatches) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "기수 목록을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function upsertFormField(
  input: UpsertFormFieldInput,
): Promise<{ success: boolean; data?: ApplicationFormField; error?: string }> {
  try {
    await requireRole("preneur");

    const batch = input.batch.trim();
    const fieldName = input.field_name.trim();
    const label = input.label.trim();

    if (!label) {
      return { success: false, error: "라벨은 필수입니다." };
    }
    if (!fieldName) {
      return { success: false, error: "필드 이름은 필수입니다." };
    }
    if (!batch) {
      return { success: false, error: "기수는 필수입니다." };
    }

    const supabase = await createClient();

    const payload = {
      batch,
      field_name: fieldName,
      label,
      description: input.description ?? null,
      field_type: input.field_type ?? "text",
      required: input.required ?? true,
      min_length: input.min_length ?? null,
      max_length: input.max_length ?? null,
      placeholder: input.placeholder ?? null,
      options: input.options ?? null,
      step_number: input.step_number ?? 0,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    };

    if (input.id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(payload as never)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) {
        return { success: false, error: "수정할 필드를 찾을 수 없습니다." };
      }

      revalidateFormBuilderPaths();
      return { success: true, data: data as unknown as ApplicationFormField };
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload as never)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    revalidateFormBuilderPaths();
    return { success: true, data: data as unknown as ApplicationFormField };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "폼 필드를 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteFormField(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole("preneur");

    if (!id) {
      return { success: false, error: "삭제할 필드 ID가 필요합니다." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidateFormBuilderPaths();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "폼 필드를 삭제하는 중 오류가 발생했습니다.",
    };
  }
}

export async function duplicateFieldsForBatch(
  sourceBatch: string,
  targetBatch: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole("preneur");

    const source = sourceBatch.trim();
    const target = targetBatch.trim();

    if (!source || !target) {
      return { success: false, error: "복사할 원본/대상 기수를 입력해주세요." };
    }

    if (source === target) {
      return { success: false, error: "원본 기수와 대상 기수는 달라야 합니다." };
    }

    const supabase = await createClient();

    const { data: sourceFields, error: sourceError } = await supabase
      .from(TABLE)
      .select("*")
      .eq("batch", source)
      .order("step_number")
      .order("sort_order");

    if (sourceError) throw new Error(sourceError.message);

    const fields = (sourceFields ?? []) as unknown as ApplicationFormField[];
    if (fields.length === 0) {
      return { success: false, error: "원본 기수에 복사할 필드가 없습니다." };
    }

    const { data: existingTargetRows, error: targetCheckError } = await supabase
      .from(TABLE)
      .select("id")
      .eq("batch", target)
      .limit(1);

    if (targetCheckError) throw new Error(targetCheckError.message);

    if ((existingTargetRows ?? []).length > 0) {
      return { success: false, error: "대상 기수에 이미 필드가 존재합니다." };
    }

    const insertRows = fields.map((field) => ({
      batch: target,
      field_name: field.field_name,
      label: field.label,
      description: field.description,
      field_type: field.field_type,
      required: field.required,
      min_length: field.min_length,
      max_length: field.max_length,
      placeholder: field.placeholder,
      options: field.options,
      step_number: field.step_number,
      sort_order: field.sort_order,
      is_active: field.is_active,
    }));

    const { error: insertError } = await supabase
      .from(TABLE)
      .insert(insertRows as never);

    if (insertError) throw new Error(insertError.message);

    revalidateFormBuilderPaths();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "폼 필드를 복사하는 중 오류가 발생했습니다.",
    };
  }
}
