"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const CATEGORIES = [
  { id: "general", label: "일반" },
  { id: "program", label: "프로그램" },
  { id: "apply", label: "지원" },
  { id: "vcc", label: "VCC" },
  { id: "other", label: "기타" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

interface QA {
  question: string;
  answer: React.ReactNode;
}

function FAQSection({ items }: { items: QA[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i}>
          <p className="mb-2 font-['Pretendard',sans-serif] text-lg font-medium leading-[1.7] text-[#16140f]">
            {item.question}
          </p>
          <div className="mb-8 font-['MaruBuri',serif] text-[17px] font-normal leading-[1.75] text-[#16140f]">
            {item.answer}
          </div>
        </div>
      ))}
    </div>
  );
}

const generalQA: QA[] = [
  {
    question: "SPEC이 뭔가요?",
    answer: (
      <p>
        SPEC은 성균관대학교 창업 학회입니다. 30주 동안 매주 매출 챌린지를 수행하며 실전 창업의 모든 과정을 경험합니다.
      </p>
    ),
  },
  {
    question: "SPEC은 동아리인가요?",
    answer: (
      <p>
        학교 동아리가 아닙니다. SPEC은 실제 매출을 만들어내는 창업 부트캠프입니다. 매주 매출 보드가 공개되고, 데모데이에서 투자자 앞에 섭니다.
      </p>
    ),
  },
  {
    question: "한 기수에 몇 명이 활동하나요?",
    answer: (
      <p>
        기수당 약 30~40명이 활동합니다. 선발 과정을 통해 창업 의지와 실행력이 검증된 멤버만 합류합니다.
      </p>
    ),
  },
  {
    question: "활동 기간은 얼마나 되나요?",
    answer: (
      <p>
        30주(약 7.5개월)입니다. Phase 1(10주) 매출 챌린지 → Phase 2(18주) 스타트업 운영 → Phase 3(2주) 데모데이 및 회고.
      </p>
    ),
  },
  {
    question: "비용이 있나요?",
    answer: (
      <p>
        활동비가 있습니다. 정확한 금액은 모집 공고를 참고해주세요.
      </p>
    ),
  },
];

const programQA: QA[] = [
  {
    question: "매출 챌린지가 뭔가요?",
    answer: (
      <p>
        매주 팀 단위로 실제 매출을 만들어내는 미션입니다. Phase 1에서는 10만원부터 시작해 200만원까지, Phase 2에서는 확정팀으로 실제 사업을 운영하며 스케일합니다.
      </p>
    ),
  },
  {
    question: "팀은 어떻게 구성되나요?",
    answer: (
      <p>
        Phase 1에서는 매주 팀이 셔플됩니다. 다양한 사람과 협업하며 나와 맞는 공동창업자를 찾습니다. Phase 1 마지막 Ideathon에서 최종 팀이 확정됩니다.
      </p>
    ),
  },
  {
    question: "개발을 못해도 되나요?",
    answer: (
      <p>
        됩니다. SPEC에는 개발자, 디자이너, 기획자, 마케터 등 다양한 배경의 멤버가 있습니다. 바이브코딩을 통해 비개발자도 직접 MVP를 만들 수 있습니다.
      </p>
    ),
  },
  {
    question: "VCC가 뭔가요?",
    answer: (
      <p>
        Venture Creation Course의 약자로, 성균관대 RISE 사업단과 SPEC이 공동 운영하는 미니 MBA 프로그램입니다. 비즈니스 모델링부터 IR 피칭까지 체계적으로 학습합니다. 자세한 내용은 <Link href="/vcc" className="text-[#16140f] underline hover:text-[#FF6C0F]">VCC 페이지</Link>를 참고해주세요.
      </p>
    ),
  },
  {
    question: "멘토링은 어떻게 진행되나요?",
    answer: (
      <p>
        카카오모빌리티를 포함한 주요 기업 현직자들이 멘토로 참여합니다. 격주 1:1 오피스아워와 그룹 세션을 통해 실무 관점의 피드백을 제공합니다.
      </p>
    ),
  },
  {
    question: "데모데이는 뭔가요?",
    answer: (
      <p>
        30주 프로그램의 마지막에 투자자, 기업 관계자, 동문 앞에서 팀의 사업을 발표하는 행사입니다.
      </p>
    ),
  },
];

