import type { ProfileRole } from "@/lib/supabase/types";

export type UserRole = ProfileRole;

export const BLOG_WRITER_ROLES: readonly UserRole[] = ["learner", "alumni", "preneur"] as const;
export const SPEC_LOG_WRITER_ROLES: readonly UserRole[] = ["learner", "preneur"] as const;
export const SPEC_LOG_ENGAGE_ROLES: readonly UserRole[] = ["learner", "alumni", "preneur"] as const;
export const ADMIN_PAGE_ROLES: readonly UserRole[] = ["preneur"] as const;
export const DASHBOARD_ROLES: readonly UserRole[] = ["learner", "preneur"] as const;
export const IDEATHON_BOARD_ROLES: readonly UserRole[] = ["learner", "preneur"] as const;

export function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "preneur") return "preneur";
  if (role === "alumni") return "alumni";
  if (role === "learner") return "learner";
  if (role === "admin") return "preneur";
  if (role === "member") return "outsider";
  return "outsider";
}

export function isAdmin(profile: { is_admin?: boolean } | null | undefined): boolean {
  return profile?.is_admin === true;
}

export function canWrite(role: string | null): boolean {
  const normalized = normalizeRole(role);
  return (BLOG_WRITER_ROLES as readonly string[]).includes(normalized);
}
