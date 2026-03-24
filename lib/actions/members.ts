"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type MemberType = Database["public"]["Tables"]["members"]["Row"]["member_type"];

export type MemberWithProfile = {
  id: string;
  name: string;
  slug: string;
  student_id: string | null;
  phone: string | null;
  email: string | null;
  major: string | null;
  runner_batch: string | null;
  preneur_batch: string | null;
  batch_tags: string[];
  member_type: MemberType;
  department: string | null;
  role: string | null;
  parts: string[];
  photo_url: string | null;
  linkedin_url: string | null;
  bio: string | null;
  notes: string | null;
  public_profile_id: string | null;
  created_at: string;
  updated_at: string;
  linked_profile?: {
    name: string;
    role: string;
    slug: string;
  } | null;
};

type MemberFilters = {
  batch?: string;
  member_type?: string;
  search?: string;
};

type MemberActionResult<T> = {
  success?: boolean;
  error?: string;
  data?: T;
  warning?: string;
};

type CreateMemberInput = {
  name: string;
  student_id?: string | null;
  phone?: string | null;
  email?: string | null;
  major?: string | null;
  runner_batch?: string | null;
  preneur_batch?: string | null;
  batch_tags?: string[];
  member_type?: MemberType;
  department?: string | null;
  role?: string | null;
  parts?: string[];
  photo_url?: string | null;
  linkedin_url?: string | null;
  bio?: string | null;
  notes?: string | null;
  public_profile_id?: string | null;
};

type UpdateMemberInput = Partial<Omit<CreateMemberInput, "name">> & {
  name?: string;
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");
}

const REVALIDATE_PATHS = ["/admin/members", "/people"] as const;

function revalidateAll(): void {
  for (const p of REVALIDATE_PATHS) {
    revalidatePath(p);
  }
}

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type LinkedProfile = { name: string; role: string; slug: string };

function toMemberWithProfile(
  row: Database["public"]["Tables"]["members"]["Row"] & { profiles: unknown },
): MemberWithProfile {
  const profile = row.profiles as LinkedProfile | null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    student_id: row.student_id,
    phone: row.phone,
    email: row.email,
    major: row.major,
    runner_batch: row.runner_batch,
    preneur_batch: row.preneur_batch,
    batch_tags: row.batch_tags,
    member_type: row.member_type,
    department: row.department,
    role: row.role,
    parts: row.parts,
    photo_url: row.photo_url,
    linkedin_url: row.linkedin_url,
    bio: row.bio,
    notes: row.notes,
    public_profile_id: row.public_profile_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    linked_profile: profile ?? null,
  };
}

const PROFILE_JOIN =
  "*, profiles!members_public_profile_id_fkey(name, role, slug)" as const;

export async function getAllMembers(
  filters?: MemberFilters,
): Promise<MemberActionResult<MemberWithProfile[]>> {
  try {
    await requireRole("preneur");
    const supabase = await createClient();

    let query = supabase
      .from("members")
      .select(PROFILE_JOIN)
      .order("created_at", { ascending: false });

    if (filters?.batch) {
      query = query.or(
        `runner_batch.eq.${filters.batch},preneur_batch.eq.${filters.batch}`,
      );
    }

    if (filters?.member_type) {
      query = query.eq(
        "member_type",
        filters.member_type as MemberType,
      );
    }

    if (filters?.search) {
      const term = `%${filters.search}%`;
      query = query.or(
        `name.ilike.${term},email.ilike.${term},student_id.ilike.${term}`,
      );
    }

    const { data, error } = await query;

    if (error) {
      return { error: "멤버 목록 조회 중 오류가 발생했습니다." };
    }

    const members = (data ?? []).map((row) =>
      toMemberWithProfile(row as unknown as Database["public"]["Tables"]["members"]["Row"] & { profiles: unknown }),
    );

    return { success: true, data: members };
  } catch {
    return { error: "멤버 목록 조회 중 오류가 발생했습니다." };
  }
}

