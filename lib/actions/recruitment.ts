"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logAuditEvent } from "@/lib/helpers/audit-log";
import { createClient } from "@/lib/supabase/server";
import {
  type RecruitmentSettings,
  type RecruitmentStatus,
  type WaitlistEntry,
  type TimelineStep,
  validateRecruitmentInput,
  validatePhone,
  normalizePhone,
  isValidRecruitmentStatus,
  validateTimelineSteps,
} from "@/lib/types/recruitment";

type RecruitmentActionResult<T> = {
  success?: boolean;
  error?: string;
  data?: T;
};

type WaitlistSubmitResult = {
  success?: boolean;
  error?: string;
  duplicate?: boolean;
  message?: string;
};

type UpsertRecruitmentInput = {
  batch: string;
  batch_label: string;
  short_label: string;
  banner_label: string;
  hero_badge: string;
  status: RecruitmentStatus;
  show_banner?: boolean;
  timeline_steps: TimelineStep[];
};

function getDefaultShowBanner(status: RecruitmentStatus): boolean {
  return status !== "closed";
}

export async function getActiveRecruitment(): Promise<RecruitmentActionResult<RecruitmentSettings | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recruitment_settings")
      .select("*")
      .neq("status", "closed")
      .limit(1)
      .maybeSingle();

    if (error) {
      return { error: "모집 설정 조회 중 오류가 발생했습니다." };
    }

    return { success: true, data: data ?? null };
  } catch {
    return { error: "모집 설정 조회 중 오류가 발생했습니다." };
  }
}

export async function getRecruitmentByBatch(batch: string): Promise<RecruitmentActionResult<RecruitmentSettings | null>> {
  try {
    const trimmedBatch = batch.trim();
    if (!trimmedBatch) {
      return { error: "기수 정보를 입력해주세요." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recruitment_settings")
      .select("*")
      .eq("batch", trimmedBatch)
      .maybeSingle();

    if (error) {
      return { error: "기수별 모집 설정 조회 중 오류가 발생했습니다." };
    }

    return { success: true, data: data ?? null };
  } catch {
    return { error: "기수별 모집 설정 조회 중 오류가 발생했습니다." };
  }
}

export async function submitWaitlistPhone(phone: string): Promise<WaitlistSubmitResult> {
  try {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return { error: phoneError };
    }

    const normalizedPhone = normalizePhone(phone);
    const supabase = await createClient();
    const { error } = await supabase.from("recruitment_waitlist").insert({ phone: normalizedPhone });

    if (error) {
      if (error.code === "23505") {
        return {
          success: true,
          duplicate: true,
          message: "이미 등록된 번호입니다",
        };
      }
      return { error: "대기자 등록 중 오류가 발생했습니다." };
    }

    return {
      success: true,
      duplicate: false,
    };
  } catch {
    return { error: "대기자 등록 중 오류가 발생했습니다." };
  }
}

export async function getAllRecruitments(): Promise<RecruitmentActionResult<RecruitmentSettings[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recruitment_settings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { error: "모집 설정 목록 조회 중 오류가 발생했습니다." };
    }

    return { success: true, data: data ?? [] };
  } catch {
    return { error: "모집 설정 목록 조회 중 오류가 발생했습니다." };
  }
}

