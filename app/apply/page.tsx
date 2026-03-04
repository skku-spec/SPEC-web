import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ApplyButton from "@/components/ui/ApplyButton";
import { getCurrentUser } from "@/lib/auth";
import { getMyApplication } from "@/lib/actions/applications";
import ApplicationStatusCard from "./status/ApplicationStatusCard";

export const metadata: Metadata = {
  title: "지원하기 | SPEC — 성균관대 창업학회",
  description:
    "SPEC 4기 러너를 모집합니다. 30주 동안 팀을 만들고, 프로덕트를 런칭하고, 실제 매출을 만드는 실전 창업 트랙.",
};

export default async function ApplyPage() {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/apply");
  }

  // Check if logged-in user already has a linked application
  let hasApplication = false;
  let applicationData: { status: string; name: string; batch: string; created_at: string } | undefined;
  if (user) {
    const result = await getMyApplication();
    if (result.success && result.application) {
      hasApplication = true;
      applicationData = result.application;
    }
  }
  return (
    <div className="min-h-screen bg-[#f5f5ee]">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="mx-auto max-w-[760px] px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <h1
          className="text-[clamp(2.75rem,6vw,4.25rem)] font-black leading-[1.08] tracking-tight text-[#16140f]"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Apply to SPEC
        </h1>

        <div className="mt-8 space-y-5 font-['Pretendard',sans-serif] text-[17px] leading-[1.75] text-[#4a4a40]">
          <p>
            왜 창업인가. 이 질문을 한 번이라도 진지하게 던져본 사람이라면, 이미
            자격이 있습니다.
          </p>
          <p>
            남이 설계한 길 위에서 남이 정한 속도로 걸어가는 삶에 의문을 가진 적이
            있다면. 내 손으로 무언가를 만들어서 세상에 내놓고 싶다는 충동을 느낀
            적이 있다면. 그 감각이 출발점입니다. 경험이나 스킬은 그다음입니다.
          </p>
          <p>
            SPEC은 성균관대학교 창업 학회입니다. 그런데 우리가 하려는 것은 단순한
            동아리 운영이 아닙니다. 성대에서 창업을 꿈꾸는 사람들이 처음 발을
            딛는 곳. 혼자서는 시작하기 어려웠던 것을 함께 시작할 수 있는 곳.
            창업가로서의 첫 번째 인프라 — 우리는 그 boilerplate가 되려고 합니다.
          </p>
          <p>
            현재{" "}
            <strong className="font-semibold text-[#16140f]">
              SPEC 4기 러너(Learner)
            </strong>
            를 모집하고 있습니다. 러너 트랙은 30주 동안 팀을 만들고, 프로덕트를
            런칭하고, 실제 매출을 만드는 실전 창업 트랙입니다. 완성된 아이디어는
            필요 없습니다. 사업 경험도 필요 없습니다. 필요한 건 하나 —{" "}
            <strong className="font-semibold text-[#16140f]">
              &ldquo;직접 해보겠다&rdquo;는 마음.
            </strong>
          </p>
        </div>

        {hasApplication && applicationData ? (
          /* User already applied — show their status */
          <div className="mt-10">
            <ApplicationStatusCard application={applicationData} />
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/apply/status"
                className="inline-flex h-[44px] items-center rounded-full border border-[#d9d9cc] px-6 font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#4a4a40] transition-colors hover:bg-white hover:text-[#16140f]"
              >
                지원 현황 상세
              </Link>
              <Link
                href="/apply/submitted"
                className="inline-flex h-[44px] items-center rounded-full border border-[#d9d9cc] px-6 font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#4a4a40] transition-colors hover:bg-white hover:text-[#16140f]"
              >
                제출한 지원서 다시 보기
              </Link>
            </div>
          </div>
        ) : (
          /* No application yet — show apply + status check buttons */
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <ApplyButton href="/apply/form" size="xl">
              Apply
            </ApplyButton>
            <a
              href="/apply/status"
              className="inline-flex items-center rounded-full border border-[#d9d9cc] px-14 py-5 font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#4a4a40] transition-colors hover:bg-white hover:text-[#16140f]"
            >
              지원 현황 확인
            </a>
          </div>
        )}
      </section>

      {/* ── 지원 안내 ─────────────────────────────── */}
      <section className="mx-auto max-w-[760px] px-6 py-16 md:py-24">
        <h2
          className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.15] tracking-tight text-[#16140f]"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          지원 안내
        </h2>

        <div className="mt-8 space-y-5 font-['Pretendard',sans-serif] text-[17px] leading-[1.75] text-[#4a4a40]">
          <p>
            지원서는 온라인으로 제출하며, 제출 후 수정은 불가합니다. 오래 고민하지
            마세요. 완벽한 지원서보다 솔직한 지원서가 낫습니다. 우리가 보는 건
            화려한 이력이 아닙니다. 왜 창업에 끌리는지, 왜 지금 시작하고 싶은지 —
            그 이유가 본인의 언어로 써 있으면 충분합니다.
          </p>
          <p>
            서류 심사 후 합격자에 한해 온라인 면접(10~15분)이 진행됩니다. 면접에서
            거창한 사업 계획을 묻지 않습니다. 당신이 어떤 사람인지, 왜 직접 해보고
            싶은지를 이야기합니다.
          </p>
          <p>
            최종 합격 발표 후 OT에 반드시 참석해야 합니다. OT에서 활동 안내와 첫
            팀 배정이 이루어집니다. 여기서부터 30주가 시작됩니다.
          </p>
        </div>

        {/* ── 모집 일정 ── */}
        <div className="mt-12 rounded-lg border border-[#d9d9cc] bg-white p-8 md:p-10">
          <h3 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f]">
            모집 일정
          </h3>

          <div className="mt-6 font-['Pretendard',sans-serif] text-[16px]">
            {(
              [
                { title: "1차 서류 접수", date: "3/1(일) ~ 3/12(목)", status: "completed", highlight: false },
                { title: "서류 심사", date: "3/13(금) ~ 3/14(토)", status: "completed", highlight: false },
                { title: "1차 결과 발표", date: "3/15(일)", status: "completed", highlight: false },
                { title: "2차 온라인 면접", date: "3/16(월) ~ 3/22(일)", status: "completed", highlight: false },
                { title: "최종 결과 발표", date: "3/23(월)", status: "completed", highlight: false },
                { title: "OT 사전 안내", date: "3/24(화) ~ 3/26(목)", status: "completed", highlight: false },
                { title: "OT (필참)", date: "3/27(금)", status: "completed", highlight: true },
              ] as {
                title: string;
                date: string;
                status: "completed" | "active" | "upcoming";
                highlight: boolean;
              }[]
            ).map((step, i, arr) => (
              <div key={step.title} className="relative flex gap-4">
                {/* Spine: dot + connector */}
                <div className="flex flex-col items-center">
                  {step.status === "active" ? (
                    <div className="mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 border-[#FF6C0F] bg-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF6C0F]" />
                    </div>
                  ) : (
                    <div
                      className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                        step.highlight
                          ? "bg-[#FF6C0F]"
                          : step.status === "completed"
                            ? "bg-[#16140f]"
                            : "border-2 border-[#ddd9cc] bg-white"
                      }`}
                    />
                  )}
                  {i < arr.length - 1 && (
                    <div
                      className={`w-px flex-1 ${
                        step.status === "completed"
                          ? "bg-[#16140f]"
                          : "bg-[#ddd9cc]"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={i < arr.length - 1 ? "pb-6" : ""}>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        step.highlight
                          ? "font-semibold text-[#FF6C0F]"
                          : "font-medium text-[#16140f]"
                      }
                    >
                      {step.title}
                    </span>
                    {step.status === "active" && (
                      <span className="rounded-full bg-[#FF6C0F]/10 px-2 py-0.5 text-xs font-medium text-[#FF6C0F]">
                        진행 중
                      </span>
                    )}
                    {step.status === "upcoming" && (
                      <span className="rounded-full bg-[#f0efe6] px-2 py-0.5 text-xs text-[#6b6b5e]">
                        예정
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      step.highlight
                        ? "font-semibold text-[#FF6C0F]"
                        : "text-[#6b6b5e]"
                    }
                  >
                    {step.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 30주 동안 일어나는 일 ─────────────────── */}
      <section className="mx-auto max-w-[760px] px-6 py-16 md:py-24">
        <h2
          className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.15] tracking-tight text-[#16140f]"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          30주 동안 일어나는 일
        </h2>

        <div className="mt-8 space-y-5 font-['Pretendard',sans-serif] text-[17px] leading-[1.75] text-[#4a4a40]">
          <p>
            SPEC 4기는{" "}
            <strong className="font-semibold text-[#16140f]">
              2026년 3월 27일부터 약 30주간
            </strong>{" "}
            활동합니다. 정기 세션은 매주 월요일, 성균관대학교
            인문사회캠퍼스에서 진행됩니다.
          </p>
          <p>
            오후 5시부터 7시까지는 SPEC 정규 세션입니다. 매출 챌린지, 팀
            프로젝트, 피드백 — 직접 만들고 팔고 부딪히는 시간입니다. 7시
            반부터 9시 반까지는 RISE 사업단이 운영하는{" "}
            <strong className="font-semibold text-[#16140f]">
              VCC 미니 MBA
            </strong>
            가 이어집니다. 매주 현직 창업가와 VC가 강연합니다. SPEC에서
            실행하고, VCC에서 시야를 넓히는 구조입니다.
          </p>
          <p>
            처음엔 누구나 어렵습니다. 그래서 같이 하는 겁니다. SPEC은 혼자
            뛰라고 내보내는 곳이 아닙니다. 같은 질문을 던지는 사람들이 모여서,
            같은 강도로 30주를 보내는 곳입니다.
          </p>
          <p>
            SPEC은 데모데이에서 끝나지 않습니다. 알럼나이 네트워크를 통해 창업
            여정을 계속 함께합니다.
          </p>
          <p>
            구체적인 커리큘럼과 트랙별 활동은{" "}
            <a
              href="/curriculum"
              className="font-medium text-[#16140f] underline decoration-[#16140f]/30 underline-offset-2 transition-colors hover:decoration-[#FF6C0F]"
            >
              커리큘럼 페이지
            </a>
            에서 확인할 수 있습니다.
          </p>
          <p>
            회비는{" "}
            <strong className="font-semibold text-[#16140f]">
              40,000원
            </strong>
            입니다. 활동에 필요한 모든 프로그램과 자료가 포함됩니다.
          </p>
        </div>
      </section>

      {/* ── Footer Note ──────────────────────────── */}
      <div className="mx-auto max-w-[760px] px-6 pb-24">
        <p className="font-['Pretendard',sans-serif] text-[15px] leading-[1.7] text-[#9a9a8c]">
          궁금한 점은 러너 회장 전도현(010-9445-0964)에게 문의해 주세요. SPEC
          인스타그램(
          <a
            href="https://instagram.com/skku_spec"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-[#6b6b5e]"
          >
            @skku_spec
          </a>
          )에서도 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
