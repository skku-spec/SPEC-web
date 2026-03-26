"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Partner = {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PartnerActionResult<T> = {
  success?: boolean;
  error?: string;
  data?: T;
};

const PARTNERS_TABLE = "partners";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const REVALIDATE_PATHS = ["/admin/partners", "/"] as const;

function revalidateAll(): void {
  for (const p of REVALIDATE_PATHS) {
    revalidatePath(p);
  }
}

/* ------------------------------------------------------------------ */
/*  Public reads                                                       */
/* ------------------------------------------------------------------ */

export async function getAllPartners(): Promise<PartnerActionResult<Partner[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(PARTNERS_TABLE)
      .select("*")
      .order("sort_order");

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as Partner[] };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "파트너 목록을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getActivePartners(): Promise<
  PartnerActionResult<Partner[]>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(PARTNERS_TABLE)
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as Partner[] };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "파트너 목록을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Admin mutations                                                    */
/* ------------------------------------------------------------------ */

export async function upsertPartner(data: {
  id?: string;
  name: string;
  logo_url: string;
  website_url?: string;
  sort_order: number;
  is_active?: boolean;
}): Promise<PartnerActionResult<null>> {
  try {
    await requireAdmin();

    if (!data.name.trim() || !data.logo_url.trim()) {
      return { error: "이름과 로고 URL은 필수입니다." };
    }

    const supabase = await createClient();

    const payload = {
      name: data.name.trim(),
      logo_url: data.logo_url.trim(),
      website_url: data.website_url?.trim() || null,
      sort_order: data.sort_order,
      is_active: data.is_active ?? true,
    };

    if (data.id) {
      const { error } = await supabase
        .from(PARTNERS_TABLE)
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from(PARTNERS_TABLE).insert(payload);
      if (error) throw new Error(error.message);
    }

    revalidateAll();
    return { success: true, data: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "파트너를 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function deletePartner(
  id: string,
): Promise<PartnerActionResult<null>> {
  try {
    await requireAdmin();

    if (!id) {
      return { error: "삭제할 파트너 ID가 필요합니다." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from(PARTNERS_TABLE)
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidateAll();
    return { success: true, data: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "파트너를 삭제하는 중 오류가 발생했습니다.",
    };
  }
}
