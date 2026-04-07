"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CurriculumWeek = {
  id: string;
  track: string;
  week_number: number | null;
  week_label: string;
  topic: string;
  objectives: string | null;
  assignment: string | null;
  notes: string | null;
  batch: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  start_date: string | null;
  end_date: string | null;
};

export type CurriculumArea = {
  id: string;
  track: string;
  area_number: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  activities: string[];
  batch: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const WEEKS_TABLE = "curriculum_weeks";
const AREAS_TABLE = "curriculum_areas";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function revalidateCurriculum() {
  revalidatePath("/admin/curriculum");
  revalidatePath("/curriculum");
}

/* ------------------------------------------------------------------ */
/*  Public reads                                                       */
/* ------------------------------------------------------------------ */

export async function getCurriculumWeeks(
  track: string,
  batch?: string,
): Promise<{ success: boolean; data?: CurriculumWeek[]; error?: string }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from(WEEKS_TABLE)
      .select("*")
      .eq("track", track)
      .order("sort_order");

    if (batch) {
      query = query.eq("batch", batch);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as CurriculumWeek[] };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "커리큘럼 주차를 불러오는 중 오류가 발생했습니다.",
    };
  }
}

export async function getCurriculumAreas(
  track: string,
  batch?: string,
): Promise<{ success: boolean; data?: CurriculumArea[]; error?: string }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from(AREAS_TABLE)
      .select("*")
      .eq("track", track)
      .order("sort_order");

    if (batch) {
      query = query.eq("batch", batch);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return { success: true, data: (data ?? []) as unknown as CurriculumArea[] };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "커리큘럼 영역을 불러오는 중 오류가 발생했습니다.",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Admin mutations                                                    */
/* ------------------------------------------------------------------ */

export async function upsertCurriculumWeek(data: {
  id?: string;
  track: string;
  week_number: number | null;
  week_label: string;
  topic: string;
  objectives: string | null;
  assignment: string | null;
  notes: string | null;
  batch: string;
  sort_order: number;
  start_date?: string | null;
  end_date?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!data.week_label.trim() || !data.topic.trim()) {
      return { success: false, error: "주차 라벨과 주제는 필수입니다." };
    }

    if (data.end_date && !data.start_date) {
      return {
        success: false,
        error: "종료 날짜를 설정하려면 시작 날짜가 필요합니다.",
      };
    }

    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      return {
        success: false,
        error: "종료 날짜는 시작 날짜 이후여야 합니다.",
      };
    }

    const supabase = await createClient();

    const payload = {
      track: data.track,
      week_number: data.week_number,
      week_label: data.week_label.trim(),
      topic: data.topic.trim(),
      objectives: data.objectives?.trim() || null,
      assignment: data.assignment?.trim() || null,
      notes: data.notes?.trim() || null,
      batch: data.batch || "default",
      sort_order: data.sort_order,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
    };

    if (data.id) {
      const { error } = await supabase
        .from(WEEKS_TABLE)
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from(WEEKS_TABLE).insert(payload);
      if (error) throw new Error(error.message);
    }

    revalidateCurriculum();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "주차 정보를 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteCurriculumWeek(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!id) {
      return { success: false, error: "삭제할 주차 ID가 필요합니다." };
    }

    const supabase = await createClient();

    const { error } = await supabase.from(WEEKS_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidateCurriculum();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "주차를 삭제하는 중 오류가 발생했습니다.",
    };
  }
}

export async function upsertCurriculumArea(data: {
  id?: string;
  track: string;
  area_number: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  activities: string[];
  batch: string;
  sort_order: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!data.area_number.trim() || !data.title.trim()) {
      return { success: false, error: "영역 번호와 제목은 필수입니다." };
    }

    const supabase = await createClient();

    const payload = {
      track: data.track,
      area_number: data.area_number.trim(),
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || null,
      description: data.description?.trim() || null,
      activities: data.activities.filter((a) => a.trim()),
      batch: data.batch || "default",
      sort_order: data.sort_order,
    };

    if (data.id) {
      const { error } = await supabase
        .from(AREAS_TABLE)
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from(AREAS_TABLE).insert(payload);
      if (error) throw new Error(error.message);
    }

    revalidateCurriculum();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "영역 정보를 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteCurriculumArea(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!id) {
      return { success: false, error: "삭제할 영역 ID가 필요합니다." };
    }

    const supabase = await createClient();

    const { error } = await supabase.from(AREAS_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidateCurriculum();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "영역을 삭제하는 중 오류가 발생했습니다.",
    };
  }
}
