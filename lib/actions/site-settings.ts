"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { logAuditEvent } from "@/lib/helpers/audit-log";
import { createClient } from "@/lib/supabase/server";

export type SiteSetting = {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string;
  description: string | null;
  value_type: string;
  sort_order: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

// "site_settings" isn't in the generated Database type yet — remove this
// cast after running `supabase gen types` to regenerate lib/supabase/types.ts.
type TableName = never;
const TABLE = "site_settings" as TableName;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateValue(value: string, valueType: string): string | null {
  if (valueType === "email" && value && !isValidEmail(value)) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  if (valueType === "url" && value && !isValidUrl(value)) {
    return "올바른 URL 형식이 아닙니다.";
  }
  return null;
}

function revalidateSettingsPaths() {
  revalidatePath("/admin/settings");
  revalidatePath("/contact");
  revalidatePath("/");
}

export async function getAllSettings(): Promise<{
  success: boolean;
  data?: SiteSetting[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("category")
      .order("sort_order");

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as SiteSetting[] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getSettingsByCategory(category: string): Promise<{
  success: boolean;
  data?: SiteSetting[];
  error?: string;
}> {
  try {
    if (!category) {
      return { success: false, error: "카테고리를 지정해주세요." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("category", category)
      .order("sort_order");

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as SiteSetting[] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getSetting(key: string): Promise<{
  success: boolean;
  data?: SiteSetting | null;
  error?: string;
}> {
  try {
    if (!key) {
      return { success: false, error: "설정 키를 지정해주세요." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return { success: true, data: (data as unknown as SiteSetting) ?? null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getSettingsMap(): Promise<{
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("key, value");

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as { key: string; value: string }[];
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }

    return { success: true, data: map };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function updateSetting(
  key: string,
  value: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();

    if (!key) {
      return { success: false, error: "설정 키를 지정해주세요." };
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from(TABLE)
      .select("value_type")
      .eq("key", key)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);

    if (!existing) {
      return { success: false, error: "해당 설정을 찾을 수 없습니다." };
    }

    const row = existing as unknown as { value_type: string };
    const validationError = validateValue(value, row.value_type);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const { error: updateError } = await supabase
      .from(TABLE)
      .update({ value, updated_by: user.id } as never)
      .eq("key", key);

    if (updateError) throw new Error(updateError.message);

    await logAuditEvent({
      action: "update",
      entityType: "site_setting",
      details: { key },
    });

    revalidateSettingsPaths();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function updateSettings(
  updates: { key: string; value: string }[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();

    if (!updates || updates.length === 0) {
      return { success: false, error: "업데이트할 설정이 없습니다." };
    }

    const supabase = await createClient();

    const keys = updates.map((u) => u.key);
    const { data: existingSettings, error: fetchError } = await supabase
      .from(TABLE)
      .select("key, value_type")
      .in("key", keys);

    if (fetchError) throw new Error(fetchError.message);

    const rows = (existingSettings ?? []) as unknown as { key: string; value_type: string }[];
    const typeMap: Record<string, string> = {};
    for (const s of rows) {
      typeMap[s.key] = s.value_type;
    }

    for (const { key, value } of updates) {
      const valueType = typeMap[key];
      if (!valueType) {
        return { success: false, error: `설정 키 "${key}"를 찾을 수 없습니다.` };
      }
      const validationError = validateValue(value, valueType);
      if (validationError) {
        return { success: false, error: `"${key}": ${validationError}` };
      }
    }

    for (const { key, value } of updates) {
      const { error: updateError } = await supabase
        .from(TABLE)
        .update({ value, updated_by: user.id } as never)
        .eq("key", key);

      if (updateError) throw new Error(`"${key}" 업데이트 실패: ${updateError.message}`);
    }

    await logAuditEvent({
      action: "update",
      entityType: "site_setting",
      details: { keys: updates.map((u) => u.key) },
    });

    revalidateSettingsPaths();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function createSetting(data: {
  key: string;
  value: string;
  category: string;
  label: string;
  value_type?: string;
  sort_order?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!data.key || !data.category || !data.label) {
      return { success: false, error: "키, 카테고리, 라벨은 필수입니다." };
    }

    const valueType = data.value_type ?? "string";
    const validationError = validateValue(data.value, valueType);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const supabase = await createClient();

    const { data: existing, error: checkError } = await supabase
      .from(TABLE)
      .select("id")
      .eq("key", data.key)
      .maybeSingle();

    if (checkError) throw new Error(checkError.message);

    if (existing) {
      return { success: false, error: `설정 키 "${data.key}"가 이미 존재합니다.` };
    }

    const { error: insertError } = await supabase.from(TABLE).insert({
      key: data.key,
      value: data.value,
      category: data.category,
      label: data.label,
      value_type: valueType,
      sort_order: data.sort_order ?? 0,
    } as never);

    if (insertError) throw new Error(insertError.message);

    revalidateSettingsPaths();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 생성하는 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteSetting(
  key: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!key) {
      return { success: false, error: "설정 키를 지정해주세요." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("key", key);

    if (error) throw new Error(error.message);

    revalidateSettingsPaths();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "설정을 삭제하는 중 오류가 발생했습니다.",
    };
  }
}
