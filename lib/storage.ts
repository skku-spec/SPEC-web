import { createClient } from "@/lib/supabase/client";

const BLOG_IMAGE_BUCKET = "blog-images";
const JOB_LOGOS_BUCKET = "job-logos";

export function getStorageUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  const supabase = createClient();
  const { data } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(normalizedPath);

  if (!data.publicUrl) {
    throw new Error(`Unable to construct public URL for storage path: ${path}`);
  }

  return data.publicUrl;
}

export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/upload/blog-image", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "이미지 업로드에 실패했습니다.");
  }

  return result.url;
}

export async function uploadSpecLogImage(file: File): Promise<string> {
  // Step 1: 서버에서 서명된 업로드 URL 발급 (파일 메타데이터만 전송)
  const presignRes = await fetch("/api/upload/spec-log-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
  });

  const presign = await presignRes.json();
  if (!presignRes.ok || !presign.success) {
    throw new Error(presign.error || "업로드 URL 발급에 실패했습니다.");
  }

  // Step 2: 브라우저에서 Supabase Storage로 직접 업로드 (Next.js 서버 거치지 않음)
  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from("spec-log-images")
    .uploadToSignedUrl(presign.path, presign.token, file, {
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`이미지 업로드에 실패했습니다: ${uploadError.message}`);
  }

  return presign.publicUrl;
}

export async function uploadJobLogo(file: File): Promise<string> {
  const supabase = createClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeExtension = extension ? extension.toLowerCase() : "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExtension}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(JOB_LOGOS_BUCKET).upload(filePath, file, {
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Failed to upload job logo: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(JOB_LOGOS_BUCKET).getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error("Logo uploaded successfully, but failed to generate public URL.");
  }

  return data.publicUrl;
}

export async function uploadHomeworkImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/upload/homework-image", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "이미지 업로드에 실패했습니다.");
  }

  return result.url;
}

export async function uploadHomeworkFile(file: File): Promise<{ name: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload/homework-file", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "파일 업로드에 실패했습니다.");
  }

  return {
    name: result.name,
    url: result.url,
  };
}

export async function uploadTeamBuildingImage(teamId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("team_id", teamId);
  formData.append("image", file);

  const response = await fetch("/api/upload/team-building-image", { method: "POST", body: formData });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "이미지 업로드에 실패했습니다.");
  }
  return result.url;
}

export async function uploadTeamBuildingFile(teamId: string, file: File): Promise<{ name: string; url: string }> {
  const formData = new FormData();
  formData.append("team_id", teamId);
  formData.append("file", file);

  const response = await fetch("/api/upload/team-building-file", { method: "POST", body: formData });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "파일 업로드에 실패했습니다.");
  }
  return { name: result.name, url: result.url };
}
