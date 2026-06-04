import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";

export type TeamProfileFormState = {
  readonly imageUrl: string;
  readonly department: string;
  readonly major: string;
  readonly age: string;
  readonly studentId: string;
  readonly grade: string;
  readonly abilityTags: string;
  readonly interestTags: string;
  readonly startupReason: string;
  readonly teamStyle: string;
  readonly decemberGoal: string;
  readonly lookingForTeammates: string;
  readonly freeAppeal: string;
  readonly portfolioUrl: string;
  readonly snsUrl: string;
};

export type UploadResult = {
  readonly success: boolean;
  readonly url?: string;
  readonly error?: string;
};

export type IdeathonPreparedImage = {
  readonly width: number;
  readonly height: number;
  readonly close: () => void;
  readonly toJpegBlob: (width: number, height: number, quality: number) => Promise<Blob | null>;
};

export type ImagePreparationRuntime = {
  readonly decode: (file: File) => Promise<IdeathonPreparedImage>;
};

const MAX_PROFILE_IMAGE_DIMENSION = 1280;
const PROFILE_IMAGE_QUALITY = 0.82;

function resizedDimension(width: number, height: number): { readonly width: number; readonly height: number } {
  const longestSide = Math.max(width, height);
  const scale = longestSide > MAX_PROFILE_IMAGE_DIMENSION ? MAX_PROFILE_IMAGE_DIMENSION / longestSide : 1;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function jpegFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim();
  return `${baseName || "profile"}.jpg`;
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

function createBrowserImagePreparationRuntime(): ImagePreparationRuntime | null {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return null;
  }

  return {
    decode: async (file) => {
      const bitmap = await createImageBitmap(file);

      return {
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
        toJpegBlob: async (width, height, quality) => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          if (!context) {
            return null;
          }

          context.drawImage(bitmap, 0, 0, width, height);
          return canvasToJpegBlob(canvas, quality);
        },
      };
    },
  };
}

export async function prepareIdeathonProfileImageForUpload(
  file: File,
  runtime: ImagePreparationRuntime | null = createBrowserImagePreparationRuntime(),
): Promise<File> {
  if (!runtime) {
    return file;
  }

  let preparedImage: IdeathonPreparedImage | null = null;

  try {
    preparedImage = await runtime.decode(file);
    const size = resizedDimension(preparedImage.width, preparedImage.height);
    const blob = await preparedImage.toJpegBlob(size.width, size.height, PROFILE_IMAGE_QUALITY);
    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], jpegFileName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    preparedImage?.close();
  }
}

export function buildInitialTeamProfileFormState(data: IdeathonBoardData): TeamProfileFormState {
  const profile = data.myProfile;
  return {
    imageUrl: profile?.photo_url ?? "",
    department: profile?.department ?? data.member?.department ?? "",
    major: profile?.major ?? data.member?.major ?? "",
    age: profile?.age ? String(profile.age) : "",
    studentId: profile?.student_id ?? data.member?.student_id ?? "",
    grade: profile?.grade ?? "",
    abilityTags: profile?.ability_tags.join(", ") ?? "",
    interestTags: profile?.interest_tags.join(", ") ?? "",
    startupReason: profile?.startup_reason ?? "",
    teamStyle: profile?.team_style ?? "",
    decemberGoal: profile?.december_goal ?? "",
    lookingForTeammates: profile?.looking_for_teammates ?? "",
    freeAppeal: profile?.appeal ?? "",
    portfolioUrl: profile?.portfolio_url ?? "",
    snsUrl: profile?.sns_url ?? "",
  };
}

export function splitTeamProfileTags(value: string): readonly string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function isUploadResult(value: unknown): value is UploadResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  return "success" in value;
}
