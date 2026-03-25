const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 0) return "방금 전";
  if (diffSeconds < MINUTE) return "방금 전";
  if (diffSeconds < HOUR) return `${Math.floor(diffSeconds / MINUTE)}분 전`;
  if (diffSeconds < DAY) return `약 ${Math.floor(diffSeconds / HOUR)}시간 전`;
  if (diffSeconds < WEEK) return `${Math.floor(diffSeconds / DAY)}일 전`;
  if (diffSeconds < 4 * WEEK) return `${Math.floor(diffSeconds / WEEK)}주 전`;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}
