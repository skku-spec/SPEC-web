import { NextResponse } from "next/server";

import { IDEATHON_BOARD_ROLES, normalizeRole } from "@/lib/auth-shared";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateMagicBytes } from "@/lib/upload-validation";

const IDEATHON_PROFILE_IMAGE_BUCKET = "ideathon-profile-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function hasServiceRoleAccess(): boolean {
  return hasSupabaseAdminEnv();
}

function isBoardRole(role: string | null | undefined): boolean {
  const normalizedRole = normalizeRole(role);
  return IDEATHON_BOARD_ROLES.some((allowedRole) => allowedRole === normalizedRole);
}

function resolveFileExtension(file: File): string {
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

async function ensureIdeathonProfileImageBucket(): Promise<void> {
  if (!hasServiceRoleAccess()) {
    return;
  }

  const adminClient = createAdminClient();
  const { data: bucket, error: getBucketError } = await adminClient.storage.getBucket(IDEATHON_PROFILE_IMAGE_BUCKET);

  if (getBucketError && !getBucketError.message.toLowerCase().includes("not found")) {
    throw new Error(`Failed to load storage bucket: ${getBucketError.message}`);
  }

  if (!bucket) {
    const { error: createBucketError } = await adminClient.storage.createBucket(IDEATHON_PROFILE_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    });

    if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
      throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
    }

    return;
  }

  const bucketMimeTypes = bucket.allowed_mime_types ?? [];
  const mimesSynced =
    bucketMimeTypes.length === ALLOWED_IMAGE_MIME_TYPES.length &&
    ALLOWED_IMAGE_MIME_TYPES.every((mimeType) => bucketMimeTypes.includes(mimeType));

  if (!bucket.public || !mimesSynced) {
    const { error: updateBucketError } = await adminClient.storage.updateBucket(IDEATHON_PROFILE_IMAGE_BUCKET, {
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

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !isBoardRole(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "팀빌딩 보드 사진은 러너와 프러너만 업로드할 수 있습니다.",
        },
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
          error: "JPG, PNG, WEBP, AVIF 파일만 업로드할 수 있어요.",
        },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "사진은 5MB 이하만 업로드할 수 있어요.",
        },
        { status: 400 },
      );
    }

    const buffer = await image.arrayBuffer();
    if (!validateMagicBytes(buffer, image.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `파일의 실제 내용이 ${image.type} 형식과 일치하지 않아요. 파일이 손상되었거나, 확장자만 변경된 파일일 수 있어요.`,
        },
        { status: 400 },
      );
    }

    await ensureIdeathonProfileImageBucket();

    const canUseAdminClient = hasServiceRoleAccess();
    const storageClient = canUseAdminClient ? createAdminClient() : supabase;
    const extension = resolveFileExtension(image);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `profiles/${user.id}/${fileName}`;

    const { error: uploadError } = await storageClient.storage.from(IDEATHON_PROFILE_IMAGE_BUCKET).upload(filePath, image, {
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
              "팀빌딩 보드 사진 저장소 설정이 완료되지 않았어요. Supabase에 ideathon-profile-images 버킷을 생성하거나 SUPABASE_SECRET_KEY를 배포 환경에 추가해 주세요.",
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

    const { data: publicUrlData } = storageClient.storage.from(IDEATHON_PROFILE_IMAGE_BUCKET).getPublicUrl(filePath);
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