export async function getMember(
  id: string,
): Promise<MemberActionResult<MemberWithProfile>> {
  try {
    await requireRole("preneur");

    if (!id) {
      return { error: "멤버 ID를 입력해주세요." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .select(PROFILE_JOIN)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { error: "멤버 조회 중 오류가 발생했습니다." };
    }

    if (!data) {
      return { error: "해당 멤버를 찾을 수 없습니다." };
    }

    return {
      success: true,
      data: toMemberWithProfile(data as unknown as Database["public"]["Tables"]["members"]["Row"] & { profiles: unknown }),
    };
  } catch {
    return { error: "멤버 조회 중 오류가 발생했습니다." };
  }
}

export async function createMember(
  input: CreateMemberInput,
): Promise<MemberActionResult<MemberWithProfile>> {
  try {
    await requireRole("preneur");

    const trimmedName = input.name?.trim();
    if (!trimmedName) {
      return { error: "이름을 입력해주세요." };
    }

    const slug = generateSlug(trimmedName);
    const supabase = await createClient();

    let warning: string | undefined;
    if (input.student_id) {
      const { data: existing } = await supabase
        .from("members")
        .select("id")
        .eq("student_id", input.student_id)
        .maybeSingle();

      if (existing) {
        warning = "동일한 학번의 멤버가 이미 존재합니다.";
      }
    }

    const insertPayload: Database["public"]["Tables"]["members"]["Insert"] = {
      name: trimmedName,
      slug,
      student_id: input.student_id ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      major: input.major ?? null,
      runner_batch: input.runner_batch ?? null,
      preneur_batch: input.preneur_batch ?? null,
      department: input.department ?? null,
      role: input.role ?? null,
      photo_url: input.photo_url ?? null,
      linkedin_url: input.linkedin_url ?? null,
      bio: input.bio ?? null,
      notes: input.notes ?? null,
      public_profile_id: input.public_profile_id ?? null,
    };

    if (input.batch_tags) insertPayload.batch_tags = input.batch_tags;
    if (input.member_type) insertPayload.member_type = input.member_type;
    if (input.parts) insertPayload.parts = input.parts;

    const { data, error } = await supabase
      .from("members")
      .insert(insertPayload)
      .select(PROFILE_JOIN)
      .single();

    if (error) {
      return { error: "멤버 생성 중 오류가 발생했습니다." };
    }

    const result: MemberActionResult<MemberWithProfile> = {
      success: true,
      data: toMemberWithProfile(data as unknown as Database["public"]["Tables"]["members"]["Row"] & { profiles: unknown }),
    };
    if (warning) {
      result.warning = warning;
    }
    return result;
  } catch {
    return { error: "멤버 생성 중 오류가 발생했습니다." };
  }
}

export async function updateMember(
  id: string,
  input: UpdateMemberInput,
): Promise<MemberActionResult<MemberWithProfile>> {
  try {
    await requireRole("preneur");

    if (!id) {
      return { error: "멤버 ID를 입력해주세요." };
    }

    const updatePayload: Database["public"]["Tables"]["members"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        return { error: "이름을 입력해주세요." };
      }
      updatePayload.name = trimmedName;
      updatePayload.slug = generateSlug(trimmedName);
    }

    if (input.student_id !== undefined) updatePayload.student_id = input.student_id ?? null;
    if (input.phone !== undefined) updatePayload.phone = input.phone ?? null;
    if (input.email !== undefined) updatePayload.email = input.email ?? null;
    if (input.major !== undefined) updatePayload.major = input.major ?? null;
    if (input.runner_batch !== undefined) updatePayload.runner_batch = input.runner_batch ?? null;
    if (input.preneur_batch !== undefined) updatePayload.preneur_batch = input.preneur_batch ?? null;
    if (input.batch_tags !== undefined) updatePayload.batch_tags = input.batch_tags;
    if (input.member_type !== undefined) updatePayload.member_type = input.member_type;
    if (input.department !== undefined) updatePayload.department = input.department ?? null;
    if (input.role !== undefined) updatePayload.role = input.role ?? null;
    if (input.parts !== undefined) updatePayload.parts = input.parts;
    if (input.photo_url !== undefined) updatePayload.photo_url = input.photo_url ?? null;
    if (input.linkedin_url !== undefined) updatePayload.linkedin_url = input.linkedin_url ?? null;
    if (input.bio !== undefined) updatePayload.bio = input.bio ?? null;
    if (input.notes !== undefined) updatePayload.notes = input.notes ?? null;
    if (input.public_profile_id !== undefined) updatePayload.public_profile_id = input.public_profile_id ?? null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .update(updatePayload)
      .eq("id", id)
      .select(PROFILE_JOIN)
      .maybeSingle();

    if (error) {
      return { error: "멤버 수정 중 오류가 발생했습니다." };
    }

    if (!data) {
      return { error: "해당 멤버를 찾을 수 없습니다." };
    }

    revalidateAll();

    return {
      success: true,
      data: toMemberWithProfile(data as unknown as Database["public"]["Tables"]["members"]["Row"] & { profiles: unknown }),
    };
  } catch {
    return { error: "멤버 수정 중 오류가 발생했습니다." };
  }
}

