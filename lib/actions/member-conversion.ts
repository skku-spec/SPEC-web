"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { logAuditEvent } from "@/lib/helpers/audit-log";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = unknown> = {
  success?: boolean;
  error?: string;
  data?: T;
};

type ConversionStatus = {
  converted: boolean;
  memberId: string | null;
  memberName: string | null;
};

function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function convertApplicationToMember(applicationId: string): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("id, status, name, student_id, phone, email, major, batch, user_id")
    .eq("id", applicationId)
    .single();

  if (appError || !app) {
    return { error: "지원서를 찾을 수 없습니다." };
  }

  if (app.status !== "accepted") {
    return { error: "합격한 지원서만 멤버로 등록할 수 있습니다." };
  }

  if (!app.name?.trim()) {
    return { error: "지원서에 이름 정보가 없어 멤버 등록을 진행할 수 없습니다." };
  }

  if (app.student_id) {
    const { data: existingMember, error: existingMemberError } = await supabase
      .from("members")
      .select("id, name")
      .eq("student_id", app.student_id)
      .maybeSingle();

    if (existingMemberError) {
      return { error: "기존 멤버 정보를 확인하는 중 오류가 발생했습니다." };
    }

    if (existingMember) {
      return {
        error: `학번 ${app.student_id}의 멤버가 이미 존재합니다: ${existingMember.name}`,
      };
    }
  }

  const slug = generateSlugFromName(app.name);
  if (!slug) {
    return { error: "이름으로 슬러그를 생성할 수 없습니다." };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      name: app.name,
      slug,
      student_id: app.student_id || null,
      phone: app.phone || null,
      email: app.email || null,
      major: app.major || null,
      learner_batch: app.batch ? `${app.batch}기` : null,
      member_type: "러너",
      public_profile_id: app.user_id || null,
    })
    .select()
    .single();

  if (memberError) {
    return { error: `멤버 등록 실패: ${memberError.message}` };
  }

  await logAuditEvent({
    action: "convert",
    entityType: "application",
    entityId: applicationId,
    details: { memberId: member.id },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/applications");
  revalidatePath("/people");

  return { success: true, data: member };
}

export async function getConversionStatusBatch(
  applicationIds: string[],
): Promise<ActionResult<Record<string, ConversionStatus>>> {
  await requireAdmin();

  if (applicationIds.length === 0) {
    return { success: true, data: {} };
  }

  const supabase = await createClient();

  const { data: apps, error: appsError } = await supabase
    .from("applications")
    .select("id, student_id, user_id")
    .in("id", applicationIds);

  if (appsError || !apps) {
    return { error: "지원서 정보를 조회하는 중 오류가 발생했습니다." };
  }

  const studentIds = apps.map((a) => a.student_id).filter(Boolean) as string[];
  const userIds = apps.map((a) => a.user_id).filter((uid): uid is string => uid != null && !apps.some((a) => a.student_id && a.user_id === uid));

  const memberMap = new Map<string, { id: string; name: string }>();

  if (studentIds.length > 0) {
    const { data: byStudent } = await supabase
      .from("members")
      .select("id, name, student_id")
      .in("student_id", studentIds);
    byStudent?.forEach((m) => {
      if (m.student_id) memberMap.set(`sid:${m.student_id}`, { id: m.id, name: m.name });
    });
  }

  if (userIds.length > 0) {
    const { data: byUser } = await supabase
      .from("members")
      .select("id, name, public_profile_id")
      .in("public_profile_id", userIds);
    byUser?.forEach((m) => {
      if (m.public_profile_id) memberMap.set(`uid:${m.public_profile_id}`, { id: m.id, name: m.name });
    });
  }

  const result: Record<string, ConversionStatus> = {};
  for (const app of apps) {
    const key = app.student_id ? `sid:${app.student_id}` : app.user_id ? `uid:${app.user_id}` : null;
    const member = key ? memberMap.get(key) : undefined;
    result[app.id] = {
      converted: Boolean(member),
      memberId: member?.id ?? null,
      memberName: member?.name ?? null,
    };
  }

  return { success: true, data: result };
}

export async function getConversionStatus(applicationId: string): Promise<ActionResult<ConversionStatus>> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("student_id, user_id")
    .eq("id", applicationId)
    .single();

  if (appError || !app) {
    return {
      success: true,
      data: { converted: false, memberId: null, memberName: null },
    };
  }

  if (!app.student_id && !app.user_id) {
    return {
      success: true,
      data: { converted: false, memberId: null, memberName: null },
    };
  }

  let memberQuery = supabase.from("members").select("id, name").limit(1);

  if (app.student_id) {
    memberQuery = memberQuery.eq("student_id", app.student_id);
  } else {
    memberQuery = memberQuery.eq("public_profile_id", app.user_id!);
  }

  const { data: member, error: memberError } = await memberQuery.maybeSingle();

  if (memberError) {
    return { error: "전환 상태 확인 중 오류가 발생했습니다." };
  }

  return {
    success: true,
    data: {
      converted: Boolean(member),
      memberId: member?.id ?? null,
      memberName: member?.name ?? null,
    },
  };
}
