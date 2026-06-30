import { NextResponse } from "next/server";

import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const HOMEWORK_FILE_BUCKET = "homework-files";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "zip",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "hwp",
];
const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/x-hwp",
  "application/haansofthwp",
  "application/octet-stream",
];

function hasServiceRoleAccess() {
  return hasSupabaseAdminEnv();
}

function getFileExtension(fileName: string) {
  const fileNameParts = fileName.split(".");
  const fromName = fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";
  return fromName.trim().toLowerCase();
}

function isSupportedHomeworkFile(file: File) {
  const extension = getFileExtension(file.name);
  const hasValidExtension = ALLOWED_FILE_EXTENSIONS.includes(extension);
  if (!hasValidExtension) {
    return false;
  }

  if (!file.type) {
    return true;
  }

  return ALLOWED_FILE_MIME_TYPES.includes(file.type.toLowerCase());
}

async function ensureHomeworkFileBucket() {
  if (!hasServiceRoleAccess()) {
    return;
  }

  const adminClient = createAdminClient();
  const { data: bucket, error: getBucketError } = await adminClient.storage.getBucket(HOMEWORK_FILE_BUCKET);

  if (getBucketError && !getBucketError.message.toLowerCase().includes("not found")) {
    throw new Error(`Failed to load storage bucket: ${getBucketError.message}`);
  }

  if (!bucket) {
    const { error: createBucketError } = await adminClient.storage.createBucket(HOMEWORK_FILE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_FILE_MIME_TYPES,
    });

    if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
      throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
    }

    return;
  }

  if (!bucket.public) {
    const { error: updateBucketError } = await adminClient.storage.updateBucket(HOMEWORK_FILE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_FILE_MIME_TYPES,
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

    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single();
    if (!profile || (profile.role !== "preneur" && !profile.is_admin)) {
      return NextResponse.json(
        { success: false, error: "과제 파일을 업로드할 권한이 없습니다." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "업로드할 파일을 찾지 못했어요.",
        },
        { status: 400 },
      );
    }

    if (!isSupportedHomeworkFile(file)) {
      return NextResponse.json(
        {
          success: false,
          error: "지원하지 않는 파일 형식입니다. PDF, ZIP, TXT, CSV, DOC, DOCX, XLS, XLSX, PPT, PPTX, HWP 파일만 업로드할 수 있어요.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "파일은 20MB 이하만 업로드할 수 있어요.",
        },
        { status: 400 },
      );
    }

    await ensureHomeworkFileBucket();

    const canUseAdminClient = hasServiceRoleAccess();
    const storageClient = canUseAdminClient ? createAdminClient() : supabase;
    const extension = getFileExtension(file.name) || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `attachments/${fileName}`;

    const { error: uploadError } = await storageClient.storage.from(HOMEWORK_FILE_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

    if (uploadError) {
      const normalizedUploadError = uploadError.message.toLowerCase();
      if (!canUseAdminClient && normalizedUploadError.includes("bucket")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "첨부파일 저장소 설정이 완료되지 않았어요. Supabase에 homework-files 버킷을 생성하거나 SUPABASE_SECRET_KEY를 배포 환경에 추가해 주세요.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `파일 업로드에 실패했어요: ${uploadError.message}`,
        },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = storageClient.storage.from(HOMEWORK_FILE_BUCKET).getPublicUrl(filePath);
    if (!publicUrlData.publicUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "업로드 후 파일 URL 생성에 실패했어요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      name: file.name,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했어요.",
      },
      { status: 500 },
    );
  }
}
