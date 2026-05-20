"use client";

import { useState } from "react";
import { Calendar, MapPin, Handshake, ChevronDown, HelpCircle, Info } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "아이디어톤 참여 대상은 어떻게 되나요?",
    answer: "SPEC 4기 러너 및 프러너 전원이 참여 대상입니다. 팀 빌딩이 목적이므로 전원 필수로 참석해야 합니다.",
  },
  {
    question: "팀 매칭은 어떻게 진행되나요?",
    answer: "부트캠프 10주간의 팀 셔플 데이터를 토대로 상호 보완적인 역량과 관심사를 가진 동료를 탐색합니다. 행사 당일 피칭과 스피드 데이팅 세션을 통해 서로 핏이 맞는 공동창업자를 최종 매칭합니다.",
  },
  {
    question: "장소인 알파브러더스 사무실의 상세 위치는 어디인가요?",
    answer: "상세 주소 및 오시는 길 정보는 SPEC 4기 공식 커뮤니티 채널(슬랙 등)을 통해 행사 1주일 전 상세히 안내해 드립니다.",
  },
  {
    question: "행사는 무박으로 진행되나요?",
    answer: "네, 1박 2일 몰입형 프로그램으로 진행됩니다. 몰입을 극대하기 위한 밤샘 작업 공간이 제공되며 식사, 간식, 음료 등이 풍부하게 준비될 예정입니다.",
  },
];

const TIMETABLE_DAY1 = [
  { time: "13:00 - 13:30", title: "참가자 집합 및 행사 안내" },
  { time: "13:30 - 14:00", title: "아이스브레이킹" },
  { time: "14:00 - 15:00", title: "아이디어 개별/자유 피칭" },
  { time: "15:00 - 16:00", title: "팀 스피드 데이팅 및 팀빌딩" },
  {
    time: "16:00 - 18:00",
    title: "팀별 아이디어 구체화",
    desc: "문제 정의, 타깃 고객, 해결 방식 정리",
  },
  { time: "18:00 - 19:00", title: "저녁 식사" },
  { time: "19:00 - 19:05", title: "오프닝 및 멘토 소개" },
  { time: "19:05 - 19:25", title: "멘토 창업 스토리 공유" },
  {
    time: "19:25 - 19:50",
    title: "키워드 토크",
    desc: "아이디어 검증, 팀빌딩, 실행, 첫 고객 등",
  },
  { time: "19:50 - 20:00", title: "멤버 Q&A" },
  { time: "20:00 - 20:50", title: "팀별 간단 피칭 및 멘토 피드백" },
  { time: "20:50 - 21:00", title: "마무리 코멘트" },
  { time: "21:00 - 23:00", title: "멘토 피드백 반영 및 발표 방향 정리" },
];

const TIMETABLE_DAY2 = [
  { time: "09:00 - 10:00", title: "아침 정리 및 팀별 최종 작업" },
  { time: "10:00 - 11:30", title: "최종 발표 자료 완성" },
  { time: "11:30 - 12:30", title: "점심 식사" },
  { time: "12:30 - 14:30", title: "팀별 최종 발표" },
  { time: "14:30 - 15:00", title: "심사위원 Q&A 및 총평" },
  { time: "15:00 - 15:30", title: "시상 및 마무리" },
];

