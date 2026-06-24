import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "team-building-images";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function extension(file: File) {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase();
  if (fromName) return fromName === "jpeg" ? "jpg" : fromName;
  return file.type.split("/")[1] || "jpg";
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
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_SIZE_BYTES, allowedMimeTypes: ALLOWED_TYPES });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "로그인이 필요해요." }, { status: 401 });

    const formData = await request.formData();
    const teamId = String(formData.get("team_id") ?? "");
    const image = formData.get("image");
    if (!teamId || !(await canAccessTeam(teamId, user.id))) {
      return NextResponse.json({ success: false, error: "이 팀에 이미지를 업로드할 권한이 없습니다." }, { status: 403 });
    }
    if (!(image instanceof File)) return NextResponse.json({ success: false, error: "이미지 파일을 찾지 못했어요." }, { status: 400 });
    if (!ALLOWED_TYPES.includes(image.type) || image.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "이미지는 JPG, PNG, WEBP, AVIF, GIF 형식의 10MB 이하 파일만 가능합니다." }, { status: 400 });
    }

    await ensureBucket();
    const admin = createAdminClient();
    const path = `${teamId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension(image)}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, image, { contentType: image.type, upsert: false });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "업로드 중 오류가 발생했어요." }, { status: 500 });
  }
}
