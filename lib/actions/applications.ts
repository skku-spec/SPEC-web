"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getActiveRecruitment } from "@/lib/actions/recruitment";

export type ApplicationState = {
  success?: boolean;
  error?: string;
};


// ── Validation helpers ────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^01[016789]-?\d{3,4}-?\d{4}$/;
const STUDENT_ID_REGEX = /^\d{8,10}$/;

function validateLength(value: string, label: string, min: number, max: number): string | null {
  if (value.length < min) return `${label}은(는) 최소 ${min}자 이상이어야 합니다.`;
  if (value.length > max) return `${label}은(는) ${max}자를 초과할 수 없습니다.`;
  return null;
}

// ── Rate limit config ─────────────────────────────────────────────────

const RATE_LIMIT_CONFIG = {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
} as const;

// ── Submit Application ────────────────────────────────────────────────

export async function submitApplication(formData: FormData): Promise<ApplicationState> {
  // 1. Rate limit check
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitResult = rateLimit(`apply:${ip}`, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    const retryMinutes = Math.ceil(rateLimitResult.retryAfterMs / 60_000);
    return { error: `너무 많은 요청입니다. ${retryMinutes}분 후에 다시 시도해주세요.` };
  }

  // 1.5. Recruitment status check
  const recruitmentResult = await getActiveRecruitment();
  const recruitment = recruitmentResult?.data ?? null;
  if (!recruitment || recruitment.status !== "recruiting") {
    return { error: "현재 모집 기간이 아닙니다." };
  }

  // 2. Extract form data
  const name = (formData.get("name") as string)?.trim() ?? "";
  const student_id = (formData.get("student_id") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
  const phone = (formData.get("phone") as string)?.trim() ?? "";
  const major = (formData.get("major") as string)?.trim() ?? "";
  const batch = (formData.get("batch") as string)?.trim() ?? "";
  const introduction = (formData.get("introduction") as string)?.trim() ?? "";
  const vision = (formData.get("vision") as string)?.trim() ?? "";
  const startup_idea = (formData.get("startup_idea") as string)?.trim() ?? "";
  const portfolio_url = (formData.get("portfolio_url") as string)?.trim() ?? "";

  // New fields (4기)
  const grade = (formData.get("grade") as string)?.trim() ?? "";
  const enrollment_status = (formData.get("enrollment_status") as string)?.trim() ?? "";
  const experience_extra = (formData.get("experience_extra") as string)?.trim() ?? "";
  const additional_comments = (formData.get("additional_comments") as string)?.trim() ?? "";

  // 3. Required field validation
  if (!name || !email || !introduction || !student_id || !vision || !startup_idea || !batch || !grade || !enrollment_status || !portfolio_url || !experience_extra) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  // 4. Format validation
  if (!EMAIL_REGEX.test(email)) {
    return { error: "올바른 이메일 형식을 입력해주세요." };
  }

  if (!STUDENT_ID_REGEX.test(student_id)) {
    return { error: "학번은 8~10자리 숫자여야 합니다." };
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    return { error: "올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)" };
  }

  // 5. Length validation
  const lengthErrors = [
    validateLength(name, "이름", 2, 50),
    validateLength(introduction, "Q1 답변", 50, 5000),
    validateLength(vision, "Q2 답변", 50, 5000),
    validateLength(startup_idea, "Q3 답변", 50, 5000),
    validateLength(portfolio_url, "Q4 답변", 10, 5000),
    validateLength(experience_extra, "Q5 답변", 50, 5000),
    major ? validateLength(major, "전공", 1, 100) : null,
    additional_comments ? validateLength(additional_comments, "추가 코멘트", 1, 5000) : null,
  ].filter(Boolean);

  if (lengthErrors.length > 0) {
    return { error: lengthErrors[0]! };
  }

  // 6. Insert application
  // NOTE: Do NOT chain .select() here — the SELECT RLS policy is admin-only,
  // so non-admin users would get a 42501 error even though INSERT succeeded.
  // The INSERT policy is WITH CHECK (true), so silent failures cannot occur.
  const supabase = await createClient();

  // Attempt to get authenticated user — if logged in, link application to account
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("applications")
    .insert({
      name,
      student_id,
      email,
      phone: phone || null,
      major: major || null,
      batch,
      grade: grade || null,
      enrollment_status: enrollment_status || null,
      introduction,
      vision,
      startup_idea,
      portfolio_url: portfolio_url || null,
      experience_extra: experience_extra || null,
      additional_comments: additional_comments || null,
      user_id: user?.id ?? null,
    });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Application submission error:", error);
    }

    // Duplicate submission (unique constraint on student_id + batch)
    if (error.code === "23505") {
      return { error: "이미 해당 기수에 지원서를 제출하셨습니다." };
    }

    // RLS violation
    if (error.code === "42501") {
      return { error: "지원서 제출 권한이 없습니다. 관리자에게 문의해주세요." };
    }

    // Column missing
    if (error.message.includes("column") && error.message.includes("does not exist")) {
      return { error: "데이터베이스 설정 오류가 발생했습니다. 관리자에게 문의해주세요." };
    }

    return { error: "지원서 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  // 7. Success — INSERT policy is permissive (WITH CHECK true),
  // so if error is null the row was definitely saved.

  revalidatePath("/admin/applications");
  return { success: true };
}

// ── Delete Application (Admin Only) ───────────────────────────────────

export async function deleteApplication(id: string): Promise<ApplicationState> {
  const supabase = await createClient();

  // Verify admin permissions
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: "삭제 권한이 없습니다. 관리자만 삭제 가능합니다." };
  }

  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting application:", error);
    }
    return { error: "지원서 삭제 중 오류가 발생했습니다." };
  }

  if (!data || data.length === 0) {
    return { error: "삭제 권한이 없거나 해당 데이터를 찾을 수 없습니다." };
  }

  revalidatePath("/admin/applications");
  return { success: true };
}