export default function IdeathonPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <main className="relative flex-1 bg-white text-[#16140f] min-h-screen">
      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-[960px] px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center bg-white">
        <span className="inline-block rounded-full bg-[#FF6C0F]/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#FF6C0F] mb-6 font-['Pretendard',sans-serif]">
          SPEC 4기 EVENT
        </span>
        <h1
          className="text-[clamp(2.5rem,6vw,4.5rem)] font-black tracking-tight leading-[1.1] text-[#16140f] mb-6"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          SPEC IDEATHON
        </h1>
        <p className="mx-auto max-w-2xl font-['Pretendard',sans-serif] text-lg sm:text-xl font-normal leading-relaxed text-[#4a4a40] mb-8">
          W10 부트캠프를 마무리하며 최종 창업 팀을 빌딩하고,<br className="hidden sm:inline" />
          48시간 동안 비즈니스 가설을 검증하는 1박 2일 몰입형 아이디어톤
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="#intro"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-all hover:bg-[#16140f]/80"
          >
            소개 보러가기
          </a>
          <a
            href="#schedule"
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#ddd9cc] bg-white/90 backdrop-blur-sm px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-all hover:bg-gray-50"
          >
            타임테이블 & 장소
          </a>
        </div>
      </section>

      {/* Introduction Section */}
      <section id="intro" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 overflow-hidden bg-white">
        {/* Background Image Slice 1 */}
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 opacity-90 mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/ideathon-bg-1.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5">
              <h2 className="font-['Outfit',sans-serif] text-3xl md:text-4xl font-black uppercase tracking-tight text-[#16140f]">
                SELL FIRST.<br />
                <span className="text-[#FF6C0F]">BUILD NEVER.</span>
              </h2>
              <p className="mt-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#6b6b5e] uppercase tracking-wider">
                팔아라, 만들지 마라
              </p>
            </div>
            <div className="md:col-span-7 bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-lg border border-[#ddd9cc] shadow-sm">
              <p className="font-['Pretendard',sans-serif] text-[18px] leading-[1.8] text-[#16140f] mb-6 font-medium">
                아이디어톤은 10주간의 치열했던 Bootcamp 기간 동안 서로 셔플하며 증명해온 비즈니스 모델을 구체화하는 실전 창업의 첫 게이트웨이입니다.
              </p>
              <p className="font-['Pretendard',sans-serif] text-base leading-[1.8] text-[#4a4a40] mb-6">
                단순한 상상이나 기획서 제출에서 벗어나, 그간 모아온 리얼 고객 데이터와 가설 검증 결과물을 바탕으로 진행됩니다. 참가자들은 이 세션에서 서로의 강점과 비전을 공유하며, 향후 30주간 프로덕트를 함께 만들고 매출을 극대화할 최적의 핵심 공동창업자를 확정하게 됩니다.
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

      {/* Schedule & Location Section */}
      <section id="schedule" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 overflow-hidden bg-white">
        {/* Background Image Slice 2 */}
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 opacity-90 mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/ideathon-bg-2.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-[#16140f] sm:text-4xl">
              일정 및 장소
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
              SPEC 4기 아이디어톤을 관통하는 1박 2일의 스케줄과 오시는 길
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info Card 1: Schedule */}
            <div className="rounded-lg border border-[#ddd9cc] bg-white/80 backdrop-blur-md p-6 flex items-start gap-4 shadow-sm">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FF6C0F]/10 text-[#FF6C0F]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f] mb-1">
                  행사 일정
                </h3>
                <p className="font-['Pretendard',sans-serif] text-[15px] text-[#4a4a40] font-bold mb-1">
                  2026.06.06 (토) - 2026.06.07 (일)
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  1박 2일간의 강도 높은 몰입형 팀 빌딩 및 피칭 스프린트로 진행됩니다.
                </p>
              </div>
            </div>

            {/* Info Card 2: Location */}
            <div className="rounded-lg border border-[#ddd9cc] bg-white/80 backdrop-blur-md p-6 flex items-start gap-4 shadow-sm">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FF6C0F]/10 text-[#FF6C0F]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f] mb-1">
                  행사 장소
                </h3>
                <p className="font-['Pretendard',sans-serif] text-[15px] text-[#4a4a40] font-bold mb-1">
                  알파브러더스 사무실
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  아이디어 구체화와 협업을 극대화할 수 있는 창의적인 코워킹 플레이스입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timetable Section */}
      <section id="timetable" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 overflow-hidden bg-white">
        {/* Background Image Slice 3 */}
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 opacity-90 mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/ideathon-bg-3.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="space-y-8 bg-white/70 backdrop-blur-md p-6 md:p-10 rounded-lg border border-[#ddd9cc] shadow-sm">
            <div>
              <h3 className="font-['Pretendard',sans-serif] text-2xl font-bold text-[#16140f] mb-6 pb-2 border-b border-[#ece8db]">
                아이디어톤 타임테이블
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Day 1 Timetable */}
              <div>
                <h4 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#FF6C0F] mb-6 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF6C0F]/10 text-xs font-semibold">Day 1</span>
                  6/6 (토)
                </h4>
                <div className="relative border-l border-[#ddd9cc] pl-6 space-y-6">
                  {TIMETABLE_DAY1.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-[#FF6C0F]" />
                      <span className="inline-block text-xs font-bold text-[#6b6b5e] mb-0.5 font-['Pretendard',sans-serif]">
                        {item.time}
                      </span>
                      <h5 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        {item.title}
                      </h5>
                      {item.desc && (
                        <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day 2 Timetable */}
              <div>
                <h4 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#FF6C0F] mb-6 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF6C0F]/10 text-xs font-semibold">Day 2</span>
                  6/7 (일)
                </h4>
                <div className="relative border-l border-[#ddd9cc] pl-6 space-y-6">
                  {TIMETABLE_DAY2.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-[#FF6C0F]" />
                      <span className="inline-block text-xs font-bold text-[#6b6b5e] mb-0.5 font-['Pretendard',sans-serif]">
                        {item.time}
                      </span>
                      <h5 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        {item.title}
                      </h5>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-lg bg-[#fcfcf8] border border-[#ddd9cc] flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-[#FF6C0F] shrink-0 mt-0.5" />
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] leading-relaxed">
                    세부 시간은 공간 사용 가능 시간과 멘토/심사위원 일정에 따라 일부 조정될 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners & FAQ Section */}
      <section id="partners-faq" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 overflow-hidden bg-white">
        {/* Background Image Slice 4 */}
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 opacity-90 mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/ideathon-bg-4.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
        
        {/* Partners Content */}
        <div className="relative z-10 mx-auto max-w-[960px] px-6 mb-20 md:mb-28">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-[#16140f] sm:text-4xl">
              파트너사
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
              SPEC의 도전적인 여정을 함께 지원하는 든든한 조력자
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Partner 1 */}
            <div className="flex flex-col items-center justify-between p-8 rounded-lg border border-[#ddd9cc] bg-white/90 backdrop-blur-sm text-center shadow-sm">
              <div className="mb-4 text-[#FF6C0F] flex items-center justify-center">
                <Handshake className="h-10 w-10 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f] mb-2">
                  알파브라더스
                </h3>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  검증된 방법론을 바탕으로 혁신 기업의 시작과 성장을 설계하고 조력하는 전문 빌더사입니다. 본 행사 개최 공간 및 실무 멘토링을 제공합니다.
                </p>
              </div>
            </div>

            {/* Partner 2 */}
            <div className="flex flex-col items-center justify-between p-8 rounded-lg border border-[#ddd9cc] bg-white/90 backdrop-blur-sm text-center shadow-sm">
              <div className="mb-4 text-[#FF6C0F] flex items-center justify-center">
                <Handshake className="h-10 w-10 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f] mb-2">
                  윌러특허법률사무소
                </h3>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  스타트업 비즈니스의 지식재산권(IP) 보호와 특허 출원 전략을 지원하여, 장기적인 경쟁력 강화를 돕는 핵심 지식재산 전략 파트너입니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div id="faq" className="relative z-10 mx-auto max-w-[720px] px-6">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-[#16140f]">
              자주 묻는 질문 (FAQ)
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
              아이디어톤에 대해 참가자가 가장 많이 문의하는 질문과 답변
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-[#ddd9cc] bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-[#FF6C0F] shrink-0" />
                      <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        {item.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-[#6b6b5e] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-200 ease-in-out ${
                      isOpen ? "max-h-[200px] border-t border-[#ece8db]" : "max-h-0 pointer-events-none"
                    } overflow-hidden`}
                  >
                    <div className="px-6 py-4 bg-[#fcfcf8]/80 font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
