import Image from "next/image";

type AttendanceQrProps = {
  sessionId: string;
  code: string;
  checkInUrl: string;
  size?: "compact" | "large";
};

export function AttendanceQr({ sessionId, code, checkInUrl, size = "compact" }: AttendanceQrProps) {
  const imageSizeClass = size === "large" ? "h-64 w-64" : "h-28 w-28";
  const imageSize = size === "large" ? 256 : 112;
  const codeClass = size === "large" ? "text-6xl" : "text-2xl";
  const qrSrc = `/api/attendance/check-in-qr?session=${encodeURIComponent(sessionId)}&code=${encodeURIComponent(code)}`;

  return (
    <div data-testid="attendance-qr-card" className="flex min-w-0 max-w-full flex-col gap-3">
      <Image
        src={qrSrc}
        alt="출석 체크 QR"
        width={imageSize}
        height={imageSize}
        priority={size === "large" ? true : undefined}
        unoptimized
        className={`${imageSizeClass} max-w-full shrink-0 rounded-lg border border-[#ddd9cc] bg-white p-2`}
      />
      <div className="space-y-1">
        <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">출석 코드</p>
        <p className={`font-['Pretendard',sans-serif] ${codeClass} font-semibold leading-none text-[#16140f]`}>
          {code}
        </p>
      </div>
      <a
        href={checkInUrl}
        className="block max-w-full break-all font-['Pretendard',sans-serif] text-xs font-medium text-[#2563EB] hover:underline"
      >
        {checkInUrl}
      </a>
    </div>
  );
}
