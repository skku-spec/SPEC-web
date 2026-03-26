import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyApplicationDetail } from "@/lib/actions/applications";

export const metadata: Metadata = {
  title: "지원 완료 | SPEC",
};

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

function formatLongDate(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(dateString));
}

export default async function SubmittedApplicationPage() {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const result = await getMyApplicationDetail();

  if (result.error) {
    return (
      <div className="min-h-screen bg-[#f5f5ee]">
        <section className="mx-auto max-w-[900px] px-6 pt-20 pb-16 md:pt-32 md:pb-24">
          <h1
            className="text-[clamp(2rem,5vw,3rem)] font-black leading-[1.08] tracking-tight text-[#16140f]"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            제출한 지원서
          </h1>
          <div className="mt-8 rounded-lg border border-[#f5c2c2] bg-[#FEE2E2] px-5 py-4">
            <p className="font-['Pretendard',sans-serif] text-sm text-[#b42318]">
              지원서 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/apply/status"
              className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] underline underline-offset-2 hover:text-[#16140f]"
            >
              ← 지원 현황 확인으로 돌아가기
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!result.application) {
    return (
      <div className="min-h-screen bg-[#f5f5ee]">
        <section className="mx-auto max-w-[900px] px-6 pt-20 pb-16 md:pt-32 md:pb-24">
          <h1
            className="text-[clamp(2rem,5vw,3rem)] font-black leading-[1.08] tracking-tight text-[#16140f]"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            제출한 지원서
          </h1>
          <div className="mt-8 rounded-lg border border-[#d9d9cc] bg-[#FFF0E5] px-5 py-4">
            <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              현재 로그인한 계정으로 제출된 지원서가 없습니다.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/apply"
              className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] underline underline-offset-2 hover:text-[#16140f]"
            >
              ← 지원 페이지로 돌아가기
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const app = result.application;

  return (
    <div className="min-h-screen bg-[#f5f5ee]">
      <section className="mx-auto max-w-[900px] px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/apply/status"
            className="inline-flex items-center gap-2 text-sm text-[#6b6b5e] hover:text-[#16140f]"
          >
            <span>←</span>
            <span>지원 현황으로</span>
          </Link>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[app.status] ?? "bg-[#f0efe6] text-[#6b6b5e]"}`}
          >
            {STATUS_LABELS[app.status] ?? app.status}
          </span>
        </div>

        <header className="mb-8 rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:mb-10 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6">
            <div>
              <h1 className="text-2xl font-bold text-[#16140f] sm:text-4xl [font-family:system-ui,-apple-system,sans-serif] break-words [overflow-wrap:anywhere]">
                {app.name}
              </h1>
              <p className="mt-1.5 text-base text-[#4a4a40] sm:mt-2 sm:text-lg break-words [overflow-wrap:anywhere]">{app.major || "-"}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm text-[#6b6b5e] md:text-right">
              <div>
                <p className="text-xs font-semibold text-[#16140f] sm:text-sm">학번</p>
                <p className="text-xs sm:text-sm break-all">{app.student_id || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#16140f] sm:text-sm">이메일</p>
                <p className="text-xs sm:text-sm break-all">{app.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#16140f] sm:text-sm">접수일</p>
                <p className="text-xs sm:text-sm">{formatLongDate(app.created_at)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 sm:space-y-10">
          <section className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8">
            <h2 className="mb-4 border-b border-[#f0efe6] pb-3 text-lg font-bold text-[#16140f] sm:mb-6 sm:text-xl [font-family:system-ui,-apple-system,sans-serif]">
              자기소개
            </h2>
            <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-[#16140f] font-['Pretendard',sans-serif] sm:text-base">
              {app.introduction}
            </div>
          </section>

          <section className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8">
            <h2 className="mb-4 border-b border-[#f0efe6] pb-3 text-lg font-bold text-[#16140f] sm:mb-6 sm:text-xl [font-family:system-ui,-apple-system,sans-serif]">
              창업에 대한 비전 및 목표
            </h2>
            <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-[#16140f] font-['Pretendard',sans-serif] sm:text-base">
              {app.vision || "작성된 내용이 없습니다."}
            </div>
          </section>

          <section className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8">
            <h2 className="mb-4 border-b border-[#f0efe6] pb-3 text-lg font-bold text-[#16140f] sm:mb-6 sm:text-xl [font-family:system-ui,-apple-system,sans-serif]">
              함께 도전해보고 싶은 창업 아이템
            </h2>
            <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-[#16140f] font-['Pretendard',sans-serif] sm:text-base">
              {app.startup_idea || "작성된 내용이 없습니다."}
            </div>
          </section>

          <section className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8">
            <h2 className="mb-4 border-b border-[#f0efe6] pb-3 text-lg font-bold text-[#16140f] sm:mb-6 sm:text-xl [font-family:system-ui,-apple-system,sans-serif]">
              활동 참여 및 팀 역할
            </h2>
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#16140f]">
                  Q4. 금요일 정기 활동 참여 가능 여부와 각오
                </p>
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-[#4a4a40] sm:text-base">
                  {app.portfolio_url || "작성된 내용이 없습니다."}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-[#16140f]">
                  Q5. 팀에서의 역할과 협업 스타일
                </p>
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-[#4a4a40] sm:text-base">
                  {app.experience_extra || "작성된 내용이 없습니다."}
                </p>
              </div>
              {app.additional_comments && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#16140f]">
                    Q6. 추가 코멘트
                  </p>
                  <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-[#4a4a40] sm:text-base">
                    {app.additional_comments}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
