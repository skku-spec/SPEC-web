import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateMagicBytes } from "@/lib/upload-validation";

const SPEC_LOG_IMAGE_BUCKET = "spec-log-images";
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function hasServiceRoleAccess() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function resolveFileExtension(file: File) {
  const fileNameParts = file.name.split(".");
  const fromName = fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";
  const normalizedFromName = fromName.trim().toLowerCase();

  if (normalizedFromName) {
    return normalizedFromName === "jpeg" ? "jpg" : normalizedFromName;
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  const fromMime = file.type.split("/")[1]?.trim().toLowerCase();
  return fromMime || "jpg";
}

async function ensureSpecLogImageBucket() {
  if (!hasServiceRoleAccess()) {
    return;
  }

  const adminClient = createAdminClient();
  const { data: bucket, error: getBucketError } = await adminClient.storage.getBucket(SPEC_LOG_IMAGE_BUCKET);

  if (getBucketError && !getBucketError.message.toLowerCase().includes("not found")) {
    throw new Error(`Failed to load storage bucket: ${getBucketError.message}`);
  }

  if (!bucket) {
    const { error: createBucketError } = await adminClient.storage.createBucket(SPEC_LOG_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    });

    if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
      throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
    }

    return;
  }

  if (!bucket.public) {
    const { error: updateBucketError } = await adminClient.storage.updateBucket(SPEC_LOG_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    });

    if (updateBucketError) {
      throw new Error(`Failed to update storage bucket: ${updateBucketError.message}`);
    }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: `Authentication failed: ${authError.message}`,
        },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "로그인이 필요해요.",
        },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const UPLOAD_ROLES = new Set(["learner", "preneur", "admin"]);
    if (!profile || !UPLOAD_ROLES.has(profile.role as string)) {
      return NextResponse.json(
        { success: false, error: "이미지 업로드 권한이 없습니다." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "업로드할 이미지 파일을 찾지 못했어요.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "JPG, PNG, WEBP, AVIF, GIF 파일만 업로드할 수 있어요.",
        },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "이미지는 10MB 이하만 업로드할 수 있어요.",
        },
        { status: 400 },
      );
    }

    const buffer = await image.arrayBuffer();
    if (!validateMagicBytes(buffer, image.type)) {
      return NextResponse.json(
        { success: false, error: "파일 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    await ensureSpecLogImageBucket();

    const canUseAdminClient = hasServiceRoleAccess();
    const storageClient = canUseAdminClient ? createAdminClient() : supabase;
    const extension = resolveFileExtension(image);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `images/${fileName}`;

    const { error: uploadError } = await storageClient.storage.from(SPEC_LOG_IMAGE_BUCKET).upload(filePath, image, {
      cacheControl: "3600",
      upsert: false,
      contentType: image.type,
    });

    if (uploadError) {
      const normalizedUploadError = uploadError.message.toLowerCase();
      if (!canUseAdminClient && normalizedUploadError.includes("bucket")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "이미지 저장소 설정이 완료되지 않았어요. Supabase에 spec-log-images 버킷을 생성하거나 SUPABASE_SERVICE_ROLE_KEY를 배포 환경에 추가해 주세요.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `이미지 업로드에 실패했어요: ${uploadError.message}`,
        },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = storageClient.storage.from(SPEC_LOG_IMAGE_BUCKET).getPublicUrl(filePath);
    if (!publicUrlData.publicUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "업로드 후 이미지 URL 생성에 실패했어요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했어요.",
      },
      { status: 500 },
    );
  }
}
