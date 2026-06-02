"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BLOG_WRITER_ROLES, normalizeRole } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

type ActionResult = {
  error?: string;
  success?: boolean;
};

type Idea = Database["public"]["Tables"]["ideathon_ideas"]["Row"];

function isAllowedIdeaWriterRole(role: string | null | undefined): boolean {
  return BLOG_WRITER_ROLES.includes(normalizeRole(role));
}

export async function submitIdea(formData: FormData): Promise<ActionResult> {
  const titleInput = formData.get("title") as string | null;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const targetCustomer = formData.get("target_customer") as string | null;
  const competitors = formData.get("competitors") as string | null;
  const marketSize = formData.get("market_size") as string | null;
  const teamMembers = formData.get("team_members") as string | null;
  const pdfUrl = formData.get("pdf_url") as string | null;

  if (!description?.trim()) {
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

  const fullIdea = description.trim();
  let title = titleInput?.trim() ?? "";

  if (!title) {
    const lines = fullIdea.split("\n");
    title = lines[0].trim();
    if (title.length > 50) {
      title = `${title.substring(0, 50)}...`;
    } else if (lines.length > 1) {
      title = `${title}...`;
    }
  }

  const { error } = await supabase.from("ideathon_ideas").insert({
    user_id: user.id,
    title,
    description: fullIdea,
    target_customer: targetCustomer?.trim() || null,
    competitors: competitors?.trim() || null,
    market_size: marketSize?.trim() || null,
    team_members: teamMembers?.trim() || null,
    pdf_url: pdfUrl?.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/ideathon");
  revalidatePath("/dashboard/ideas");
  return { success: true };
}

export async function getMyIdeas(): Promise<{ success: boolean; error?: string; data?: Idea[] }> {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isAllowedIdeaWriterRole(profile?.role)) {
    return { success: false, error: "아이디어 접근 권한이 없습니다. SPEC 멤버 계정으로 로그인해주세요." };
  }

  const { data, error } = await supabase
    .from("ideathon_ideas")
    .select("id, user_id, title, description, target_customer, competitors, market_size, team_members, pdf_url, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function updateIdea(ideaId: string, formData: FormData): Promise<ActionResult> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const targetCustomer = formData.get("target_customer") as string;
  const competitors = formData.get("competitors") as string;
  const marketSize = formData.get("market_size") as string;
  const teamMembers = formData.get("team_members") as string;
  const pdfUrl = formData.get("pdf_url");

  const titleTrimmed = title?.trim() ?? "";
  const descriptionTrimmed = description?.trim() ?? "";

  if (!titleTrimmed || !descriptionTrimmed) {
    return { error: "아이디어명과 해결안 설명은 필수 입력 항목입니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: `인증에 실패했습니다: ${userError.message}` };
  }

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isAllowedIdeaWriterRole(profile?.role)) {
    return { error: "아이디어 수정 권한이 없습니다. SPEC 멤버 계정으로 로그인해주세요." };
  }

  const payload: Database["public"]["Tables"]["ideathon_ideas"]["Update"] = {
    title: titleTrimmed,
    description: descriptionTrimmed,
    target_customer: targetCustomer?.trim() || null,
    competitors: competitors?.trim() || null,
    market_size: marketSize?.trim() || null,
    team_members: teamMembers?.trim() || null,
  };

  if (typeof pdfUrl === "string") {
    payload.pdf_url = pdfUrl.trim() || null;
  }

  const { data, error } = await supabase
    .from("ideathon_ideas")
    .update(payload)
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .select();

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: "권한이 없거나 해당 아이디어를 찾을 수 없습니다." };
  }

  revalidatePath("/ideathon");
  revalidatePath("/dashboard/ideas");
  revalidatePath("/admin/ideas");

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