// ── Application Status Types ──────────────────────────────────────────

export type ApplicationStatus = "pending" | "under_review" | "accepted" | "rejected";

const VALID_STATUSES: ApplicationStatus[] = ["pending", "under_review", "accepted", "rejected"];

function isValidStatus(value: string): value is ApplicationStatus {
  return VALID_STATUSES.includes(value as ApplicationStatus);
}

// ── Update Application Status (Admin Only) ────────────────────────────

export async function updateApplicationStatus(
  id: string,
  status: string,
): Promise<ApplicationState> {
  const supabase = await createClient();

  // Verify admin permissions
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: "상태 변경 권한이 없습니다. 관리자만 변경 가능합니다." };
  }

  // Validate status value
  if (!isValidStatus(status)) {
    return { error: `유효하지 않은 상태입니다: ${status}` };
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating application status:", error);
    }
    return { error: "상태 변경 중 오류가 발생했습니다." };
  }

  if (!data || data.length === 0) {
    return { error: "해당 지원서를 찾을 수 없습니다." };
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/applications");
  return { success: true };
}

// ── Get Application by Credentials (Public) ─────────────────────────

export type ApplicationStatusResult = {
  success?: boolean;
  error?: string;
  application?: {
    status: string;
    name: string;
    batch: string;
    created_at: string;
  };
};

export type MyApplicationDetailResult = {
  success?: boolean;
  error?: string;
  application?: {
    id: string;
    status: string;
    name: string;
    email: string;
    phone: string | null;
    student_id: string | null;
    major: string | null;
    grade: string | null;
    enrollment_status: string | null;
    batch: string;
    introduction: string;
    vision: string | null;
    startup_idea: string | null;
    portfolio_url: string | null;
    experience_extra: string | null;
    additional_comments: string | null;
    created_at: string;
  };
};

const MY_APPLICATION_DETAIL_SELECT =
  "id, user_id, status, name, email, phone, student_id, major, grade, enrollment_status, batch, introduction, vision, startup_idea, portfolio_url, experience_extra, additional_comments, created_at";

const MY_APPLICATION_SUMMARY_SELECT =
  "id, user_id, status, name, batch, created_at, email";

const STATUS_CHECK_RATE_LIMIT = {
  maxRequests: process.env.GITHUB_ACTIONS === "true" ? 100 : 10,
  windowMs: 10 * 60 * 1000, // 10 minutes
} as const;

