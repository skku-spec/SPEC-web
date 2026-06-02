"use client";

import Image from "next/image";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

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
    answer: "상세 주소 및 오시는 길 정보는 SPEC 4기 공식 커뮤니티 채널을 통해 행사 1주일 전 안내해 드립니다.",
  },
  {
    question: "행사는 무박으로 진행되나요?",
    answer: "네, 1박 2일 몰입형 프로그램으로 진행됩니다. 몰입을 극대화하기 위한 작업 공간과 식사, 간식, 음료가 준비됩니다.",
  },
] as const;

const PARTNERS = [
  {
    name: "알파브라더스",
    href: "https://www.alphabrothers.co.kr/",
    linkLabel: "공식 웹사이트",
    image: { src: "/images/logos/alphabrothers.png", alt: "알파브라더스", width: 48, height: 48, className: "h-12 w-12 object-contain" },
    description: "검증된 방법론을 바탕으로 혁신 기업의 시작과 성장을 설계하고 조력하는 전문 빌더사입니다. 본 행사 개최 공간 및 실무 멘토링을 제공합니다.",
  },
  {
    name: "배지헌 변리사",
    href: "https://www.linkedin.com/in/%EB%B0%B0%EC%A7%80%ED%97%8C/",
    linkLabel: "LinkedIn 프로필",
    image: { src: "/images/logos/jiheon.jpeg", alt: "배지헌 변리사", width: 64, height: 64, className: "object-cover h-16 w-16 rounded-full border border-[#ddd9cc]" },
    description: "특허법인 윌러의 파트너 변리사입니다. 스타트업 비즈니스의 지식재산권 보호와 특허 출원 전략을 지원합니다.",
  },
  {
    name: "이정민 대표 (Tony Lee)",
    href: "https://www.linkedin.com/in/jyoung105/",
    linkLabel: "LinkedIn 프로필",
    image: { src: "/images/logos/jungmin.png", alt: "이정민 대표", width: 64, height: 64, className: "object-cover h-16 w-16 rounded-full border border-[#ddd9cc]" },
    description: "AI 솔로 빌더이자 ABLD의 설립자입니다. 생성형 AI 모델 활용, 멀티 에이전트 시스템 설계 및 스타트업 실행 전략 멘토링을 제공합니다.",
  },
] as const;

export default function IdeathonPartnersFaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="partners-faq" className="relative w-full overflow-hidden">
      <div className="relative w-full py-16 md:py-24 bg-white">
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-semibold tracking-tight text-[#16140f] sm:text-4xl">
              PARTNERS
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-base text-[#6b6b5e]">
              SPEC의 도전적인 여정을 함께 지원하는 든든한 조력자
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

      <div className="relative w-full py-16 md:py-24 bg-white">
        <div id="faq" className="relative z-10 mx-auto max-w-[720px] px-6">
          <div className="mb-12 text-center">
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-semibold tracking-tight text-[#16140f]">
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
  );
}
