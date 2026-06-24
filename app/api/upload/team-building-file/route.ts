import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "team-building-files";
const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "zip", "txt", "csv", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp"];

function extension(fileName: string) {
  return fileName.split(".").pop()?.trim().toLowerCase() || "bin";
}

async function canAccessTeam(teamId: string, userId: string) {
  const supabase = createAdminClient();
  const [{ data: membership }, { data: leadTeam }, { data: profile }] = await Promise.all([
    supabase.from("startup_team_members").select("id").eq("team_id", teamId).eq("profile_id", userId).maybeSingle(),
    supabase.from("startup_teams").select("id").eq("id", teamId).eq("lead_preneur_id", userId).maybeSingle(),
    supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle(),
  ]);
  return Boolean(membership || leadTeam || profile?.is_admin);
}

async function ensureBucket() {
  const supabase = createAdminClient();
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_SIZE_BYTES });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "로그인이 필요해요." }, { status: 401 });

    const formData = await request.formData();
    const teamId = String(formData.get("team_id") ?? "");
    const file = formData.get("file");
    if (!teamId || !(await canAccessTeam(teamId, user.id))) {
      return NextResponse.json({ success: false, error: "이 팀에 파일을 업로드할 권한이 없습니다." }, { status: 403 });
    }
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: "파일을 찾지 못했어요." }, { status: 400 });
    const ext = extension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext) || file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "지원하지 않는 파일이거나 20MB를 초과했습니다." }, { status: 400 });
    }

    await ensureBucket();
    const admin = createAdminClient();
    const path = `${teamId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ success: true, name: file.name, url: data.publicUrl });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "업로드 중 오류가 발생했어요." }, { status: 500 });
  }
}
