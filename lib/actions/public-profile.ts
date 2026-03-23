"use server";

import { revalidatePath } from "next/cache";

import { canWrite, normalizeRole, requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database, ProfileVisibility } from "@/lib/supabase/types";

type ActionResult = {
  success: boolean;
  error?: string;
};

type ExperienceInput = {
  id?: string;
  organization: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
};

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseVisibility(value: string): ProfileVisibility {
  return value === "public" ? "public" : "private";
}

function validateOptionalUrl(value: string, fieldName: string): string {
  if (!value) {
    return "";
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} URL 형식이 올바르지 않아요.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${fieldName} URL은 http 또는 https만 사용할 수 있어요.`);
  }

  return parsed.toString();
}

function parseOptionalDate(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!DATE_PATTERN.test(trimmed)) {
    throw new Error(`${fieldName} 형식이 올바르지 않아요.`);
  }

  return trimmed;
}

function parseExperiences(rawValue: FormDataEntryValue | null): ExperienceInput[] {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("경력 정보 형식이 올바르지 않아요.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("경력 정보 형식이 올바르지 않아요.");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`경력 ${index + 1}번 정보 형식이 올바르지 않아요.`);
    }

    const candidate = item as Record<string, unknown>;
    const organization = typeof candidate.organization === "string" ? candidate.organization.trim() : "";
    const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
    const description = typeof candidate.description === "string" ? candidate.description.trim() : "";
    const isCurrent = candidate.isCurrent === true;
    const startDate = parseOptionalDate(candidate.startDate, `경력 ${index + 1} 시작일`);
    const endDate = parseOptionalDate(candidate.endDate, `경력 ${index + 1} 종료일`);

    if (!organization) {
      throw new Error(`경력 ${index + 1} 회사/조직명을 입력해 주세요.`);
    }

    if (!title) {
      throw new Error(`경력 ${index + 1} 역할명을 입력해 주세요.`);
    }

    if (organization.length > 80) {
      throw new Error(`경력 ${index + 1} 회사/조직명은 80자 이하여야 해요.`);
    }

    if (title.length > 80) {
      throw new Error(`경력 ${index + 1} 역할명은 80자 이하여야 해요.`);
    }

    if (description.length > 300) {
      throw new Error(`경력 ${index + 1} 설명은 300자 이하여야 해요.`);
    }

    if (isCurrent && endDate) {
      throw new Error(`경력 ${index + 1}은 현재 재직 중이면 종료일을 비워야 해요.`);
    }

    if (startDate && endDate && endDate < startDate) {
      throw new Error(`경력 ${index + 1}의 종료일은 시작일보다 빠를 수 없어요.`);
    }

    return {
      id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : undefined,
      organization,
      title,
      startDate,
      endDate,
      isCurrent,
      description,
    };
  });
}

function buildProfileUpdate(formData: FormData): ProfileUpdate {
  const name = parseStringField(formData, "name");
  const headline = parseStringField(formData, "headline");
  const currentRole = parseStringField(formData, "current_role");
  const company = parseStringField(formData, "company");
  const bio = parseStringField(formData, "bio");
  const linkedinUrl = validateOptionalUrl(parseStringField(formData, "linkedin_url"), "LinkedIn");
  const websiteUrl = validateOptionalUrl(parseStringField(formData, "website_url"), "Website");
  const brunchUrl = validateOptionalUrl(parseStringField(formData, "brunch_url"), "Brunch");
  const githubUrl = validateOptionalUrl(parseStringField(formData, "github_url"), "GitHub");
  const visibility = parseVisibility(parseStringField(formData, "profile_visibility"));

  if (!name) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (headline.length > 80) {
    throw new Error("한 줄 소개는 80자 이하여야 해요.");
  }

  if (currentRole.length > 50) {
    throw new Error("현재 역할은 50자 이하여야 해요.");
  }

  if (bio.length > 600) {
    throw new Error("자기소개는 600자 이하여야 해요.");
  }

  return {
    name,
    headline,
    current_role: currentRole,
    company,
    bio,
    linkedin_url: linkedinUrl,
    website_url: websiteUrl,
    brunch_url: brunchUrl,
    github_url: githubUrl,
    profile_visibility: visibility,
  };
}

function revalidatePublicProfilePaths(slug: string) {
  revalidatePath("/profile");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/people");
  revalidatePath("/people/[slug]", "page");
  revalidatePath("/u/[slug]", "page");
  revalidatePath(`/u/${slug}`);
}

export async function savePublicProfile(formData: FormData): Promise<ActionResult> {
  try {
    const { user, profile } = await requireAuth();
    const role = normalizeRole(profile?.role);

    if (!canWrite(role)) {
      throw new Error("부원 또는 관리자만 공개 프로필을 저장할 수 있어요.");
    }

    if (!profile?.slug) {
      throw new Error("공개 프로필 주소를 확인할 수 없어요.");
    }

    const updatePayload = buildProfileUpdate(formData);
    const experiences = parseExperiences(formData.get("experiences"));
    const supabase = await createClient();

    const serializedExperiences = experiences.map((experience, index) => ({
      id: experience.id ?? null,
      organization: experience.organization,
      title: experience.title,
      startDate: experience.startDate,
      endDate: experience.isCurrent ? null : experience.endDate,
      isCurrent: experience.isCurrent,
      description: experience.description,
      sortOrder: index,
    }));

    const { error: saveError } = await supabase.rpc("save_public_profile", {
      input_profile_id: user.id,
      input_name: updatePayload.name ?? "",
      input_headline: updatePayload.headline ?? "",
      input_current_role: updatePayload.current_role ?? "",
      input_company: updatePayload.company ?? "",
      input_bio: updatePayload.bio ?? "",
      input_linkedin_url: updatePayload.linkedin_url ?? "",
      input_website_url: updatePayload.website_url ?? "",
      input_brunch_url: updatePayload.brunch_url ?? "",
      input_github_url: updatePayload.github_url ?? "",
      input_profile_visibility: updatePayload.profile_visibility ?? "private",
      input_experiences: serializedExperiences,
    });

    if (saveError) {
      throw new Error(`공개 프로필을 저장하지 못했어요: ${saveError.message}`);
    }

    revalidatePublicProfilePaths(profile.slug);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "공개 프로필 저장에 실패했어요.",
    };
  }
}
