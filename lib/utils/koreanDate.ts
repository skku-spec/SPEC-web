export const KOREA_TIME_ZONE = "Asia/Seoul";

type KoreanDateFormatOptions = Omit<Intl.DateTimeFormatOptions, "timeZone">;

export function formatKoreanDate(value: string | number | Date, options: KoreanDateFormatOptions): string {
  return new Intl.DateTimeFormat("ko-KR", {
    ...options,
    timeZone: KOREA_TIME_ZONE,
  }).format(new Date(value));
}