export async function upsertRecruitmentSettings(
  input: UpsertRecruitmentInput,
): Promise<RecruitmentActionResult<RecruitmentSettings>> {
  try {
    await requireAdmin();

    const validationError = validateRecruitmentInput({
      batch: input.batch,
      batch_label: input.batch_label,
      short_label: input.short_label,
      status: input.status,
      timeline_steps: input.timeline_steps,
    });
    if (validationError) {
      return { error: validationError };
    }

    if (!validateTimelineSteps(input.timeline_steps)) {
      return { error: "일정 데이터가 올바르지 않습니다." };
    }

    if (!isValidRecruitmentStatus(input.status)) {
      return { error: "유효하지 않은 상태입니다." };
    }

    const supabase = await createClient();

    if (input.status === "recruiting") {
      const { error: closeOthersError } = await supabase
        .from("recruitment_settings")
        .update({ status: "closed", show_banner: false })
        .neq("batch", input.batch);

      if (closeOthersError) {
        return { error: "기존 모집 설정 종료 처리 중 오류가 발생했습니다." };
      }
    }

    const showBanner = input.show_banner ?? getDefaultShowBanner(input.status);
    const upsertPayload = {
      batch: input.batch,
      batch_label: input.batch_label,
      short_label: input.short_label,
      banner_label: input.banner_label,
      hero_badge: input.hero_badge,
      status: input.status,
      show_banner: showBanner,
      timeline_steps: input.timeline_steps,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("recruitment_settings")
      .upsert(upsertPayload, { onConflict: "batch" })
      .select("*")
      .single();

    if (error) {
      return { error: "모집 설정 저장 중 오류가 발생했습니다." };
    }

    await logAuditEvent({
      action: "update",
      entityType: "recruitment",
      details: { batch: input.batch, status: input.status },
    });

    revalidatePath("/apply");
    revalidatePath("/admin/recruitment");
    revalidatePath("/");

    return { success: true, data };
  } catch {
    return { error: "모집 설정 저장 중 오류가 발생했습니다." };
  }
}

export async function updateRecruitmentStatus(
  batch: string,
  status: RecruitmentStatus,
): Promise<RecruitmentActionResult<RecruitmentSettings>> {
  try {
    await requireAdmin();

    const trimmedBatch = batch.trim();
    if (!trimmedBatch) {
      return { error: "기수 정보를 입력해주세요." };
    }

    if (!isValidRecruitmentStatus(status)) {
      return { error: "유효하지 않은 상태입니다." };
    }

    const supabase = await createClient();

    if (status === "recruiting") {
      const { error: closeOthersError } = await supabase
        .from("recruitment_settings")
        .update({ status: "closed", show_banner: false })
        .neq("batch", trimmedBatch);

      if (closeOthersError) {
        return { error: "기존 모집 설정 종료 처리 중 오류가 발생했습니다." };
      }
    }

    const { data, error } = await supabase
      .from("recruitment_settings")
      .update({
        status,
        show_banner: getDefaultShowBanner(status),
        updated_at: new Date().toISOString(),
      })
      .eq("batch", trimmedBatch)
      .select("*")
      .maybeSingle();

    if (error) {
      return { error: "모집 상태 변경 중 오류가 발생했습니다." };
    }

    if (!data) {
      return { error: "해당 기수의 모집 설정을 찾을 수 없습니다." };
    }

    await logAuditEvent({
      action: "status_change",
      entityType: "recruitment",
      details: { batch: trimmedBatch, status },
    });

    revalidatePath("/apply");
    revalidatePath("/admin/recruitment");
    revalidatePath("/");

    return { success: true, data };
  } catch {
    return { error: "모집 상태 변경 중 오류가 발생했습니다." };
  }
}

export async function getWaitlistEntries(): Promise<RecruitmentActionResult<WaitlistEntry[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recruitment_waitlist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { error: "대기자 목록 조회 중 오류가 발생했습니다." };
    }

    return { success: true, data: data ?? [] };
  } catch {
    return { error: "대기자 목록 조회 중 오류가 발생했습니다." };
  }
}

export async function deleteWaitlistEntry(id: string): Promise<RecruitmentActionResult<null>> {
  try {
    await requireAdmin();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recruitment_waitlist")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      return { error: "대기자 삭제 중 오류가 발생했습니다." };
    }

    if (!data || data.length === 0) {
      return { error: "삭제할 대기자 정보를 찾을 수 없습니다." };
    }

    revalidatePath("/admin/recruitment");

    return { success: true, data: null };
  } catch {
    return { error: "대기자 삭제 중 오류가 발생했습니다." };
  }
}
