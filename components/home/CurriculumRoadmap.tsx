'use client';

import { startTransition, useEffect, useRef, useState } from 'react';

const phases = [
  {
    num: '01',
    weeks: 'W1 – W10',
    motto: '팔아라. 만들지 마라.',
    mottoEn: 'SELL FIRST. BUILD NEVER.',
    subtitle: 'BOOTCAMP — 돈 버는 감각 익히기',
    description:
      '매주 팀을 셔플하며 10만원부터 시작. 아이디어가 아닌 실제 매출로 증명하는 10주.',
    items: [
      '제로투원 챌린지 → 10만원 챌린지 → 30만원 챌린지',
      '매주 팀 셔플 — 공동창업자 찾기',
      '비즈니스 케이스 스터디 & 가설 검증 인터뷰',
      'IR 특강 & 아이디어톤 (1박2일) → 팀 확정',
    ],
    kpi: '₩0 → ₩300K',
  },
  {
    num: '02',
    weeks: 'W11 – W20',
    motto: '숫자는 거짓말하지 않는다.',
    mottoEn: 'BUILD & GROW.',
    subtitle: 'MVP 빌드 → 런칭 → 성장',
    description:
      '확정된 팀으로 3주 안에 MVP 런칭, 이후 그로스 해킹·마케팅·자동화로 반복 매출을 만든다.',
    items: [
      'MVP 정의 → 개발 스프린트 → 3주 만에 런칭',
      '그로스 해킹 & 유닛 이코노믹스 (CAC/LTV)',
      '피봇팅 · 유료 마케팅 · 바이럴 루프 · 운영 자동화',
      'Death Valley 중간 점검 — 지표 Self-Roasting',
    ],
    kpi: '₩10K → ₩30K',
  },
  {
    num: '03',
    weeks: 'W21 – W28',
    motto: '스케일하거나, 죽거나.',
    mottoEn: 'SCALE OR DIE.',
    subtitle: '스케일업 → 데모데이',
    description:
      'B2B 영업, 수익모델 구체화, PMF 검증을 거쳐 최종 데모데이에서 투자자 앞에 선다.',
    items: [
      'B2B 영업 & 수익모델 구체화 (구독 vs 건당)',
      '고객 경험(CX) · 법률/세무 · PMF 검증',
      '조직 관리 & 채용 전략',
      '최종 데모데이 리허설 → Final 해커톤 → 데모데이',
    ],
    kpi: '₩100K → Demo Day',
  },
  {
    num: '04',
    weeks: 'W29 – W30',
    motto: '네트워크가 곧 프로덕트다.',
    mottoEn: 'THE NETWORK IS THE PRODUCT.',
    subtitle: 'CONNECT — 회고와 연결',
    description:
      '데모데이 이후 전체 회고, 알럼나이 네트워크 합류. 평생 파운더 커뮤니티로 연결.',
    items: [
      '전체 회고 & 다음 단계 안내',
      '알럼나이 네트워크 합류',
      '스타트업 다음 단계 & 수료식',
    ],
    kpi: 'Demo Day → Alumni',
  },
];

const specialEvents = [
  { name: 'IDEATHON', tag: '1박2일', desc: 'Team formation' },
  { name: 'MVP HACKATHON', tag: '1박2일', desc: 'Build sprint' },
  { name: 'DEMO EVE', tag: '밤샘', desc: 'Pitch rehearsal' },
  { name: 'FINAL HACKATHON', tag: '1박2일', desc: 'Final push' },
];