export async function deleteMember(
  id: string,
): Promise<MemberActionResult<null>> {
  try {
    await requireRole("preneur");

    if (!id) {
      return { error: "멤버 ID를 입력해주세요." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      return { error: "멤버 삭제 중 오류가 발생했습니다." };
    }

    if (!data || data.length === 0) {
      return { error: "삭제할 멤버를 찾을 수 없습니다." };
    }

    revalidateAll();

    return { success: true, data: null };
  } catch {
    return { error: "멤버 삭제 중 오류가 발생했습니다." };
  }
}

export async function linkMemberProfile(
  memberId: string,
  profileId: string,
): Promise<MemberActionResult<MemberWithProfile>> {
  try {
    await requireRole("preneur");

    if (!memberId || !profileId) {
      return { error: "멤버 ID와 프로필 ID를 모두 입력해주세요." };
    }

    const supabase = await createClient();

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profileData) {
      return { error: "연결할 프로필을 찾을 수 없습니다." };
    }

    const { data, error } = await supabase
      .from("members")
      .update({
        public_profile_id: profileId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId)
      .select(PROFILE_JOIN)
      .maybeSingle();

    if (error) {
      return { error: "프로필 연결 중 오류가 발생했습니다." };
    }

    if (!data) {
      return { error: "해당 멤버를 찾을 수 없습니다." };
    }

    revalidateAll();

    return {
      success: true,
      data: toMemberWithProfile(data as unknown as Database["public"]["Tables"]["members"]["Row"] & { profiles: unknown }),
    };
  } catch {
    return { error: "프로필 연결 중 오류가 발생했습니다." };
  }
}

export async function unlinkMemberProfile(
  memberId: string,
): Promise<MemberActionResult<MemberWithProfile>> {
  try {
    await requireRole("preneur");

    if (!memberId) {
      return { error: "멤버 ID를 입력해주세요." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .update({
        public_profile_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId)
      .select(PROFILE_JOIN)
      .maybeSingle();

    if (error) {
      return { error: "프로필 연결 해제 중 오류가 발생했습니다." };
    }

    if (!data) {
      return { error: "해당 멤버를 찾을 수 없습니다." };
    }

    revalidateAll();

    return {
      success: true,
      data: toMemberWithProfile(data as unknown as Database["public"]["Tables"]["members"]["Row"] & { profiles: unknown }),
    };
  } catch {
    return { error: "프로필 연결 해제 중 오류가 발생했습니다." };
  }
}

const CSV_HEADERS = [
  "id",
  "name",
  "slug",
  "student_id",
  "phone",
  "email",
  "major",
  "runner_batch",
  "preneur_batch",
  "batch_tags",
  "member_type",
  "department",
  "role",
  "parts",
  "photo_url",
  "linkedin_url",
  "bio",
  "notes",
  "public_profile_id",
  "created_at",
  "updated_at",
] as const;

export async function exportMembersCSV(
  filters?: MemberFilters,
): Promise<MemberActionResult<string>> {
  try {
    await requireRole("preneur");

    const result = await getAllMembers(filters);

    if (!result.success || !result.data) {
      return { error: result.error ?? "멤버 목록 조회 중 오류가 발생했습니다." };
    }

    const rows: string[] = [CSV_HEADERS.join(",")];

    for (const member of result.data) {
      const values = CSV_HEADERS.map((header) => {
        const value = member[header];
        if (value === null || value === undefined) return "";
        if (Array.isArray(value)) return escapeCSVField(value.join(";"));
        return escapeCSVField(String(value));
      });
      rows.push(values.join(","));
    }

    return { success: true, data: rows.join("\n") };
  } catch {
    return { error: "CSV 내보내기 중 오류가 발생했습니다." };
  }
}
