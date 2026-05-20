import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Ideathon | SPEC",
  description:
    "SPEC 아이디어톤 — W10 부트캠프를 마무리하며 최종 팀을 빌딩하고 48시간 동안 비즈니스 가설을 검증하는 1박 2일 몰입형 프로그램",
};

const pClass =
  "mb-6 font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.7] text-[#4a4a40] last:mb-0";

export default function IdeathonPage() {
  const sections = [
    {
      title: "팀 스피드 데이팅 (Team Speed Dating)",
      desc: "러너와 프러너들이 서로의 강점, 관심 산업, 비전 및 일하는 스타일을 공유하며 최적의 핏을 찾아 최종 창업팀을 결성합니다.",
    },
    {
      title: "아이디어 피칭 (Idea Pitching)",
      desc: "그동안 검증한 시장 기회와 사업 모델을 발표하고, 팀원들을 설득하여 실행 동력을 확보합니다.",
    },
    {
      title: "48시간 빌딩 스프린트 (48-Hour Sprint)",
      desc: "확정된 팀원들과 함께 첫 프로덕트의 핵심 가치 정의, 마일스톤 설계, 초기 타겟 고객 정의를 즉시 진행합니다.",
    },
    {
      title: "현직 창업가 & VC 피드백 (Expert Feedback)",
      desc: "업계 최고의 현업 창업가들과 투자자들 앞에서 비즈니스 가설을 발표하고 날카로운 피드백을 통해 방향성을 조율합니다.",
    },
  ];

  return (
    <main className="flex-1 px-5 py-6 sm:px-8 sm:py-10 lg:px-10 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[720px]">
        <PageHeader 
          title="Ideathon" 
          subtitle="Phase 1의 마무리를 장식하는 최종 팀 빌딩 및 1박 2일 몰입형 아이디어톤"
        />
      </div>

      <article className="mx-auto max-w-[720px]">
        <section className="mb-12">
          <p className="mb-6 font-['Pretendard',sans-serif] font-normal text-[18px] leading-[1.7] text-[#16140f]">
            SPEC 아이디어톤은 10주간의 부트캠프(Bootcamp) 과정 동안 매주 팀을 셔플하며 탐색한 기회들을 바탕으로, 평생 함께할 핵심 공동창업자를 확정하고 사업화의 첫발을 내딛는 중요한 행사입니다.
          </p>
          <p className={pClass}>
            단순히 좋은 아이디어를 제안하는 것에 그치지 않고, 시장에 직접 부딪혀 매출이나 고객 유저 행동으로 가설을 입증한 결과물을 바탕으로 최종 발표를 진행합니다.
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
                  SPEC 4기 러너 및 프러너 전원
                </td>
              </tr>
              <tr className="border-b border-[#ece8db]">
                <td className="py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  일정
                </td>
                <td className="py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  2026년 6월 6일 (토) ~ 6월 7일 (일) / 1박 2일
                </td>
              </tr>
              <tr>
                <td className="py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                  장소
                </td>
                <td className="py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                  성균관대학교 자연과학캠퍼스 러닝팩토리
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </article>
    </main>
  );
}
