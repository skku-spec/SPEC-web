import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SPEC_LOG_IMAGE_BUCKET = "spec-log-images";
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

function hasServiceRoleAccess() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function ensureSpecLogImageBucket() {
  if (!hasServiceRoleAccess()) return;

  const adminClient = createAdminClient();
  const { data: bucket, error: getBucketError } = await adminClient.storage.getBucket(SPEC_LOG_IMAGE_BUCKET);

  if (getBucketError && !getBucketError.message.toLowerCase().includes("not found")) {
    throw new Error(`Failed to load storage bucket: ${getBucketError.message}`);
  }

  if (!bucket) {
    const { error } = await adminClient.storage.createBucket(SPEC_LOG_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error(`Failed to create storage bucket: ${error.message}`);
    }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요해요." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const UPLOAD_ROLES = new Set(["learner", "preneur", "admin"]);
    if (!profile || !UPLOAD_ROLES.has(profile.role as string)) {
      return NextResponse.json({ success: false, error: "이미지 업로드 권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json() as { name?: string; type?: string; size?: number };
    const { name, type, size } = body;

    if (!name || !type || typeof size !== "number") {
      return NextResponse.json({ success: false, error: "파일 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(type)) {
      return NextResponse.json(
        { success: false, error: "JPG, PNG, WEBP, AVIF, GIF 파일만 업로드할 수 있어요." },
        { status: 400 },
      );
    }

    if (size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "이미지는 10MB 이하만 업로드할 수 있어요." },
        { status: 400 },
      );
    }

    await ensureSpecLogImageBucket();

    if (!hasServiceRoleAccess()) {
      return NextResponse.json(
        {
          success: false,
          error: "이미지 저장소 설정이 완료되지 않았어요. SUPABASE_SERVICE_ROLE_KEY를 환경 변수에 추가해 주세요.",
        },
        { status: 500 },
      );
    }

    const adminClient = createAdminClient();
    const nameParts = name.split(".");
    const ext = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : "jpg";
    const filePath = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext === "jpeg" ? "jpg" : ext}`;

    const { data, error: signError } = await adminClient.storage
      .from(SPEC_LOG_IMAGE_BUCKET)
      .createSignedUploadUrl(filePath);

    if (signError || !data) {
      return NextResponse.json(
        { success: false, error: `서명된 URL 생성에 실패했어요: ${signError?.message}` },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = adminClient.storage.from(SPEC_LOG_IMAGE_BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      token: data.token,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "오류가 발생했어요." },
      { status: 500 },
    );
  }
}
