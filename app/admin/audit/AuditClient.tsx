"use client";

export type AuditLogItem = {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

type AuditClientProps = {
  initialLogs: AuditLogItem[];
};

const ACTION_LABELS: Record<string, string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
  status_change: "상태 변경",
  role_change: "권한 변경",
  convert: "전환",
  export: "내보내기",
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function stringifyDetails(details: Record<string, unknown> | null): string {
  if (!details) return "-";

  const pairs = Object.entries(details);
  if (pairs.length === 0) return "-";

  return pairs
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }
      if (value && typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${String(value)}`;
    })
    .join(" / ");
}

export default function AuditClient({ initialLogs }: AuditClientProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
      <table className="min-w-full border-collapse">
        <thead className="bg-[#f0efe6] text-left">
          <tr>
            <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">일시</th>
            <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">관리자</th>
            <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">작업</th>
            <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">대상</th>
            <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">상세</th>
          </tr>
        </thead>
        <tbody>
          {initialLogs.map((log) => (
            <tr key={log.id} className="border-t border-[#ece8db] align-top">
              <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                {formatDateTime(log.createdAt)}
              </td>
              <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                {log.actorName ?? "시스템"}
              </td>
              <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                {ACTION_LABELS[log.action] ?? log.action}
              </td>
              <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                {log.entityType}
                {log.entityId ? ` (${log.entityId})` : ""}
              </td>
              <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                {stringifyDetails(log.details)}
              </td>
            </tr>
          ))}
          {initialLogs.length === 0 && (
            <tr className="border-t border-[#ece8db]">
              <td
                colSpan={5}
                className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]"
              >
                감사 로그가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
