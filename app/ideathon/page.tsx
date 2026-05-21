"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Calendar, MapPin, ChevronDown, HelpCircle, Info, Lightbulb, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { submitIdea } from "@/lib/actions/ideas";
import { IdeathonScrollHero } from "./IdeathonScrollHero";

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
  const { isAuthenticated, role } = useUser();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await submitIdea(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setIsSuccess(true);
      }
    });
  };

  return (
    <main className="relative flex-1 bg-white text-[#16140f] min-h-screen">
      {/* Hero Section */}
      <IdeathonScrollHero />

      {/* Introduction Section */}
      <section id="intro" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 overflow-hidden bg-white">
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5">
              <h2 className="font-['Outfit',sans-serif] text-3xl md:text-4xl font-black uppercase tracking-tight text-[#16140f]">
                BEGIN YOUR JOURNEY.<br />
                <span className="text-[#FF9900]">MAKE THE IDEA.</span>
              </h2>
              <p className="mt-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#6b6b5e] uppercase tracking-wider">
                팔아라, 만들지 마라
              </p>
            </div>
            <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-[#ddd9cc] shadow-sm">
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

      {/* Schedule & Venue + Timetable — single dark section */}
      <section id="schedule" className="relative w-full overflow-hidden" style={{ backgroundColor: "#16140f" }}>
        {/* Schedule & Venue */}
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
            <div className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 p-6 flex items-start gap-4">
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

            <div className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 p-6 flex items-start gap-4">
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

        {/* Timetable */}
        <div className="relative z-10 mx-auto max-w-[960px] px-6 pb-16 md:pb-24 mt-12">
          <div className="space-y-8 p-6 md:p-10 rounded-lg border border-white/10 bg-white/5">
            <div>
              <h3 className="font-['Pretendard',sans-serif] text-2xl font-bold text-white mb-6 pb-2 border-b border-white/15">
                TIMETABLE
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Day 1 */}
              <div>
                <h4 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#FF9900] mb-6 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF9900]/20 text-xs font-semibold">Day 1</span>
                  6/6 (토)
                </h4>
                <div className="relative border-l border-white/20 pl-6 space-y-6">
                  {TIMETABLE_DAY1.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#16140f] border-2 border-[#FF9900]" />
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

              {/* Day 2 */}
              <div>
                <h4 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#FF9900] mb-6 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF9900]/20 text-xs font-semibold">Day 2</span>
                  6/7 (일)
                </h4>
                <div className="relative border-l border-white/20 pl-6 space-y-6">
                  {TIMETABLE_DAY2.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#16140f] border-2 border-[#FF9900]" />
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
                  <Info className="h-4 w-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <p className="font-['Pretendard',sans-serif] text-xs text-white/50 leading-relaxed">
                    세부 시간은 공간 사용 가능 시간과 멘토/심사위원 일정에 따라 일부 조정될 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners & FAQ Section */}
      <section id="partners-faq" className="relative w-full overflow-hidden">
        {/* Partners — white background */}
        <div className="relative w-full py-16 md:py-24 bg-white">
          <div className="relative z-10 mx-auto max-w-[960px] px-6">
            <div className="mb-12 text-center">
              <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-[#16140f] sm:text-4xl">
                PARTNERS
              </h2>
              <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
                SPEC의 도전적인 여정을 함께 지원하는 든든한 조력자
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Alphabrothers */}
              <div className="flex flex-col items-center gap-6 p-8 rounded-xl bg-white border border-[#ddd9cc] shadow-sm text-center">
                <div className="flex items-center justify-center h-16">
                  <Image
                    src="/images/logos/alphabrothers.png"
                    alt="알파브라더스"
                    width={160}
                    height={64}
                    className="object-contain max-h-16 w-auto"
                  />
                </div>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  검증된 방법론을 바탕으로 혁신 기업의 시작과 성장을 설계하고 조력하는 전문 빌더사입니다. 본 행사 개최 공간 및 실무 멘토링을 제공합니다.
                </p>
              </div>

              {/* Willer */}
              <div className="flex flex-col items-center gap-6 p-8 rounded-xl bg-white border border-[#ddd9cc] shadow-sm text-center">
                <div className="flex items-center justify-center h-16">
                  <Image
                    src="/images/logos/willer.jpeg"
                    alt="윌러특허법률사무소"
                    width={160}
                    height={64}
                    className="object-contain max-h-16 w-auto"
                  />
                </div>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  스타트업 비즈니스의 지식재산권(IP) 보호와 특허 출원 전략을 지원하여, 장기적인 경쟁력 강화를 돕는 핵심 지식재산 전략 파트너입니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ — white background */}
        <div className="relative w-full py-16 md:py-24 bg-white">
          <div id="faq" className="relative z-10 mx-auto max-w-[720px] px-6">
            <div className="mb-12 text-center">
              <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-[#16140f]">
                FAQ
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
                    className="rounded-lg border border-[#ddd9cc] bg-white overflow-hidden transition-all duration-200 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="h-5 w-5 text-[#FF9900] shrink-0" />
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
        </div>
      </section>

      {/* Submit Idea Form Section */}
      <section id="submit" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 bg-[#f5f5ee]/30">
        <div className="relative z-10 mx-auto max-w-[720px] px-6">
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-6 sm:p-8 shadow-sm">
            {isSuccess ? (
              <div className="flex flex-col items-center text-center py-10 space-y-6">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-[#2f9e44]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-['Pretendard',sans-serif] text-xl font-bold text-[#16140f]">
                    아이디어가 성공적으로 등록되었습니다!
                  </h3>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    제출하신 비즈니스 아이디어가 데이터베이스에 안전하게 저장되었습니다.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
                  <Link
                    href="/dashboard/ideas"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    대시보드에서 목록 확인
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#ddd9cc] bg-white px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:bg-gray-50"
                  >
                    추가 제출하기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-6 w-6 text-[#FF6C0F]" />
                    <h2 className="font-['Pretendard',sans-serif] text-2xl font-bold text-[#16140f]">
                      Idea Submission
                    </h2>
                  </div>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    구상하신 혁신적인 비즈니스 아이디어를 공유해 주세요. 제출된 정보는 SPEC 학회원 모두에게 공유되며 공동창업자 매칭에 활용됩니다.
                  </p>
                </div>

                {!isAuthenticated ? (
                  <div className="flex flex-col items-center text-center py-8 space-y-4">
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                      아이디어를 제출하려면 SPEC 멤버 로그인이 필요합니다.
                    </p>
                    <Link
                      href="/login?redirect=/ideathon#submit"
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      SPEC 계정으로 로그인
                    </Link>
                  </div>
                ) : !["learner", "alumni", "preneur"].includes(role) ? (
                  <div className="flex flex-col items-center text-center py-8 space-y-4">
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#b42318] font-semibold">
                      아이디어 제출 권한이 없습니다.
                    </p>
                    <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      SPEC 4기 러너, 알럼나이, 프러너 권한을 가진 계정으로 로그인해 주세요.
                    </p>
                  </div>
                ) : (
                  <form action={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="rounded-md border border-[#b42318]/20 bg-[#fdecec] p-4 text-sm text-[#b42318] font-['Pretendard',sans-serif]">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="title" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        아이디어명 / 프로젝트명 <span className="text-[#FF6C0F]">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        placeholder="예: AI 기반 학술 연구 번역 협업 툴"
                        className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="target_customer" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        타깃 고객
                      </label>
                      <input
                        type="text"
                        id="target_customer"
                        name="target_customer"
                        placeholder="예: 해외 저널 투고를 준비하는 국내 대학원생 및 신진 연구자"
                        className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="description" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        해결하려는 문제 및 솔루션 설명 <span className="text-[#FF6C0F]">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        rows={5}
                        placeholder="어떤 문제를 어떻게 혁신적으로 해결하고자 하는지 구체적으로 적어주세요."
                        className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="competitors" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        경쟁사 분석 및 차별점
                      </label>
                      <textarea
                        id="competitors"
                        name="competitors"
                        rows={3}
                        placeholder="기존 대안이나 경쟁 서비스는 무엇이며, 본 솔루션만의 차별화 장벽은 무엇인가요?"
                        className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="market_size" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        예상 시장 규모
                      </label>
                      <input
                        type="text"
                        id="market_size"
                        name="market_size"
                        placeholder="예: 국내 연구자 약 50만 명 (유료 타깃 세그먼트 약 500억 원 규모)"
                        className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="team_members" className="block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                        참여 중인 팀원 / 구하는 파트너 정보
                      </label>
                      <input
                        type="text"
                        id="team_members"
                        name="team_members"
                        placeholder="예: 현재 기획 1명 구성 완료 / React Frontend 개발 경력이 있거나 AI 모델 핏 연구에 관심 있는 개발자 파트너 모집"
                        className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full flex h-10 items-center justify-center rounded-md bg-[#16140f] font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isPending ? "제출 중..." : "아이디어 제출하기"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
