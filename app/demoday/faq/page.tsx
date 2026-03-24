import type { Metadata } from "next";
import Link from "next/link";
import { getAllFaqItems } from "@/lib/actions/faq";

export const metadata: Metadata = {
  title: "Demo Day FAQ | SPEC",
  description:
    "SPEC 데모데이에 관한 자주 묻는 질문과 답변. 행사 일정, 초대장, 참관 신청 등의 정보.",
};

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQSection {
  id: string;
  title: string;
  items: FAQItem[];
}

const FALLBACK_FAQ_SECTIONS: FAQSection[] = [
  {
    id: "the-basics",
    title: "기본 정보",
    items: [
      {
        question: "데모데이는 무엇인가요?",
        answer:
          "SPEC 데모데이는 우리 창업학회의 현기수 스타트업 팀들이 투자자, 멘토, 업계 관계자들에게 자신의 사업을 발표하는 행사입니다. 대면 행사로 진행되며, 약 100~150명의 참석자들이 팀들의 5분 발표를 듣고 개별 미팅을 진행합니다.",
      },
      {
        question: "데모데이는 언제 열리나요?",
        answer:
          "데모데이는 각 기수의 마지막 주에 개최됩니다. 정확한 일정은 SPEC 공식 홈페이지와 SNS를 통해 공지되며, 보통 오후 시간대에 진행됩니다.",
      },
      {
        question: "데모데이에는 누가 참석하나요?",
        answer:
          "엔젤 투자자, 벤처캐피탈, 산업별 전문가 멘토, SPEC 동문, 그리고 창업에 관심 있는 사람들이 참석합니다. 참관을 원하시는 분들은 사전 신청이 필요합니다.",
      },
      {
        question: "참관 신청은 어떻게 하나요?",
        answer:
          "데모데이 참관을 원하시면 demoday@spec-skku.org로 이메일을 보내주시거나, 행사 2주 전에 공지되는 신청 링크를 통해 신청하실 수 있습니다.",
      },
      {
        question: "온라인으로 시청할 수 있나요?",
        answer:
          "네, 데모데이는 라이브 스트리밍으로 진행될 예정입니다. 현장 참석이 어려우신 분들도 온라인으로 팀들의 발표를 실시간 시청하실 수 있습니다.",
      },
      {
        question: "모든 팀이 발표하나요?",
        answer:
          "네, SPEC 프로그램을 완주한 모든 팀이 데모데이에서 발표합니다.",
      },
    ],
  },
  {
    id: "for-investors",
    title: "투자자를 위한 정보",
    items: [
      {
        question: "데모데이에서 바로 투자 제안을 할 수 있나요?",
        answer:
          "데모데이는 팀들을 소개하고 첫 인상을 주는 자리입니다. 본격적인 투자 논의는 데모데이 이후 개별 미팅을 통해 진행됩니다.",
      },
      {
        question: "투자자 초대장은 어떻게 받나요?",
        answer:
          "SPEC은 활발하게 스타트업에 투자하고 있는 투자자들을 우선적으로 초대합니다. 초대장이 필요하신 경우 demoday@spec-skku.org로 연락주세요.",
      },
      {
        question: "데모데이 이후 팀과 미팅은 어떻게 일정을 잡나요?",
        answer:
          "행사 당일 관심 있는 팀들을 표시하면, SPEC에서 양쪽의 일정을 조율하여 개별 미팅을 주선해드립니다.",
      },
      {
        question: "팀들의 배경 정보나 사업 자료를 미리 받을 수 있나요?",
        answer:
          "네, 데모데이 1주일 전에 참여 팀들의 기본 정보와 1-page 요약 자료를 제공해드립니다. 더 자세한 정보가 필요하시면 직접 요청하실 수 있습니다.",
      },
    ],
  },
  {
    id: "for-founders",
    title: "창업팀을 위한 정보",
    items: [
      {
        question: "발표 시간은 얼마나 되나요?",
        answer:
          "각 팀당 총 5분(3분 발표 + 2분 Q&A)이 주어집니다. 시간을 초과하면 사회자의 신호에 따라 중단되므로, 꼭 시간 관리를 철저히 하세요.",
      },
      {
        question: "슬라이드는 몇 장까지 준비해야 하나요?",
        answer:
          "정해진 규칙은 없지만, 5분 안에 발표할 수 있도록 10~15장 정도를 권장합니다. 각 슬라이드당 약 20초 정도를 할당하되, 중요한 부분에는 더 시간을 쓰세요.",
      },
      {
        question: "어떤 순서로 이야기해야 좋을까요?",
        answer:
          "일반적으로 문제 → 솔루션 → 시장 → 견인력(Traction) → 팀 → Ask 순서가 좋습니다. 청중이 당신의 비전을 따라올 수 있도록 논리적인 흐름을 만드세요.",
      },
      {
        question: "기술이나 제품을 자세히 설명해야 하나요?",
        answer:
          "투자자들은 HOW보다는 WHY에 더 관심을 가집니다. 당신의 솔루션이 문제를 어떻게 해결하는지는 중요하지만, 기술 깊이는 개별 미팅에서 이야기하세요.",
      },
    ],
  },
];

export default async function DemoDayFAQPage() {
  // Fetch FAQ items from DB
  const result = await getAllFaqItems();
  const faqItems = result.data ?? [];

  // Group items by section
  const sections = faqItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = { title: item.section_title, items: [] };
    }
    acc[item.section].items.push(item);
    return acc;
  }, {} as Record<string, { title: string; items: typeof faqItems }>);

  // If DB is empty, use hardcoded fallback
  const hasFaqData = faqItems.length > 0;
  const displaySections = hasFaqData
    ? Object.entries(sections).map(([id, data]) => ({
        id,
        title: data.title,
        items: data.items.map((item) => ({
          question: item.question,
          answer: item.answer,
        })),
      }))
    : FALLBACK_FAQ_SECTIONS;

  return (
    <div className="flex-1 px-4 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[1100px]">
        <h1 className="mb-10 text-center font-[system-ui] text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.15] tracking-tight uppercase text-[#16140f]" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
           Demo Day FAQ
         </h1>

        <div className="flex flex-col gap-12 md:flex-row">
          <nav className="shrink-0 md:sticky md:top-24 md:w-[170px] md:self-start">
            <ul className="flex gap-3 md:flex-col md:gap-1">
              {displaySections.map((section) => (
                <li key={section.id}>
                   <a
                     href={`#${section.id}`}
                     className="block rounded-md px-3 py-2 font-['Pretendard',sans-serif] text-[14px] font-medium text-[#16140f]/60 transition-colors hover:bg-[#16140f]/5 hover:text-[#16140f]"
                   >
                     {section.title}
                   </a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0 flex-1">
            {displaySections.map((section, sectionIndex) => (
              <section
                key={section.id}
                id={section.id}
                className={sectionIndex > 0 ? "mt-12" : ""}
              >
                 <h2 className="mb-6 font-[system-ui] text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#16140f]">
                   {section.title}
                 </h2>

                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={`${section.id}-${itemIndex}`}
                      className="border-b border-[#16140f]/8 pb-6 last:border-0"
                    >
                      <h3 className="mb-3 font-['Pretendard',sans-serif] text-[16px] font-semibold leading-snug text-[#16140f]">
                         {item.question}
                       </h3>
                       <div className="font-['MaruBuri',serif] text-[15px] font-normal leading-[1.7] text-[#16140f]/80">
                         {item.answer}
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