const applyQA: QA[] = [
  {
    question: "누가 지원할 수 있나요?",
    answer: (
      <p>
        성균관대학교 재학생이면 누구나 지원할 수 있습니다. 학년, 전공 제한은 없습니다.
      </p>
    ),
  },
  {
    question: "창업 경험이 없어도 되나요?",
    answer: (
      <p>
        됩니다. 대부분의 멤버가 SPEC에서 처음 창업을 경험합니다. 중요한 것은 경험이 아니라 의지와 실행력입니다.
      </p>
    ),
  },
  {
    question: "선발 기준이 뭔가요?",
    answer: (
      <p>
        창업에 대한 진지한 의지, 팀워크 능력, 실행력을 중점적으로 봅니다. 화려한 스펙보다 진짜 무언가를 만들어내겠다는 각오가 중요합니다.
      </p>
    ),
  },
  {
    question: "지원서에는 뭘 쓰면 되나요?",
    answer: (
      <p>
        본인 소개, 창업에 관심을 갖게 된 계기, SPEC에서 이루고 싶은 것, 그리고 현재 가지고 있는 아이디어(있다면)를 써주세요.
      </p>
    ),
  },
  {
    question: "면접은 어떻게 진행되나요?",
    answer: (
      <p>
        서류 합격자에 한해 대면 면접을 진행합니다. 약 15~20분간 창업 의지와 실행력에 대해 이야기합니다. 결과는 면접 후 1주일 이내에 통보됩니다.
      </p>
    ),
  },
  {
    question: "재지원이 가능한가요?",
    answer: (
      <p>
        가능합니다. 이전에 불합격했더라도 다시 지원할 수 있습니다. 지난 지원 이후 어떤 성장이 있었는지 보여주세요.
      </p>
    ),
  },
];

const vccQA: QA[] = [
  {
    question: "VCC와 SPEC은 어떤 관계인가요?",
    answer: (
      <p>
        VCC는 성균관대 RISE 사업단이 주관하고 SPEC이 공동 운영하는 정규 교육 프로그램입니다. SPEC 활동과 시너지를 내어 이론과 실전을 병행합니다.
      </p>
    ),
  },
  {
    question: "VCC만 따로 참여할 수 있나요?",
    answer: (
      <p>
        VCC는 SPEC 멤버를 대상으로 운영됩니다. SPEC에 합류하면 자동으로 VCC에도 참여하게 됩니다.
      </p>
    ),
  },
  {
    question: "학점이 인정되나요?",
    answer: (
      <p>
        성균관대 RISE 사업단을 통해 학점 인정이 가능합니다. 자세한 사항은 모집 공고를 참고해주세요.
      </p>
    ),
  },
];

const otherQA: QA[] = [
  {
    question: "SPEC 이름의 뜻은?",
    answer: (
      <p>
         SPEC은 &apos;SKKU Prep Entrepreneurs&apos; Club&apos;의 약자입니다.
      </p>
    ),
  },
  {
    question: "졸업 후에도 관계가 유지되나요?",
    answer: (
      <p>
        네. SPEC 알럼나이 네트워크를 통해 졸업 후에도 창업 여정을 함께합니다. 월간 동문 모임, 후배 멘토링 등으로 영원히 연결됩니다.
      </p>
    ),
  },
  {
    question: "문의는 어디로 하나요?",
    answer: (
      <p>
        spec@skku.edu로 이메일을 보내주세요.
      </p>
    ),
  },
];

const categoryContent: Record<CategoryId, { title: string; items: QA[] }> = {
  general: { title: "General", items: generalQA },
  program: { title: "Program", items: programQA },
  apply: { title: "Apply", items: applyQA },
  vcc: { title: "VCC", items: vccQA },
  other: { title: "Other", items: otherQA },
};

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<CategoryId>("general");

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-14 md:pt-20">
      <PageHeader title="FAQ" align="center" />

      <div className="mx-auto max-w-[720px]">
        <nav className="mb-10 border-b border-[#d4d4cc]">
          <ul className="-mb-px flex gap-0 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-4 py-3 font-['Pretendard',sans-serif] text-sm font-normal transition-colors ${
                    activeTab === cat.id
                      ? "border-b-2 border-[#16140f] text-[#16140f]"
                      : "text-[#16140f]/60 hover:text-[#16140f]"
                  }`}
                >
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <article>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={activeTab === cat.id ? "block" : "hidden"}
            >
              <h2 className="mb-6 font-['Pretendard',sans-serif] text-[1.375rem] font-bold leading-[28px] text-[#16140f]">
                {categoryContent[cat.id].title}
              </h2>
              <FAQSection items={categoryContent[cat.id].items} />
            </div>
          ))}
        </article>
      </div>
    </div>
  );
}