export async function getApplicationByCredentials(
  email: string,
  studentId: string,
): Promise<ApplicationStatusResult> {
  // Rate limit check
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitResult = rateLimit(`status-check:${ip}`, STATUS_CHECK_RATE_LIMIT);

  if (!rateLimitResult.allowed) {
    const retryMinutes = Math.ceil(rateLimitResult.retryAfterMs / 60_000);
    return { error: `너무 많은 요청입니다. ${retryMinutes}분 후에 다시 시도해주세요.` };
  }

  // Validate inputs
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedStudentId = studentId.trim();

  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return { error: "올바른 이메일 형식을 입력해주세요." };
  }

  if (!trimmedStudentId || !STUDENT_ID_REGEX.test(trimmedStudentId)) {
    return { error: "학번은 8~10자리 숫자여야 합니다." };
  }

  let data: { status: string; name: string; batch: string; created_at: string } | null = null;
  let error: { code?: string; message: string } | null = null;

  try {
    // Use admin client to bypass RLS (SELECT is admin-only)
    const adminClient = createAdminClient();
    const result = await adminClient
      .from("applications")
      .select("status, name, batch, created_at")
      .eq("email", trimmedEmail)
      .eq("student_id", trimmedStudentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    data = result.data;
    error = result.error;
  } catch {
    return { error: "환경 변수 설정 오류가 발생했습니다. (Service Role Key 확인 필요)" };
  }

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching application status:", error);
    }
    return { error: "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  if (!data) {
    return { error: "해당 정보로 접수된 지원서를 찾을 수 없습니다." };
  }

  return {
    success: true,
    application: {
      status: data.status,
      name: data.name,
      batch: data.batch,
      created_at: data.created_at,
    },
  };
}

// ── Get My Application (Logged-in User) ──────────────────────────────

export async function getMyApplication(): Promise<ApplicationStatusResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "로그인이 필요합니다." };
    }

    let adminClient: ReturnType<typeof createAdminClient>;
    try {
      adminClient = createAdminClient();
    } catch {
      return { error: "환경 변수 설정 오류가 발생했습니다. (Service Role Key 확인 필요)" };
    }

    const { data, error } = await adminClient
      .from("applications")
      .select(MY_APPLICATION_SUMMARY_SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { error: "데이터베이스 조회 중 오류가 발생했습니다." };
    }

    if (data) {
      return {
        success: true,
        application: {
          status: data.status,
          name: data.name,
          batch: data.batch,
          created_at: data.created_at,
        },
      };
    }

    const userEmail = user.email?.trim().toLowerCase();
    if (!userEmail) {
      return { success: true };
    }

    const { data: emailMatched, error: emailMatchError } = await adminClient
      .from("applications")
      .select(MY_APPLICATION_SUMMARY_SELECT)
      .eq("email", userEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emailMatchError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching own application summary by email fallback:", emailMatchError);
      }
      return { success: true };
    }

    if (!emailMatched) {
      return { success: true };
    }

    if (!emailMatched.user_id) {
      await adminClient
        .from("applications")
        .update({ user_id: user.id })
        .eq("id", emailMatched.id);
    }

    return {
      success: true,
      application: {
        status: emailMatched.status,
        name: emailMatched.name,
        batch: emailMatched.batch,
        created_at: emailMatched.created_at,
      },
    };
  } catch (_unexpectedError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected error in getMyApplication:", _unexpectedError);
    }
    return { success: true };
  }
}

