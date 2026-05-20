"use client";

import { useState } from "react";
import { Calendar, MapPin, Handshake, ChevronDown, HelpCircle, ArrowRight } from "lucide-react";

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

const SCHEDULE_ITEMS = [
  {
    day: "Day 1",
    time: "13:00 - 15:00",
    title: "오프닝 & 아이디어 피칭",
    desc: "검증된 비즈니스 기회와 아이디어를 공유하고 함께할 팀원을 모집합니다.",
  },
  {
    day: "Day 1",
    time: "15:00 - 18:00",
    title: "팀 스피드 데이팅 & 최종 매칭",
    desc: "서로의 역량과 일하는 스타일을 확인한 후 평생 함께할 공동창업팀을 최종 확정합니다.",
  },
  {
    day: "Day 1",
    time: "18:00 - 익일",
    title: "48시간 빌딩 스프린트 시작",
    desc: "팀별 비즈니스 모델 구체화, 초기 가설 수립 및 런칭 전략 설계에 돌입합니다.",
  },
  {
    day: "Day 2",
    time: "09:00 - 12:00",
    title: "중간 검토 & 프러너 오피스아워",
    desc: "지표와 비즈니스 논리에 대해 프러너 코치들의 1:1 밀착 피드백을 받습니다.",
  },
  {
    day: "Day 2",
    time: "14:00 - 17:00",
    title: "모의 IR 피칭 및 외부 VC 피드백",
    desc: "현직 VC 심사위원단 앞에서 비즈니스 가설을 발표하고 최종 수료를 위한 보완 방안을 도출합니다.",
  },
];

export default function IdeathonPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <main className="relative flex-1 bg-[#f5f5ee] text-[#16140f] overflow-hidden">
      {/* Decorative Brush Stroke Background Layer */}
      <div className="absolute inset-0 -z-10 pointer-events-none select-none overflow-hidden">
        {/* Top brush stroke (Right) */}
        <div
          className="absolute top-[-50px] right-[-10%] w-[90%] md:w-[65%] h-[600px] bg-no-repeat bg-[position:right_top] opacity-[0.22] mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/ideathon-bg.jpg')",
            backgroundSize: "contain",
          }}
        />
        {/* Middle brush stroke (Left) */}
        <div
          className="absolute top-[30%] left-[-20%] w-[95%] md:w-[70%] h-[700px] bg-no-repeat bg-[position:left_center] opacity-[0.16] mix-blend-multiply rotate-45"
          style={{
            backgroundImage: "url('/images/ideathon-bg.jpg')",
            backgroundSize: "contain",
          }}
        />
        {/* Bottom brush stroke (Right) */}
        <div
          className="absolute bottom-[-100px] right-[-15%] w-[90%] md:w-[60%] h-[800px] bg-no-repeat bg-[position:right_bottom] opacity-[0.20] mix-blend-multiply rotate-180"
          style={{
            backgroundImage: "url('/images/ideathon-bg.jpg')",
            backgroundSize: "contain",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-[960px] px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center relative">
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
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#ddd9cc] bg-white px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-all hover:bg-gray-50"
          >
            일정 및 장소
          </a>
        </div>
      </section>

      {/* Introduction Section */}
      <section id="intro" className="mx-auto max-w-[960px] px-6 py-16 md:py-24 border-t border-[#ddd9cc]/60">
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
          <div className="md:col-span-7">
            <p className="font-['Pretendard',sans-serif] text-[18px] leading-[1.8] text-[#16140f] mb-6 font-medium">
              아이디어톤은 10주간의 치열했던 Bootcamp 기간 동안 서로 셔플하며 증명해온 비즈니스 모델을 구체화하는 실전 창업의 첫 게이트웨이입니다.
            </p>
            <p className="font-['Pretendard',sans-serif] text-base leading-[1.8] text-[#4a4a40] mb-6">
              단순한 상상이나 기획서 제출에서 벗어나, 그간 모아온 리얼 고객 데이터와 가설 검증 결과물을 바탕으로 진행됩니다. 참가자들은 이 세션에서 서로의 강점과 비전을 공유하며, 향후 30주간 프로덕트를 함께 만들고 매출을 극대화할 최적의 핵심 공동창업자를 확정하게 됩니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="p-5 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8]">
                <h4 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] mb-2">
                  최고의 파트너 매칭
                </h4>
                <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] leading-relaxed">
                  개발, 디자인, 기획 등 각기 다른 전문 분야의 파운더들이 핏을 조율하고 최종 원팀을 구성합니다.
                </p>
              </div>
              <div className="p-5 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8]">
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
      </section>

      {/* Schedule & Location Section */}
      <section id="schedule" className="bg-[#fcfcf8] border-y border-[#ddd9cc] py-20 md:py-28 relative">
        <div className="mx-auto max-w-[960px] px-6">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-[#16140f] sm:text-4xl">
              일정 및 장소
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
              SPEC 4기 아이디어톤을 관통하는 1박 2일의 스케줄과 오시는 길
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Info Card 1: Schedule */}
            <div className="rounded-lg border border-[#ddd9cc] bg-[#f5f5ee] p-6 flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FF6C0F]/10 text-[#FF6C0F]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f] mb-1">
                  행사 일정
                </h3>
                <p className="font-['Pretendard',sans-serif] text-[15px] text-[#4a4a40] font-semibold mb-1">
                  2026.06.06 (토) - 2026.06.07 (일)
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  1박 2일간의 강도 높은 몰입형 팀 빌딩 및 피칭 스프린트로 진행됩니다.
                </p>
              </div>
            </div>

            {/* Info Card 2: Location */}
            <div className="rounded-lg border border-[#ddd9cc] bg-[#f5f5ee] p-6 flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FF6C0F]/10 text-[#FF6C0F]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f] mb-1">
                  행사 장소
                </h3>
                <p className="font-['Pretendard',sans-serif] text-[15px] text-[#4a4a40] font-semibold mb-1">
                  알파브러더스 사무실
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  아이디어 구체화와 협업을 극대화할 수 있는 창의적인 코워킹 플레이스입니다.
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Wrapper */}
          <div className="border border-[#ddd9cc] rounded-lg bg-white p-6 md:p-8">
            <h3 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f] mb-6">
              아이디어톤 타임라인
            </h3>
            <div className="relative border-l border-[#ddd9cc] pl-6 ml-2 space-y-8">
              {SCHEDULE_ITEMS.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-[#FF6C0F]" />
                  <span className="inline-block text-xs font-semibold text-[#FF6C0F] mb-1">
                    {item.day} | {item.time}
                  </span>
                  <h4 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f] mb-1">
                    {item.title}
                  </h4>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="mx-auto max-w-[960px] px-6 py-20 md:py-28 border-b border-[#ddd9cc]/60">
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
          <div className="flex flex-col items-center justify-between p-8 rounded-lg border border-[#ddd9cc] bg-white text-center">
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
          <div className="flex flex-col items-center justify-between p-8 rounded-lg border border-[#ddd9cc] bg-white text-center">
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
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-[720px] px-6 py-20 md:py-28">
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
                className="rounded-lg border border-[#ddd9cc] bg-white overflow-hidden transition-all duration-200"
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
                  <div className="px-6 py-4 bg-[#fcfcf8] font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
