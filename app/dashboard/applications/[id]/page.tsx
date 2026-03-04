import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import DeleteApplicationButton from "@/components/dashboard/DeleteApplicationButton";


type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { profile } = await getCurrentUser();
  const isAdmin = profile?.role === "admin";

  const { data: app, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !app) {
    notFound();
  }

  return (
    <article className="max-w-[900px]">
      {/* Back + actions */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center gap-2 text-sm text-[#6b6b5e] hover:text-[#16140f]"
          >
            <span>←</span>
            <span>목록으로</span>
          </Link>
          {isAdmin && (
            <>
              <div className="h-4 w-[1px] bg-[#ddd9cc]" />
              <DeleteApplicationButton id={app.id} applicantName={app.name} />
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-[#FFF0E5] px-3 py-1 text-xs font-medium text-[#FF6C0F] sm:text-sm">
            {app.batch}기 지원서
          </span>
          <span className="inline-flex rounded-full bg-[#f0efe6] px-3 py-1 text-xs font-medium text-[#6b6b5e] sm:text-sm">
            접수일: {new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(app.created_at))}
          </span>
        </div>
      </div>

      {/* Header card */}
      <header className="mb-8 rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:mb-10 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#16140f] sm:text-4xl [font-family:system-ui,-apple-system,sans-serif] break-words [overflow-wrap:anywhere]">
              {app.name}
            </h1>
            <p className="mt-1.5 text-base text-[#4a4a40] sm:mt-2 sm:text-lg break-words [overflow-wrap:anywhere]">
              {app.major}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-[#6b6b5e] md:text-right">
            <div>
              <p className="text-xs font-semibold text-[#16140f] sm:text-sm">학번</p>
              <p className="text-xs sm:text-sm break-all">{app.student_id || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#16140f] sm:text-sm">이메일</p>
              <p className="text-xs sm:text-sm break-all">{app.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#16140f] sm:text-sm">연락처</p>
              <p className="text-xs sm:text-sm break-all">{app.phone || "-"}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content sections */}
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
    </article>
  );
}
