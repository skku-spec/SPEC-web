import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type { UserRole } from "@/lib/auth-shared";
export {
  BLOG_WRITER_ROLES,
  SPEC_LOG_WRITER_ROLES,
  SPEC_LOG_ENGAGE_ROLES,
  ADMIN_PAGE_ROLES,
  DASHBOARD_ROLES,
  normalizeRole,
  isAdmin,
  canWrite,
} from "@/lib/auth-shared";

import { normalizeRole } from "@/lib/auth-shared";
import type { UserRole } from "@/lib/auth-shared";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AuthResult = {
  user: User;
  profile: Profile | null;
};

const ROLE_LEVEL: Record<UserRole, number> = {
  outsider: 0,
  learner: 1,
  alumni: 2,
  preneur: 3,
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
