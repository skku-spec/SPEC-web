import IdeathonPartnersFaqSection from "./IdeathonPartnersFaqSection";
import { IdeathonScheduleSection } from "./IdeathonScheduleSection";
import { IdeathonScrollHero } from "./IdeathonScrollHero";
import IdeathonSubmissionSection from "./IdeathonSubmissionSection";
import IdeathonTeamBoardSection from "./IdeathonTeamBoardSection";

export default function IdeathonPage() {
  return (
    <main className="relative flex-1 bg-white text-[#16140f] min-h-screen">
      <IdeathonScrollHero />

      <section id="intro" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 overflow-hidden bg-white">
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5">
              <h2 className="font-['Pretendard',sans-serif] text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[#16140f]">
                BEGIN YOUR JOURNEY.<br />
                <span className="text-[#FF6C0F]">MAKE THE IDEA.</span>
              </h2>

            </div>
            <div className="md:col-span-7 bg-white p-6 rounded-lg border border-[#ddd9cc]">
              <p className="font-['Pretendard',sans-serif] text-[18px] leading-[1.8] text-[#16140f] mb-6 font-medium">
                아이디어톤은 10주간의 치열했던 Bootcamp 기간 동안 서로 셔플하며 증명해온 비즈니스 모델을 구체화하는 실전 창업의 첫 게이트웨이입니다.
              </p>
              <p className="font-['Pretendard',sans-serif] text-base leading-[1.8] text-[#4a4a40] mb-6">
                단순한 상상이나 기획서 제출에서 벗어나, 그간 모아온 리얼 고객 데이터와 가설 검증 결과물을 바탕으로 진행됩니다. 참가자들은 이 세션에서 서로의 강점과 비전을 공유하며, 12월 데모데이까지 프로덕트를 함께 만들고 매출을 극대화할 최적의 핵심 공동창업자를 확정하게 됩니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="p-5 rounded-lg border border-[#ddd9cc] bg-white">
                  <h4 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] mb-2">
                    최고의 파트너 매칭
                  </h4>
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] leading-relaxed">
                    개발, 디자인, 기획 등 각기 다른 전문 분야의 파운더들이 핏을 조율하고 최종 원팀을 구성합니다.
                  </p>
                </div>
                <div className="p-5 rounded-lg border border-[#ddd9cc] bg-white">
                  <h4 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] mb-2">
                    실전 비즈니스 피드백
                  </h4>
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] leading-relaxed">
                    현업 스타트업 창업가 및 파트너 투자 심사역들이 멘토로 합류하여 실시간 검증 피드백을 전달합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <IdeathonTeamBoardSection />

      <IdeathonScheduleSection />

      <IdeathonPartnersFaqSection />

      <IdeathonSubmissionSection />
    </main>
  );
}
