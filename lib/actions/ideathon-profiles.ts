"use server";

import { revalidatePath } from "next/cache";

import { normalizeRole } from "@/lib/auth";
import {
  IDEATHON_PROFILE_SELECT,
  isIdeathonBoardRole,
  MAX_ABILITY_TAGS,
  MAX_INTEREST_TAGS,
  isIdeathonProfileImageUrl,
  normalizeUrl,
  parseAge,
  readTags,
  readText,
} from "@/lib/ideathon-profile-utils";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { UserRole } from "@/lib/auth-shared";

type IdeathonProfileRow = Database["public"]["Tables"]["ideathon_participant_profiles"]["Row"];
type IdeathonProfileInsert = Database["public"]["Tables"]["ideathon_participant_profiles"]["Insert"];
type MemberRow = Pick<Database["public"]["Tables"]["members"]["Row"], "department" | "major" | "student_id">;
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "name" | "role" | "is_admin">;
type PublicProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "name" | "role">;

export type IdeathonBoardProfile = IdeathonProfileRow & { readonly name: string; readonly role: UserRole };

export type IdeathonBoardData = {
  readonly currentUser: {
    readonly id: string;
    readonly name: string;
    readonly role: UserRole;
  };
  readonly member: MemberRow | null;
  readonly myProfile: IdeathonProfileRow | null;
  readonly profiles: readonly IdeathonBoardProfile[];
};

export type IdeathonBoardResult =
  | { readonly success: true; readonly data: IdeathonBoardData }
  | { readonly success: false; readonly error: string };

type ActionResult = { readonly success: true } | { readonly success: false; readonly error: string };

async function getAuthorizedProfile(forbiddenError: string): Promise<
  | { readonly success: true; readonly userId: string; readonly profile: ProfileRow; readonly role: UserRole }
  | { readonly success: false; readonly error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { success: false, error: `인증에 실패했습니다: ${userError.message}` };
  }

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, role, is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !isIdeathonBoardRole(profile.role)) {
    return { success: false, error: forbiddenError };
  }

  return {
    success: true,
    userId: user.id,
    profile,
    role: normalizeRole(profile.role),
  };
}

export async function getIdeathonBoardData(): Promise<IdeathonBoardResult> {
  const auth = await getAuthorizedProfile("팀빌딩 보드는 러너와 프러너만 열람할 수 있습니다.");
  if (!auth.success) {
    return auth;
  }

  const supabase = await createClient();
  const { data: profileRows, error: profilesError } = await supabase
    .from("ideathon_participant_profiles")
    .select(IDEATHON_PROFILE_SELECT)
    .not("published_at", "is", null)
    .order("updated_at", { ascending: false });

  if (profilesError) {
    return { success: false, error: profilesError.message };
  }

  const { data: myProfile, error: myProfileError } = await supabase
    .from("ideathon_participant_profiles")
    .select(IDEATHON_PROFILE_SELECT)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (myProfileError) {
    return { success: false, error: myProfileError.message };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("department, major, student_id")
    .eq("public_profile_id", auth.userId)
    .maybeSingle();

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  const rows = profileRows ?? [];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  let publicProfiles: readonly PublicProfileRow[] = [];

  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role")
      .in("id", userIds);

    if (error) {
      return { success: false, error: error.message };
    }

    publicProfiles = data ?? [];
  }

  const publicProfileMap = new Map(publicProfiles.map((profile) => [profile.id, profile]));
  const boardProfiles = rows.flatMap((row): IdeathonBoardProfile[] => {
    const profile = publicProfileMap.get(row.user_id);
    if (!profile || !isIdeathonBoardRole(profile.role)) {
      return [];
    }

    return [
      {
        ...row,
        name: profile.name?.trim() || "이름 미입력",
        role: normalizeRole(profile.role),
      },
    ];
  });

  return {
    success: true,
    data: {
      currentUser: {
        id: auth.userId,
        name: auth.profile.name?.trim() || "이름 미입력",
        role: auth.role,
      },
      member: member ?? null,
      myProfile: myProfile ?? null,
      profiles: boardProfiles,
    },
  };
}

export async function upsertMyIdeathonProfile(formData: FormData): Promise<ActionResult> {
  const auth = await getAuthorizedProfile("팀빌딩 보드는 러너와 프러너만 작성할 수 있습니다.");
  if (!auth.success) {
    return auth;
  }

  const photoUrl = normalizeUrl(readText(formData, "photo_url"));
  const abilityTags = readTags(formData, "ability_tags", MAX_ABILITY_TAGS);

  if (!photoUrl || abilityTags.length === 0) {
    return { success: false, error: "사진과 본인을 나타내는 능력 태그는 필수입니다." };
  }

  if (!isIdeathonProfileImageUrl(photoUrl)) {
    return { success: false, error: "팀빌딩 보드 사진 업로드를 완료한 이미지 URL만 저장할 수 있습니다." };
  }

  const age = parseAge(readText(formData, "age"));
  if (!age) {
    return { success: false, error: "나이는 숫자로 입력해 주세요." };
  }

  const department = readText(formData, "department");
  const studentId = readText(formData, "student_id");
  const grade = readText(formData, "grade");
  const startupReason = readText(formData, "startup_reason");
  const teamStyle = readText(formData, "team_style");
  const decemberGoal = readText(formData, "december_goal");
  const lookingForTeammates = readText(formData, "looking_for_teammates");
  const appeal = readText(formData, "appeal");

  if (!department || !studentId || !grade || !startupReason || !teamStyle || !decemberGoal || !lookingForTeammates) {
    return { success: false, error: "이름을 제외한 기본 정보와 소개 문항을 모두 채워 주세요." };
  }

  const portfolioUrl = normalizeUrl(readText(formData, "portfolio_url"));
  const snsUrl = normalizeUrl(readText(formData, "sns_url"));
  const rawPortfolioUrl = readText(formData, "portfolio_url");
  const rawSnsUrl = readText(formData, "sns_url");

  if (rawPortfolioUrl && !portfolioUrl) {
    return { success: false, error: "포트폴리오 URL 형식이 올바르지 않습니다." };
  }

  if (rawSnsUrl && !snsUrl) {
    return { success: false, error: "SNS URL 형식이 올바르지 않습니다." };
  }

  const payload: IdeathonProfileInsert = {
    user_id: auth.userId,
    photo_url: photoUrl,
    department,
    major: readText(formData, "major") || null,
    age,
    student_id: studentId,
    grade,
    ability_tags: abilityTags,
    interest_tags: readTags(formData, "interest_tags", MAX_INTEREST_TAGS),
    startup_reason: startupReason,
    team_style: teamStyle,
    december_goal: decemberGoal,
    looking_for_teammates: lookingForTeammates,
    appeal: appeal || null,
    portfolio_url: portfolioUrl,
    sns_url: snsUrl,
    published_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ideathon_participant_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ideathon");
  return { success: true };
}
