"use client";

import { ImagePlus, Upload } from "lucide-react";
import Image from "next/image";

type Props = {
  readonly imageUrl: string;
  readonly uploadLabel: string;
  readonly onImageChange: (file: File | null) => void;
};

export default function IdeathonTeamProfilePhotoField({ imageUrl, uploadLabel, onImageChange }: Props) {
  return (
    <div className="w-full max-w-[240px] md:max-w-none">
      <div className="aspect-[4/5] overflow-hidden rounded-lg border border-[#ddd9cc] bg-[#e8e6dc]">
        {imageUrl ? (
          <div className="relative h-full w-full">
            <Image src={imageUrl} alt="내 팀빌딩 보드 사진" fill sizes="(min-width: 768px) 180px, 240px" className="object-cover" />
          </div>
        ) : (
          <div className="grid h-full place-items-center">
            <ImagePlus className="h-8 w-8 text-[#6b6b5e]" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <label className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ddd9cc] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]">
        <Upload className="h-4 w-4" strokeWidth={2} />
        {uploadLabel}
        <input
          type="file"
          name="ideathon_profile_image"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(event) => {
            onImageChange(event.target.files?.[0] ?? null);
          }}
        />
      </label>
      <p className="mt-2 font-['Pretendard',sans-serif] text-xs leading-5 text-[#6b6b5e]">
        모바일 사진은 업로드 전에 자동으로 가볍게 줄입니다.
      </p>
    </div>
  );
}
