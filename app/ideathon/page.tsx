import { Calendar, MapPin, Info } from "lucide-react";
import IdeathonPartnersFaqSection from "./IdeathonPartnersFaqSection";
import { IdeathonScrollHero } from "./IdeathonScrollHero";
import IdeathonSubmissionSection from "./IdeathonSubmissionSection";
import IdeathonTeamBoardSection from "./IdeathonTeamBoardSection";

const TIMETABLE_DAY1 = [
  { time: "12:00 - 12:30", title: "참가자 집합 및 행사 안내" },
  { time: "12:30 - 13:00", title: "아이스브레이킹" },
  { time: "13:00 - 14:00", title: "아이디어 개별/자유 피칭" },
  { time: "14:00 - 15:00", title: "팀 스피드 데이팅 및 팀빌딩" },
  {
    time: "15:00 - 17:00",
    title: "팀별 아이디어 구체화",
    desc: "문제 정의, 타깃 고객, 해결 방식 정리",
  },
  { time: "17:00 - 18:00", title: "저녁 식사" },
  { time: "18:00 - 18:05", title: "오프닝 및 멘토 소개" },
  { time: "18:05 - 18:25", title: "멘토 창업 스토리 공유" },
  {
    time: "18:25 - 18:50",
    title: "키워드 토크",
    desc: "아이디어 검증, 팀빌딩, 실행, 첫 고객 등",
  },
  { time: "18:50 - 19:00", title: "멤버 Q&A" },
  { time: "19:00 - 19:50", title: "팀별 간단 피칭 및 멘토 피드백" },
  { time: "19:50 - 20:00", title: "마무리 코멘트" },
  { time: "20:00 - 22:00", title: "멘토 피드백 반영 및 발표 방향 정리" },
];

const TIMETABLE_DAY2 = [
  { time: "09:00 - 10:00", title: "아침 정리 및 팀별 최종 작업" },
  { time: "10:00 - 11:30", title: "팀별 최종 발표" },
  { time: "11:30 - 12:00", title: "시상 및 마무리" },
];

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

      <section id="schedule" className="relative w-full overflow-hidden" style={{ backgroundColor: "#16140f" }}>
        <div id="timetable" className="relative z-10 mx-auto max-w-[960px] px-6 pt-16 md:pt-24">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-white sm:text-4xl">
              SCHEDULE & VENUE
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-white/75">
              SPEC 4기 아이디어톤을 관통하는 1박 2일의 스케줄과 오시는 길
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/25 p-6 flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/20 text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-white mb-1">
                  EVENT DATE
                </h3>
                <p className="font-['Pretendard',sans-serif] text-[15px] text-white font-bold mb-1">
                  2026.06.06 (토) - 2026.06.07 (일)
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-white/75">
                  1박 2일간의 강도 높은 몰입형 팀 빌딩 및 피칭 스프린트로 진행됩니다.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/25 p-6 flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/20 text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-white mb-1">
                  VENUE
                </h3>
                <p className="font-['Pretendard',sans-serif] text-[15px] text-white font-bold mb-1">
                  알파브러더스 사무실
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-white/75">
                  아이디어 구체화와 협업을 극대화할 수 있는 창의적인 코워킹 플레이스입니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[960px] px-6 pb-16 md:pb-24 mt-12">
          <div className="space-y-6 p-6 rounded-lg border border-white/10 bg-white/5">
            <div>
              <h3 className="font-['Pretendard',sans-serif] text-2xl font-bold text-white mb-6 pb-2 border-b border-white/15">
                TIMETABLE
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <h4 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#FF6C0F] mb-6 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF6C0F]/20 text-xs font-semibold">Day 1</span>
                  6/6 (토)
                </h4>
                <div className="relative border-l border-white/20 pl-6 space-y-6">
                  {TIMETABLE_DAY1.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#16140f] border-2 border-[#FF6C0F]" />
                      <span className="inline-block text-xs font-bold text-white/50 mb-0.5 font-['Pretendard',sans-serif]">
                        {item.time}
                      </span>
                      <h5 className="font-['Pretendard',sans-serif] text-sm font-semibold text-white">
                        {item.title}
                      </h5>
                      {item.desc && (
                        <p className="font-['Pretendard',sans-serif] text-xs text-white/50 mt-0.5">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#FF6C0F] mb-6 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF6C0F]/20 text-xs font-semibold">Day 2</span>
                  6/7 (일)
                </h4>
                <div className="relative border-l border-white/20 pl-6 space-y-6">
                  {TIMETABLE_DAY2.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#16140f] border-2 border-[#FF6C0F]" />
                      <span className="inline-block text-xs font-bold text-white/50 mb-0.5 font-['Pretendard',sans-serif]">
                        {item.time}
                      </span>
                      <h5 className="font-['Pretendard',sans-serif] text-sm font-semibold text-white">
                        {item.title}
                      </h5>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-[#FF6C0F] shrink-0 mt-0.5" />
                  <p className="font-['Pretendard',sans-serif] text-xs text-white/50 leading-relaxed">
                    세부 시간은 공간 사용 가능 시간과 멘토/심사위원 일정에 따라 일부 조정될 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <IdeathonPartnersFaqSection />

      <IdeathonSubmissionSection />
    </main>
  );
}
