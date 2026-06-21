"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar, 
  MapPin, 
  Info, 
  Target, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  Clock 
} from "lucide-react";

const TIMETABLE_DAY1 = [
  {
    time: "12:00 ~ 14:00",
    programs: ["킥오프"],
    details: ["행사 컨셉 · 레이스 · 진행 방식 안내"],
  },
  {
    time: "14:00 ~ 16:00",
    programs: ["세션 A 멘토링"],
    details: ["문제 정의 / 솔루션 / BM 멘토링"],
  },
  {
    time: "16:00 ~ 17:00",
    programs: ["멘토 네트워킹"],
    details: ["멘토 개별 네트워킹 (멘토 참석 시)"],
  },
  {
    time: "17:00 ~ 18:00",
    programs: ["세션 A 작업"],
    details: ["팀별 문제 정의 · 솔루션 · BM 정리 및 회의"],
  },
  {
    time: "18:00 ~ 19:00",
    programs: ["저녁 식사"],
    details: ["—"],
  },
  {
    time: "19:00 ~ 20:00",
    programs: ["세션 A 작업 (계속)"],
    details: ["팀별 문제 정의 · 솔루션 · BM 정리 및 회의"],
  },
  {
    time: "20:00 ~ 21:00",
    programs: ["세션 A 중간 피칭"],
    details: ["문제 정의 / 솔루션 / BM 발표 · 피드백"],
  },
  {
    time: "21:00 ~ 23:00",
    programs: ["세션 B 멘토링"],
    details: ["가설 검증 방법 / KPI 설정 / 로드맵 멘토링"],
  },
  {
    time: "23:00 ~",
    programs: ["세션 B 작업"],
    details: ["팀별 가설 검증 방식 적용 및 결과물 제작 (야식 제공)"],
  },
] as const;

const TIMETABLE_DAY2 = [
  {
    time: "08:00 ~ 10:00",
    programs: ["파이널 피칭 · 피드백"],
    details: ["가설 검증 방식 + 결과물 발표 · 팀별 즉석 피드백 (프리토타입 / 페이크도어 / 설문조사 페이지 등)"],
  },
  {
    time: "10:00 ~",
    programs: ["정리 및 퇴실"],
    details: ["—"],
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "캠프 참여 대상은 어떻게 되나요?",
    answer: "SPEC 4기 러너 및 프러너 전원이 참여 대상입니다. 가설 검증 결과물 제작이 필수이므로 전원 필수로 참석하셔야 합니다.",
  },
  {
    question: "최종 제출물은 어떤 형태여야 하나요?",
    answer: "고객 반응을 측정할 수 있는 형태라면 제한이 없습니다. 고객 인터뷰 질문지+섭외 페이지, 프리토타입, 페이크도어, 랜딩페이지 중 팀 아이템에 적합한 형태를 선택하여 제출하게 됩니다.",
  },
  {
    question: "장소인 유림아트홀은 어떻게 가나요?",
    answer: "성균관대학교 자연과학캠퍼스 내 유림아트홀에서 진행됩니다. 상세 위치는 커뮤니티 공지사항을 참고해 주세요.",
  },
  {
    question: "식사나 야식이 제공되나요?",
    answer: "네, 1박 2일 몰입 기간 동안 식사와 세션 B 자정 작업 시간 중 야식이 제공됩니다.",
  },
] as const;

const PARTNERS = [
  {
    name: "아이엠브릿지",
    href: "http://allthatcampus.com/main/main.html",
    linkLabel: "공식 웹사이트",
    image: { src: "/images/logos/imbridge.png", alt: "아이엠브릿지", width: 140, height: 48, className: "h-12 w-auto object-contain" },
    description: "대학생 창업 교육, 브랜드 마케팅 및 다양한 파트너 연계를 지원하는 창업 파트너사입니다. 본 행사 개최 공간 및 실무 멘토링을 제공합니다.",
  },
  {
    name: "김중철",
    href: "https://eopage.com/",
    linkLabel: "EO 공식 웹사이트",
    image: { src: "/images/logos/jungchul.png", alt: "김중철", width: 64, height: 64, className: "object-cover h-16 w-16 rounded-full border border-[#ddd9cc]" },
    description: "EO에서 국내 플랫폼 사업부 리드를 맡고 있으며, 스타트업의 단계별 성장 과정을 연구하고 있습니다. 베스트셀러 '오늘도 개발자가 안된다고 말했다'의 저자이기도 합니다.",
  },
] as const;