function useSectionVisible(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => {
            setVisible(true);
          });
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export default function CurriculumRoadmap() {
  const { ref, visible } = useSectionVisible(0.08);
  const [openPhase, setOpenPhase] = useState<number | null>(0);

  return (
    <section
      ref={ref}
      className="relative w-full py-16 md:py-24 lg:py-36"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* Header */}
        <div className="mb-12 md:mb-20 text-center">
          <span className="inline-block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
            Learner Track Curriculum
          </span>

          <h2 className="mt-5 font-['Outfit',sans-serif] text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white lg:text-7xl">
            30 WEEKS.
            <br className="md:hidden" />{' '}
            <span className="text-[#FF6C0F]">ZERO EXCUSES.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl font-['Pretendard',sans-serif] text-lg leading-relaxed text-white/50 lg:text-xl">
            4단계 실전 커리큘럼 — 매주 매출로 증명하는 30주
          </p>

          {/* Week count strip */}
          <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-white/10 sm:rounded-full sm:border sm:border-white/10 sm:bg-white/[0.02]">
            {[
              { label: 'W1–10', text: 'Bootcamp' },
              { label: 'W11–20', text: 'Build & Grow' },
              { label: 'W21–28', text: 'Scale' },
              { label: 'W29–30', text: 'Connect' },
            ].map((seg) => (
              <div key={seg.label} className="flex flex-col items-center justify-center py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 sm:text-xs">
                  {seg.label}
                </span>
                <span className="mt-0.5 text-[10px] text-white/45 sm:text-xs">
                  {seg.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phases */}
        <div className="relative">
          {phases.map((phase, i) => {
            const isOpen = openPhase === i;
            return (
            <div key={phase.num} className="relative flex gap-4 pb-16 last:pb-0 md:gap-8 lg:gap-10">
              {/* Timeline spine */}
                <div className="relative flex flex-col items-center">
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/20 md:h-16 md:w-16">
                  <span className="font-['Outfit',sans-serif] text-base font-black tracking-tight text-white/70 md:text-lg">
                    {phase.num}
                  </span>
                </div>
                {i < phases.length - 1 && (
                  <div className="w-px flex-1 bg-white/10" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1 rounded-lg border border-white/8 bg-transparent p-4 sm:p-6 md:p-8">
                {/* Card header — tappable on mobile */}
                <button
                  type="button"
                  className="flex w-full items-start justify-between text-left md:pointer-events-none"
                  onClick={() => setOpenPhase(isOpen ? null : i)}
                >
                  <div className="min-w-0">
                    <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/60">
                      {phase.weeks}
                    </span>

                    <h3 className="mt-3 font-['Outfit',sans-serif] text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
                      {phase.mottoEn}
                    </h3>
                  </div>

                  {/* Chevron — mobile only */}
                  <svg
                    className={`mt-3 h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 md:hidden ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expandable content — always visible on md+, collapsible on mobile */}
                <div
                  className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out md:!max-h-none md:!opacity-100 ${
                    isOpen ? 'max-h-[600px] opacity-100 mt-1.5' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-white/40">
                    {phase.motto}
                  </p>

                  <p className="mt-1.5 font-['Pretendard',sans-serif] text-base font-semibold text-white/70">
                    {phase.subtitle}
                  </p>

                  <p className="mt-3 font-['Pretendard',sans-serif] text-sm leading-relaxed text-white/70 md:text-base">
                    {phase.description}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {phase.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 font-['Pretendard',sans-serif] text-sm text-white/70 md:text-base">
                        <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* KPI — always visible */}
                <div className={`text-sm font-semibold text-[#FF6C0F]/70 ${isOpen ? 'mt-4' : 'mt-3'} md:mt-5 md:text-white/50`}>
                  {phase.kpi}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Special Events */}
        <div className="mt-20">
          <p className="mb-6 text-center font-['Outfit',sans-serif] text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Special Events
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {specialEvents.map((event) => (
              <div
                key={event.name}
                className="rounded-lg border border-white/8 bg-transparent p-4 text-center md:p-5"
              >
                <h4 className="font-['Outfit',sans-serif] text-sm font-black uppercase tracking-wide text-white md:text-base">
                  {event.name}
                </h4>
                <span className="mt-1.5 inline-block rounded-full bg-white/5 px-2.5 py-0.5 font-['Pretendard',sans-serif] text-xs font-medium text-white/60">
                  {event.tag}
                </span>
                <p className="mt-2 text-sm text-white/60">
                  {event.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
