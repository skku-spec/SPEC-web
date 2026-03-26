/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

type ProfileAvatarEditorProps = {
  name: string;
  photoUrl: string;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type DragState = {
  startX: number;
  startY: number;
  initialPanX: number;
  initialPanY: number;
};

const PREVIEW_SIZE = 280;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.12;
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read selected file."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Failed to read selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImageFromSource(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load selected image."));
    image.src = source;
  });
}

function createBlobFromCanvas(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate cropped avatar."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export default function ProfileAvatarEditor({ name, photoUrl }: ProfileAvatarEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [isSaving, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(photoUrl);
  const [cropSource, setCropSource] = useState("");
  const [cropDimensions, setCropDimensions] = useState<ImageDimensions | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isCropOpen = cropSource.length > 0 && cropDimensions !== null;

  const renderedImage = useMemo(() => {
    if (!cropDimensions) {
      return null;
    }

    const baseScale = Math.max(PREVIEW_SIZE / cropDimensions.width, PREVIEW_SIZE / cropDimensions.height);
    const scale = baseScale * zoom;
    const width = cropDimensions.width * scale;
    const height = cropDimensions.height * scale;
    const maxPanX = Math.max(0, (width - PREVIEW_SIZE) / 2);
    const maxPanY = Math.max(0, (height - PREVIEW_SIZE) / 2);

    return {
      width,
      height,
      maxPanX,
      maxPanY,
      left: (PREVIEW_SIZE - width) / 2 + panX,
      top: (PREVIEW_SIZE - height) / 2 + panY,
    };
  }, [cropDimensions, panX, panY, zoom]);

  useEffect(() => {
    if (!renderedImage) {
      return;
    }

    setPanX((prev) => clamp(prev, -renderedImage.maxPanX, renderedImage.maxPanX));
    setPanY((prev) => clamp(prev, -renderedImage.maxPanY, renderedImage.maxPanY));
  }, [renderedImage]);

  useEffect(() => {
    if (!isCropOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCropOpen]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const resetCropState = () => {
    setCropSource("");
    setCropDimensions(null);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const adjustZoom = (delta: number) => {
    setZoom((previousZoom) => clamp(Number((previousZoom + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  };

  const handleCropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!renderedImage) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialPanX: panX,
      initialPanY: panY,
    };

    setIsDragging(true);
  };

  const handleCropPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!renderedImage || !dragStateRef.current) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    setPanX(clamp(dragStateRef.current.initialPanX + deltaX, -renderedImage.maxPanX, renderedImage.maxPanX));
    setPanY(clamp(dragStateRef.current.initialPanY + deltaY, -renderedImage.maxPanY, renderedImage.maxPanY));
  };

  const handleCropPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleCropWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    adjustZoom(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setErrorMessage("프로필 사진은 5MB 이하만 업로드할 수 있어요.");
      return;
    }

    try {
      const source = await readFileAsDataUrl(file);
      const image = await loadImageFromSource(source);
      setCropSource(source);
      setCropDimensions({ width: image.naturalWidth, height: image.naturalHeight });
      setZoom(1);
      setPanX(0);
      setPanY(0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "이미지를 불러오지 못했어요.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveCroppedAvatar = () => {
    if (!isCropOpen || !renderedImage) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          setErrorMessage("");
          setSuccessMessage("");

          const sourceImage = await loadImageFromSource(cropSource);
          const canvas = document.createElement("canvas");
          canvas.width = OUTPUT_SIZE;
          canvas.height = OUTPUT_SIZE;

          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("크롭 이미지를 생성하지 못했어요.");
          }

          const ratio = OUTPUT_SIZE / PREVIEW_SIZE;
          context.drawImage(
            sourceImage,
            renderedImage.left * ratio,
            renderedImage.top * ratio,
            renderedImage.width * ratio,
            renderedImage.height * ratio,
          );

          const blob = await createBlobFromCanvas(canvas);
          const croppedFile = new File([blob], `avatar-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          const formData = new FormData();
          formData.set("avatar", croppedFile);

          const response = await fetch("/api/profile/avatar", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json()) as {
            success?: boolean;
            error?: string;
            photoUrl?: string;
          };

          if (!response.ok || !payload.success || !payload.photoUrl) {
            throw new Error(payload.error ?? "프로필 사진을 저장하지 못했어요.");
          }

          setCurrentPhotoUrl(payload.photoUrl);
          setSuccessMessage("프로필 사진이 업데이트되었어요.");
          resetCropState();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "프로필 사진 저장에 실패했어요.");
        }
      })();
    });
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-3">
      {currentPhotoUrl ? (
        <img
          src={currentPhotoUrl}
          alt={`${name} 아바타`}
          className="h-16 w-16 rounded-full border border-[#16140f]/10 object-cover md:h-20 md:w-20"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6C0F] text-[26px] font-bold text-white md:h-20 md:w-20 md:text-[32px]">
          {getInitial(name)}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={openFilePicker}
        className="rounded-md border border-[#16140f]/15 bg-white px-3 py-1.5 font-['Pretendard',sans-serif] text-[12px] font-semibold text-[#16140f] transition-colors hover:bg-[#f5f5ee]"
      >
        사진 변경
      </button>

      {errorMessage ? (
        <p className="max-w-[180px] text-center font-['Pretendard',sans-serif] text-[12px] text-[#b42318]">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="max-w-[180px] text-center font-['Pretendard',sans-serif] text-[12px] text-[#18794e]">{successMessage}</p>
      ) : null}

      {isCropOpen && renderedImage ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-[560px] rounded-2xl border border-[#ddd9cc] bg-[#fcfcf7] p-5 shadow-[0_20px_50px_rgba(22,20,15,0.25)] md:p-6">
            <h3 className="font-['Pretendard',sans-serif] text-[20px] font-bold text-[#16140f]">프로필 사진 크롭</h3>
            <p className="mt-1 font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/65">
              정사각형으로 크롭된 이미지가 프로필에 저장돼요.
            </p>

            <div className="mt-4 flex justify-center">
              <div
                className="relative overflow-hidden rounded-full border border-[#16140f]/10 bg-[#f2f2ea]"
                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, touchAction: "none" }}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerEnd}
                onPointerCancel={handleCropPointerEnd}
                onWheel={handleCropWheel}
              >
                <img
                  src={cropSource}
                  alt="아바타 크롭 미리보기"
                  draggable={false}
                  className={`absolute select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                  style={{
                    left: renderedImage.left,
                    top: renderedImage.top,
                    width: renderedImage.width,
                    height: renderedImage.height,
                    maxWidth: "none",
                    touchAction: "none",
                  }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-center font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/70">
                이미지를 직접 드래그해서 위치를 조절하세요.
              </p>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustZoom(-ZOOM_STEP)}
                  disabled={isSaving || zoom <= MIN_ZOOM}
                  className="h-8 w-8 rounded-md border border-[#16140f]/20 bg-white text-[16px] font-semibold leading-none text-[#16140f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  -
                </button>
                <span className="min-w-[72px] text-center font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f]">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => adjustZoom(ZOOM_STEP)}
                  disabled={isSaving || zoom >= MAX_ZOOM}
                  className="h-8 w-8 rounded-md border border-[#16140f]/20 bg-white text-[16px] font-semibold leading-none text-[#16140f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetCropState}
                disabled={isSaving}
                className="rounded-md border border-[#16140f]/20 bg-white px-4 py-2 font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveCroppedAvatar}
                disabled={isSaving}
                className="rounded-md bg-[#FF6C0F] px-4 py-2 font-['Pretendard',sans-serif] text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