type TimetableItem = {
  readonly time: string;
  readonly programs: readonly string[];
  readonly details?: readonly string[];
};

function TimetableColumn({ label, date, items, showNote = false }: { label: string; date: string; items: readonly TimetableItem[]; showNote?: boolean }) {
  return (
    <div>
      <h4 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#FF6C0F] mb-6 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-[#FF6C0F]/20 text-xs font-semibold">{label}</span>
        {date}
      </h4>
      <div className="relative border-l border-white/20 pl-6 space-y-6">
        {items.map((item) => (
          <div key={item.time} className="relative">
            <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#16140f] border-2 border-[#FF6C0F]" />
            <span className="inline-block text-xs font-bold text-white/50 mb-0.5 font-['Pretendard',sans-serif]">
              {item.time}
            </span>
            <ul className="space-y-1">
              {item.programs.map((program) => (
                <li key={program} className="font-['Pretendard',sans-serif] text-sm font-semibold text-white">
                  {program}
                </li>
              ))}
            </ul>
            {item.details && item.details.length > 0 && (
              <ul className="mt-1 space-y-1">
                {item.details.map((detail) => (
                  <li key={detail} className="font-['Pretendard',sans-serif] text-xs text-white/50">
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {showNote && (
        <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-[#FF6C0F] shrink-0 mt-0.5" />
          <p className="font-['Pretendard',sans-serif] text-xs text-white/50 leading-relaxed">
            세부 시간은 진행 환경 및 멘토 피드백 일정에 따라 일부 조정될 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

export default function HackathonClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="relative flex-1 bg-white text-[#16140f] min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-[100dvh] w-full overflow-hidden bg-[#16140f] flex flex-col justify-center rounded-none"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(22, 20, 15, 0.45), rgba(22, 20, 15, 0.95)), url('/images/heroes/4.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-['Pretendard',sans-serif] text-[clamp(2.25rem,6vw,5rem)] font-black uppercase tracking-tight text-white leading-none">
            BEGIN THE RACE.<br />
            <span className="text-[#FF6C0F]">TEST THE HYPOTHESIS.</span>
          </h1>
          <p className="mt-6 max-w-[600px] font-['Pretendard',sans-serif] text-sm md:text-lg text-white/80 leading-relaxed font-medium">
            문제 정의부터 가설 검증 결과물 제작까지<br />
            1박 2일 안에 완성하는 SPEC Execution Camp
          </p>
        </div>
      </div>

      {/* Intro Section */}
      <section id="intro" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 overflow-hidden bg-white">
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5">
              <h2 className="font-['Pretendard',sans-serif] text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[#16140f]">
                VALIDATE THE VALUE.<br />
                <span className="text-[#FF6C0F]">MAKE THE LEAP.</span>
              </h2>
            </div>
            <div className="md:col-span-7 bg-white p-6 rounded-lg border border-[#ddd9cc]">
              <p className="font-['Pretendard',sans-serif] text-[18px] leading-[1.8] text-[#16140f] mb-6 font-medium">
                Execution Camp는 문제 정의부터 실제 고객의 반응을 측정할 수 있는 가설 검증 결과물을 1박 2일 동안 완성하는 실전 창업 캠프입니다.
              </p>
              <p className="font-['Pretendard',sans-serif] text-base leading-[1.8] text-[#4a4a40] mb-6">
                단순히 아이디어를 기획하는 것에 머무르지 않고, 고객 인터뷰 질문지, 프리토타입, 페이크도어, 랜딩페이지 등 동작 가능한 검증 도구를 실제로 빌드합니다. 8월 말 피칭 세션까지 이어지는 비즈니스 레이스의 시작점입니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="p-5 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8]">
                  <h4 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] mb-2">
                    실제 고객 반응 측정
                  </h4>
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] leading-relaxed">
                    상상이 아닌 실제 고객의 유입과 응답 데이터를 수집할 수 있는 정량적 검증 체계를 수립합니다.
                  </p>
                </div>
                <div className="p-5 rounded-lg border border-[#ddd9cc] bg-[#fcfcf8]">
                  <h4 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] mb-2">
                    전문가 밀착 멘토링
                  </h4>
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] leading-relaxed">
                    현업 스타트업 창업가 및 멘토진이 밀착 피드백을 통해 가설 수립 및 BM 구조의 완성도를 극대화합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Goals & Deliverables Section */}
      <section className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 bg-[#f5f5ee]/30 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-[#16140f] sm:text-4xl">
              GOALS & DELIVERABLES
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
              캠프 기간 동안 달성해야 할 목표와 최종 제출해야 하는 결과물의 형태
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* 핵심 목표 */}
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-8 flex flex-col justify-between">
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f] mb-6 flex items-center gap-2 pb-2 border-b border-[#ece8db]">
                  <Target className="h-5 w-5 text-[#FF6C0F]" strokeWidth={1.5} />
                  <span>캠프 핵심 목표</span>
                </h3>
                <div className="space-y-4">
                  {[
                    { num: "01", title: "문제 정의 · 솔루션 · BM 구조 정리", desc: "문제가 실재하는지, 솔루션이 해결 가능한지, 수익 구조가 성립하는지 명확히 정리합니다." },
                    { num: "02", title: "가설 검증 방법론 적용", desc: "개념 강의에서 배운 가설 검증 방법론을 각 팀의 아이템에 직접 대입하여 설계합니다." },
                    { num: "03", title: "가설 검증 결과물 완성", desc: "캠프가 종료되는 시점까지 실제 타깃 고객의 반응을 측정할 수 있는 결과물을 완성합니다." }
                  ].map((goal) => (
                    <div key={goal.num} className="flex gap-4 items-start">
                      <span className="font-['Pretendard',sans-serif] text-sm font-black text-[#FF6C0F] bg-[#FF6C0F]/10 px-2 py-0.5 rounded shrink-0">{goal.num}</span>
                      <div>
                        <h4 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{goal.title}</h4>
                        <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-1">{goal.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 최종 산출물 */}
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-8 flex flex-col justify-between">
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f] mb-6 flex items-center gap-2 pb-2 border-b border-[#ece8db]">
                  <CheckCircle2 className="h-5 w-5 text-[#FF6C0F]" strokeWidth={1.5} />
                  <span>최종 산출물 제출 (택 1 이상)</span>
                </h3>
                <div className="space-y-3">
                  {[
                    "고객 인터뷰 질문지 + 섭외 페이지",
                    "프리토타입 (Pretotype)",
                    "페이크도어 (Fake Door)",
                    "랜딩페이지 / 홈페이지",
                    "그 외 실제 고객 반응을 측정할 수 있는 형태"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fcfcf8] border border-[#ece8db]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6C0F]/10 text-[#FF6C0F] font-['Pretendard',sans-serif] text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="relative w-full overflow-hidden bg-[#16140f]" style={{ backgroundColor: "#16140f" }}>
        <div id="timetable" className="relative z-10 mx-auto max-w-[960px] px-6 pt-16 md:pt-24">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-white sm:text-4xl">
              SCHEDULE & VENUE
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-white/75">
              SPEC 4기 Execution Camp를 관통하는 1박 2일의 스케줄과 오시는 길
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
                  2026.06.27 (금) - 2026.06.28 (토)
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-white/75">
                  1박 2일간의 강도 높은 몰입형 런칭 및 가설 검증 스프린트로 진행됩니다.
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
                  성균관대학교 자연과학캠퍼스 유림아트홀
                </p>
                <p className="font-['Pretendard',sans-serif] text-sm text-white/75">
                  문제 정의와 가설 검증을 극대화할 수 있는 창의적인 코워킹 플레이스입니다.
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
              <TimetableColumn label="Day 1" date="6/27 (금)" items={TIMETABLE_DAY1} />
              <TimetableColumn label="Day 2" date="6/28 (토)" items={TIMETABLE_DAY2} showNote />
            </div>
          </div>
        </div>
      </section>

      {/* Partners & FAQ Section */}
      <section id="partners-faq" className="relative w-full overflow-hidden bg-white">
        <div className="relative w-full py-16 md:py-24 bg-white">
          <div className="relative z-10 mx-auto max-w-[960px] px-6">
            <div className="mb-12 text-center">
              <h2 className="font-['Pretendard',sans-serif] text-3xl font-semibold tracking-tight text-[#16140f] sm:text-4xl">
                MENTORS
              </h2>
              <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
                SPEC의 도전적인 가설 검증 여정을 함께 지도해주실 실전 창업 멘토진
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {PARTNERS.map((partner) => (
                <div key={partner.name} className="flex flex-col items-center gap-6 p-6 rounded-lg bg-white border border-[#ddd9cc] text-center">
                  <div className="flex items-center justify-center h-16">
                    <Image
                      src={partner.image.src}
                      alt={partner.image.alt}
                      width={partner.image.width}
                      height={partner.image.height}
                      className={partner.image.className}
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {partner.name}
                    </span>
                    <a
                      href={partner.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-['Pretendard',sans-serif] text-xs text-[#FF6C0F] font-semibold hover:underline"
                    >
                      {partner.linkLabel}
                    </a>
                  </div>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                    {partner.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative w-full py-16 md:py-24 bg-white border-t border-[#ddd9cc]/60">
          <div id="faq" className="relative z-10 mx-auto max-w-[720px] px-6">
            <div className="mb-12 text-center">
              <h2 className="font-['Pretendard',sans-serif] text-3xl font-semibold tracking-tight text-[#16140f]">
                FAQ
              </h2>
              <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
                Execution Camp에 대해 가장 많이 들어오는 질문과 답변
              </p>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.question} className="rounded-lg border border-[#ddd9cc] bg-white overflow-hidden transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="h-5 w-5 text-[#FF6C0F] shrink-0" />
                        <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                          {item.question}
                        </span>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-[#6b6b5e] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`${isOpen ? "max-h-[200px] border-t border-[#ece8db]" : "max-h-0 pointer-events-none"} overflow-hidden transition-all duration-200 ease-in-out`}>
                      <div className="px-4 py-3 bg-[#fcfcf8] font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
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

      {/* Guidelines Section */}
      <section className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 bg-[#f5f5ee]/30">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="rounded-lg border border-[#ddd9cc] bg-[#f5f5ee] p-6 flex items-start gap-4">
            <Clock className="h-5 w-5 text-[#FF6C0F] shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h3 className="font-['Pretendard',sans-serif] text-sm font-bold text-[#16140f] mb-1">
                캠프 진행 및 혜택 안내
              </h3>
              <ul className="list-disc pl-4 space-y-1 font-['Pretendard',sans-serif] text-xs text-[#4a4a40]">
                <li>세션 B 작업 시간 중 야식이 제공됩니다.</li>
                <li>파이널 피칭 시 프리토타입, 페이크도어, 설문조사 페이지 등 실제 고객 반응 측정 도구를 활용하여 팀별 피드백이 즉석으로 제공됩니다.</li>
                <li>1박 2일 몰입 기간 동안 안전에 각별히 유의해 주시기 바랍니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative w-full py-16 md:py-24 bg-white border-t border-[#ddd9cc]/60">
        <div className="mx-auto max-w-[960px] px-6 text-center">
          <h2 className="font-['Pretendard',sans-serif] text-2xl md:text-3xl font-bold text-[#16140f] mb-4">
            가설을 통해 당신의 비즈니스를 증명하세요.
          </h2>
          <p className="font-['Pretendard',sans-serif] text-sm md:text-base text-[#6b6b5e] mb-8 max-w-[600px] mx-auto">
            문제 정의에서 시작해 실질적인 가설 검증 결과물 제작까지, SPEC의 강력한 레이스에 함께 동참하세요.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/curriculum"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#FF6C0F]"
            >
              전체 커리큘럼 보기
            </Link>
            <Link
              href="/profile"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[#ddd9cc] bg-white px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
            >
              내 프로필로 이동
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
