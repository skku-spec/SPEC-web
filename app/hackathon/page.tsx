import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "MVP Hackathon | SPEC",
  description:
    "SPEC MVP 해커톤 — 기획안을 바탕으로 실제 동작하는 프로덕트를 빌드하고 라이브 배포를 진행하는 1박 2일 몰입형 해커톤",
};

const pClass =
  "mb-6 font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.7] text-[#4a4a40] last:mb-0";

export default function HackathonPage() {
  const sections = [
    {
      title: "기능 명세 및 범위 확정 (WBS & Spec Definition)",
      desc: "단기간 내 배포와 검증이 가능한 핵심 기능만을 선별하여 Figjam 및 Figma 화면 설계서를 완성하고 일정을 설계합니다.",
    },
    {
      title: "48시간 릴레이 빌드 스프린트 (48-Hour Coding Sprint)",
      desc: "개발자, 디자이너, 기획자가 한자리에 모여 실시간으로 피드백을 주고받으며 집중적으로 프로덕트를 구현하고 결합합니다.",
    },
    {
      title: "바이브 코딩 및 배포 멘토링 (Live Deployment)",
      desc: "프러너 코치 및 현직 전문가 멘토들과 함께 깃(Git) 협업 전략, CI/CD 배포 자동화, 서버 환경 셋업 등을 함께 진단하고 고도화합니다.",
    },
    {
      title: "데이터 트래킹 및 고객 피드백 연동 (Analytics & Feedback)",
      desc: "해커톤 종료 시점과 동시에 실사용자가 접근할 수 있도록 라이브 배포를 진행하고, 유저 행동을 트래킹하기 위한 분석 도구를 셋업합니다.",
    },
  ];

  return (
    <main className="flex-1 px-5 py-6 sm:px-8 sm:py-10 lg:px-10 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[720px]">
        <PageHeader 
          title="MVP Hackathon" 
          subtitle="기획에서 실제 라이브 배포까지, 48시간 동안 동작하는 MVP를 빌드하는 개발 스프린트"
        />
      </div>

      <article className="mx-auto max-w-[720px]">
        <section className="mb-12">
          <p className="mb-6 font-['Pretendard',sans-serif] font-normal text-[18px] leading-[1.7] text-[#16140f]">
            {"SPEC MVP 해커톤은 머릿속에만 존재하던 비즈니스 기획과 화면 설계안을 48시간 동안 쉬지 않고 몰입하여 누구나 접속해 사용해볼 수 있는 '동작하는 웹/앱 프로덕트'로 구현하는 극도의 실행 지향형 해커톤입니다."}
          </p>
          <p className={pClass}>
            {"개발 단계에서 마주하는 다양한 리스크와 기술적 제약을 이겨내며, 유저 가치 검증에 필수적인 핵심 기능을 정의하고 빠르게 출시하는 '린 스타트업(Lean Startup)' 정신을 실천합니다."}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f]">
            핵심 프로그램 구성
          </h2>
          <div className="space-y-4">
            {sections.map((item, idx) => (
              <div 
                key={idx} 
                className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-5 transition-colors hover:bg-[#fcfcf8]/60"
              >
                <h3 className="mb-2 font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
                  {item.title}
                </h3>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          <h2 className="mb-4 font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">
            행사 안내
          </h2>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-[#ece8db]">
                <td className="py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-24">
                  대상
                </td>
                <td className="py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  SPEC 4기 러너 및 프러너 전원 (팀 단위 참여)
                </td>
              </tr>
              <tr className="border-b border-[#ece8db]">
                <td className="py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  일정
                </td>
                <td className="py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  2026년 6월 27일 (토) ~ 6월 28일 (일) / 1박 2일
                </td>
              </tr>
              <tr>
                <td className="py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  장소
                </td>
                <td className="py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  성균관대학교 자연과학캠퍼스 유림아트홀
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </article>
    </main>
  );
}
