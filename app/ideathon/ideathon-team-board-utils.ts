import { IDEATHON_BOARD_ROLES } from "@/lib/auth-shared";
import type { IdeathonBoardProfile } from "@/lib/actions/ideathon-profiles";
import type { UserRole } from "@/lib/auth-shared";

export type BoardView = "grid" | "table";
export type RoleFilter = "all" | UserRole;

export function canViewBoard(role: UserRole): boolean {
  return IDEATHON_BOARD_ROLES.some((allowedRole) => allowedRole === role);
}

export function roleLabel(role: UserRole): string {
  if (role === "preneur") return "프러너";
  if (role === "learner") return "러너";
  return "전체";
}

export function includesSearch(profile: IdeathonBoardProfile, query: string): boolean {
  const target = [
    profile.name,
    profile.department,
    profile.major ?? "",
    profile.grade,
    profile.student_id,
    profile.ability_tags.join(" "),
    profile.interest_tags.join(" "),
    profile.startup_reason,
    profile.team_style,
    profile.december_goal,
    profile.looking_for_teammates,
    profile.appeal ?? "",
  ].join(" ");
  return target.toLowerCase().includes(query.toLowerCase());
}
