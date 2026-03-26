"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FaqItem = {
  id: string;
  section: string;
  section_title: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FaqSection = {
  section: string;
  section_title: string;
};

type FaqActionResult<T> = {
  success?: boolean;
  error?: string;
  data?: T;
};

/* Table not yet in generated Supabase types — cast via `as never`. */
type TableName = never;
const FAQ_TABLE = "faq_items" as TableName;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const REVALIDATE_PATHS = ["/admin/faq", "/demoday/faq"] as const;

function revalidateAll(): void {
  for (const p of REVALIDATE_PATHS) {
    revalidatePath(p);
  }
}

/* ------------------------------------------------------------------ */
/*  Public reads                                                       */
/* ------------------------------------------------------------------ */

export async function getAllFaqItems(): Promise<FaqActionResult<FaqItem[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(FAQ_TABLE)
      .select("*")
      .eq("is_active", true)
      .order("section")
      .order("sort_order");

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as FaqItem[] };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "FAQ 목록을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getFaqBySection(
  section: string,
): Promise<FaqActionResult<FaqItem[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(FAQ_TABLE)
      .select("*")
      .eq("section", section)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as FaqItem[] };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "FAQ 항목을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getFaqSections(): Promise<FaqActionResult<FaqSection[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(FAQ_TABLE)
      .select("section, section_title")
      .eq("is_active", true)
      .order("section");

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as FaqSection[];
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (!seen.has(row.section)) {
        seen.set(row.section, row.section_title);
      }
    }

    const sections: FaqSection[] = Array.from(seen.entries()).map(
      ([section, section_title]) => ({ section, section_title }),
    );

    return { success: true, data: sections };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "FAQ 섹션을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Admin mutations                                                    */
/* ------------------------------------------------------------------ */

export async function upsertFaqItem(data: {
  id?: string;
  section: string;
  section_title: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active?: boolean;
}): Promise<FaqActionResult<null>> {
  try {
    await requireAdmin();

    if (!data.section.trim() || !data.question.trim()) {
      return { error: "섹션과 질문은 필수입니다." };
    }

    const supabase = await createClient();

    const payload = {
      section: data.section.trim(),
      section_title: data.section_title.trim(),
      question: data.question.trim(),
      answer: data.answer.trim(),
      sort_order: data.sort_order,
      is_active: data.is_active ?? true,
    } as never;

    if (data.id) {
      const { error } = await supabase
        .from(FAQ_TABLE)
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from(FAQ_TABLE).insert(payload);
      if (error) throw new Error(error.message);
    }

    revalidateAll();
    return { success: true, data: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "FAQ 항목을 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteFaqItem(
  id: string,
): Promise<FaqActionResult<null>> {
  try {
    await requireAdmin();

    if (!id) {
      return { error: "삭제할 FAQ ID가 필요합니다." };
    }

    const supabase = await createClient();

    const { error } = await supabase.from(FAQ_TABLE).delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidateAll();
    return { success: true, data: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "FAQ 항목을 삭제하는 중 오류가 발생했습니다.",
    };
  }
}
