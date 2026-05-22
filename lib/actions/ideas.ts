"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function submitIdea(formData: FormData): Promise<ActionResult> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const pdfUrl = formData.get("pdf_url") as string | null;

  if (!description?.trim()) {
    return { error: "아이디어를 입력해주세요." };
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
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || !["learner", "alumni", "preneur"].includes(profile.role || "")) {
    return { error: "아이디어 제출 권한이 없습니다. SPEC 멤버 계정으로 로그인해주세요." };
  }

  if (name?.trim() && name.trim() !== profile.name) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", user.id);

    if (profileError) {
      return { error: `이름 업데이트 실패: ${profileError.message}` };
    }
  }

  // Derive title from description: first line, max 50 chars, add ... if truncated or multi-line
  const fullIdea = description.trim();
  const lines = fullIdea.split("\n");
  let title = lines[0].trim();
  if (title.length > 50) {
    title = title.substring(0, 50) + "...";
  } else if (lines.length > 1) {
    title = title + "...";
  }

  const { error } = await supabase.from("ideathon_ideas").insert({
    user_id: user.id,
    title,
    description: fullIdea,
    pdf_url: pdfUrl || null,
    target_customer: null,
    competitors: null,
    market_size: null,
    team_members: null,
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
