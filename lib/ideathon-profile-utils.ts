import { IDEATHON_BOARD_ROLES, normalizeRole } from "@/lib/auth-shared";

export const MAX_ABILITY_TAGS = 6;
export const MAX_INTEREST_TAGS = 5;
export const IDEATHON_PROFILE_SELECT =
  "id, user_id, photo_url, department, major, age, student_id, grade, ability_tags, interest_tags, startup_reason, team_style, december_goal, looking_for_teammates, appeal, portfolio_url, sns_url, published_at, created_at, updated_at";

const MIN_AGE = 15;
const MAX_AGE = 80;

export function isIdeathonBoardRole(role: string | null | undefined): boolean {
  const normalizedRole = normalizeRole(role);
  return IDEATHON_BOARD_ROLES.some((allowedRole) => allowedRole === normalizedRole);
}

export function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function readTags(formData: FormData, key: string, maxCount: number): string[] {
  const uniqueTags = new Set<string>();

  formData.getAll(key).forEach((entry) => {
    if (typeof entry !== "string") {
      return;
    }

    entry
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .forEach((tag) => {
        if (uniqueTags.size < maxCount) {
          uniqueTags.add(tag);
        }
      });
  });

  return Array.from(uniqueTags);
}

export function parseAge(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  if (parsed < MIN_AGE || parsed > MAX_AGE) {
    return null;
  }
  return parsed;
}

export function normalizeUrl(value: string): string | null {
  if (!value) {
    return null;
  }

  const candidate = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isIdeathonProfileImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.pathname.includes("/storage/v1/object/public/ideathon-profile-images/");
  } catch {
    return false;
  }
}
