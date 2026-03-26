import UsersClient from "@/app/admin/users/UsersClient";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentProfile } = user
    ? await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load profiles:", error.message);
  }

  const profiles: Profile[] = data ?? [];

  return <UsersClient initialProfiles={profiles} currentUserIsAdmin={isAdmin(currentProfile)} />;
}
