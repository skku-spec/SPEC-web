const STATUS_LABELS: Record<string, string> = {
  pending: "접수완료",
  under_review: "심사중",
  accepted: "합격",
  rejected: "불합격",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-[#FFF0E5] text-[#FF6C0F]",
  under_review: "bg-[#E8F0FE] text-[#2563EB]",
  accepted: "bg-[#E6F9E6] text-[#2f9e44]",
  rejected: "bg-[#FEE2E2] text-[#b42318]",
};

const RESULT_ANNOUNCEMENT_DATE = "3월 23일 (월)";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

type ApplicationInfo = {
  status: string;
  name: string;
  batch: string;
  created_at: string;
};

export default function ApplicationStatusCard({
  application,
}: {
  application: ApplicationInfo;
}) {
  return (
    <div className="mt-6 rounded-lg border border-[#d9d9cc] bg-white p-8 md:p-10">
      <h2 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f]">
        지원 현황
      </h2>
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0efe6] pb-3">
          <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            지원자
          </span>
          <span className="font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f]">
            {application.name}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#f0efe6] pb-3">
          <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            지원 차수
          </span>
          <span className="font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f]">
            {application.batch}기
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#f0efe6] pb-3">
          <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            접수일
          </span>
          <span className="font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f]">
            {formatDate(application.created_at)}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#f0efe6] pb-3">
          <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            현재 상태
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[application.status] ?? "bg-[#f0efe6] text-[#6b6b5e]"}`}
          >
            {STATUS_LABELS[application.status] ?? application.status}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#f0efe6] pb-3">
          <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            결과 발표
          </span>
          <span className="font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f]">
            {RESULT_ANNOUNCEMENT_DATE}
          </span>
        </div>
      </div>

      {application.status === "accepted" ? (
        <div className="mt-6 rounded-lg bg-[#E6F9E6] px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#2f9e44]">
          축하합니다! 합격하셨습니다. 추후 안내 메일을 확인해주세요.
        </div>
      ) : null}

      {application.status === "rejected" ? (
        <div className="mt-6 rounded-lg bg-[#FEE2E2] px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#b42318]">
          아쉽게도 이번에는 함께하지 못하게 되었습니다. 다음 기회에 다시
          지원해주세요.
        </div>
      ) : null}
    </div>
  );
}
