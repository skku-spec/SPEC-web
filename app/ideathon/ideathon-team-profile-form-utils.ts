import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";

export type TeamProfileFormState = {
  readonly imageUrl: string;
  readonly department: string;
  readonly major: string;
  readonly age: string;
  readonly studentId: string;
  readonly grade: string;
  readonly abilityTags: string;
  readonly interestTags: string;
  readonly startupReason: string;
  readonly teamStyle: string;
  readonly decemberGoal: string;
  readonly lookingForTeammates: string;
  readonly freeAppeal: string;
  readonly portfolioUrl: string;
  readonly snsUrl: string;
};

export type UploadResult = {
  readonly success: boolean;
  readonly url?: string;
  readonly error?: string;
};

export function buildInitialTeamProfileFormState(data: IdeathonBoardData): TeamProfileFormState {
  const profile = data.myProfile;
  return {
    imageUrl: profile?.photo_url ?? "",
    department: profile?.department ?? data.member?.department ?? "",
    major: profile?.major ?? data.member?.major ?? "",
    age: profile?.age ? String(profile.age) : "",
    studentId: profile?.student_id ?? data.member?.student_id ?? "",
    grade: profile?.grade ?? "",
    abilityTags: profile?.ability_tags.join(", ") ?? "",
    interestTags: profile?.interest_tags.join(", ") ?? "",
    startupReason: profile?.startup_reason ?? "",
    teamStyle: profile?.team_style ?? "",
    decemberGoal: profile?.december_goal ?? "",
    lookingForTeammates: profile?.looking_for_teammates ?? "",
    freeAppeal: profile?.appeal ?? "",
    portfolioUrl: profile?.portfolio_url ?? "",
    snsUrl: profile?.sns_url ?? "",
  };
}

export function splitTeamProfileTags(value: string): readonly string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function isUploadResult(value: unknown): value is UploadResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  return "success" in value;
}
