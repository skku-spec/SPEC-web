"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function submitIdea(formData: FormData): Promise<ActionResult> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const targetCustomer = formData.get("target_customer") as string;
  const competitors = formData.get("competitors") as string;
  const marketSize = formData.get("market_size") as string;
  const teamMembers = formData.get("team_members") as string;

  if (!title?.trim() || !description?.trim()) {
    return { error: "아이디어명과 해결안 설명은 필수 입력 항목입니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["learner", "alumni", "preneur"].includes(profile.role || "")) {
    return { error: "아이디어 제출 권한이 없습니다. SPEC 멤버 계정으로 로그인해주세요." };
  }

  const { error } = await supabase.from("ideathon_ideas").insert({
    user_id: user.id,
    title: title.trim(),
    description: description.trim(),
    target_customer: targetCustomer?.trim() || null,
    competitors: competitors?.trim() || null,
    market_size: marketSize?.trim() || null,
    team_members: teamMembers?.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/ideathon");
  revalidatePath("/dashboard/ideas");
  return { success: true };
}

export async function getIdeas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideathon_ideas")
    .select(`
      *,
      profiles:user_id (
        name,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function deleteIdea(ideaId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Check if admin or owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin || false;

  const query = supabase.from("ideathon_ideas").delete().eq("id", ideaId);
  if (!isAdmin) {
    query.eq("user_id", user.id);
  }

  const { error } = await query;

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/ideas");
  return { success: true };
}
