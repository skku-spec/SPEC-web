import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type UserRole = "outsider" | "runner" | "preneur" | "admin";

/** DB role 값을 UserRole로 변환. 알 수 없는 값은 outsider로 처리. */
export function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "admin") return "admin";
  if (role === "preneur") return "preneur";
  if (role === "runner") return "runner";
  return "outsider";
}

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AuthResult = {
  user: User;
  profile: Profile | null;
};

const ROLE_LEVEL: Record<UserRole, number> = {
  outsider: 0,
  runner: 1,
  preneur: 2,
  admin: 3,
};

export async function getCurrentUser(): Promise<AuthResult | { user: null; profile: null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile ?? null,
  };
}

export async function requireAuth(): Promise<AuthResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    redirect("/login");
  }

  return currentUser;
}

export async function requireRole(minRole: UserRole): Promise<AuthResult> {
  const currentUser = await requireAuth();
  const currentRole = normalizeRole(currentUser.profile?.role);

  if (ROLE_LEVEL[currentRole] < ROLE_LEVEL[minRole]) {
    redirect("/");
  }

  return currentUser;
}

export function isAdmin(role: string | null): boolean {
  return role === "admin";
}

export function canWrite(role: string | null): boolean {
  return role === "runner" || role === "preneur" || role === "admin";
}