export async function getMyApplicationDetail(): Promise<MyApplicationDetailResult> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "로그인이 필요합니다." };
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("applications")
      .select(MY_APPLICATION_DETAIL_SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching own application:", error);
      }
      return { error: "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
    }

    if (data) {
      return {
        success: true,
        application: {
          id: data.id,
          status: data.status,
          name: data.name,
          email: data.email,
          phone: data.phone,
          student_id: data.student_id,
          major: data.major,
          grade: data.grade,
          enrollment_status: data.enrollment_status,
          batch: data.batch,
          introduction: data.introduction,
          vision: data.vision,
          startup_idea: data.startup_idea,
          portfolio_url: data.portfolio_url,
          experience_extra: data.experience_extra,
          additional_comments: data.additional_comments,
          created_at: data.created_at,
        },
      };
    }

    const userEmail = user.email?.trim().toLowerCase();
    if (!userEmail) {
      return { success: true };
    }

    const { data: emailMatched, error: emailMatchError } = await adminClient
      .from("applications")
      .select(MY_APPLICATION_DETAIL_SELECT)
      .eq("email", userEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emailMatchError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching own application by email fallback:", emailMatchError);
      }
      return { error: "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
    }

    if (!emailMatched) {
      return { success: true };
    }

    if (!emailMatched.user_id) {
      await adminClient
        .from("applications")
        .update({ user_id: user.id })
        .eq("id", emailMatched.id);
    }

    return {
      success: true,
      application: {
        id: emailMatched.id,
        status: emailMatched.status,
        name: emailMatched.name,
        email: emailMatched.email,
        phone: emailMatched.phone,
        student_id: emailMatched.student_id,
        major: emailMatched.major,
        grade: emailMatched.grade,
        enrollment_status: emailMatched.enrollment_status,
        batch: emailMatched.batch,
        introduction: emailMatched.introduction,
        vision: emailMatched.vision,
        startup_idea: emailMatched.startup_idea,
        portfolio_url: emailMatched.portfolio_url,
        experience_extra: emailMatched.experience_extra,
        additional_comments: emailMatched.additional_comments,
        created_at: emailMatched.created_at,
      },
    };
  } catch (unexpectedError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected error in getMyApplicationDetail:", unexpectedError);
    }
    return { error: "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// ── Update My Application ──────────────────────────────────────────────

export async function updateMyApplication(formData: FormData): Promise<ApplicationState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Recruitment status check
  const recruitmentResult = await getActiveRecruitment();
  const recruitment = recruitmentResult?.data ?? null;
  if (!recruitment || recruitment.status !== "recruiting") {
    return { error: "현재 모집 기간이 아닙니다." };
  }

  // Extract form data
  const name = (formData.get("name") as string)?.trim() ?? "";
  const student_id = (formData.get("student_id") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
  const phone = (formData.get("phone") as string)?.trim() ?? "";
  const major = (formData.get("major") as string)?.trim() ?? "";
  const batch = (formData.get("batch") as string)?.trim() ?? "";
  const introduction = (formData.get("introduction") as string)?.trim() ?? "";
  const vision = (formData.get("vision") as string)?.trim() ?? "";
  const startup_idea = (formData.get("startup_idea") as string)?.trim() ?? "";
  const portfolio_url = (formData.get("portfolio_url") as string)?.trim() ?? "";
  const grade = (formData.get("grade") as string)?.trim() ?? "";
  const enrollment_status = (formData.get("enrollment_status") as string)?.trim() ?? "";
  const experience_extra = (formData.get("experience_extra") as string)?.trim() ?? "";
  const additional_comments = (formData.get("additional_comments") as string)?.trim() ?? "";

  // Required field validation
  if (!name || !email || !introduction || !student_id || !vision || !startup_idea || !batch || !grade || !enrollment_status || !portfolio_url || !experience_extra) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "올바른 이메일 형식을 입력해주세요." };
  }

  if (!STUDENT_ID_REGEX.test(student_id)) {
    return { error: "학번은 8~10자리 숫자여야 합니다." };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("applications")
      .update({
        name,
        student_id,
        email,
        phone: phone || null,
        major: major || null,
        batch,
        grade: grade || null,
        enrollment_status: enrollment_status || null,
        introduction,
        vision,
        startup_idea,
        portfolio_url: portfolio_url || null,
        experience_extra: experience_extra || null,
        additional_comments: additional_comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Application update error:", error);
      }
      return { error: "지원서 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
    }
  } catch (unexpectedError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected error in updateMyApplication:", unexpectedError);
    }
    return { error: "지원서 수정 중 예기치 못한 오류가 발생했습니다." };
  }

  revalidatePath("/apply");
  revalidatePath("/apply/status");
  revalidatePath("/apply/submitted");
  return { success: true };
}
