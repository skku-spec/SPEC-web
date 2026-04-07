'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { formatCurriculumDateRange, parseCurriculumDatesForCalendar } from '@/lib/utils/curriculum-dates';
import CurriculumCalendar from '@/components/curriculum/CurriculumCalendar';

interface CurriculumClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialWeeks: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialAreas: any[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _preneurAreas = [
  {
    num: '01',
    title: '조직 운영 & 스케일업',
    subtitle: 'Operations & Scale-up',
    description:
      'SPEC을 하나의 스타트업으로 정의하고 시스템 설계를 주도합니다. 운영 체계화와 문화 구축을 통해 조직의 선행 성장을 최우선으로 실현합니다.',
    activities: [
      'SPEC 내부 운영 프로세스 설계 및 최적화',
      '기수별 온보딩/오프보딩 체계 구축',
      '조직 문화 정의 — 행동 강령, 의사결정 구조 수립',
      'OKR 기반 분기별 목표 설정 및 트래킹',
      '운영 매뉴얼 작성 — 후속 기수를 위한 레거시 구축',
    ],
  },
  {
    num: '02',
    title: '투자사 IR & 파트너십',
    subtitle: 'Investor Relations & Partnerships',
    description:
      '전략적 IR과 파트너십 발굴로 핵심 자원을 확보합니다. 자원 유입을 체계화하여 SPEC이 지속 성장하는 비즈니스 구조를 설계합니다.',
    activities: [
      '투자사/기업 대상 SPEC IR 덱 작성 및 피칭',
      '전략적 파트너십 발굴 — 기업, 대학, 정부 기관',
      '후원 유치 전략 수립 및 실행',
      '외부 협업 프로그램 기획 (해커톤, 공동 세션 등)',
      'SPEC 브랜드 가치 제안 정리 및 커뮤니케이션',
    ],
  },
  {
    num: '03',
    title: 'Learner 서포트 & 멘토링',
    subtitle: 'Learner Support & Mentoring',
    description:
      '밀착 코칭으로 러너의 잠재력을 깨우고 성장을 견인합니다. 지표를 정교하게 트래킹하여 러너와 SPEC의 공동 성공을 실현합니다.',
    activities: [
      'Learner 팀 주간 코칭 세션 운영',
      '오피스아워 — 1:1 멘토링 및 문제 해결',
      'Learner 성장 지표 대시보드 관리 및 분석',
      '외부 멘토 네트워크 연결 — 현직 창업가, VC, 전문가',
      '데모데이 준비 서포트 — 피치 리허설, 자료 검토',
    ],
  },
  {
    num: '04',
    title: '커뮤니티 빌딩',
    subtitle: 'Community Building',
    description:
      '알럼나이 네트워크와 외부 행사를 기획하여 SPEC의 영향력을 넓힙니다. 차별화된 브랜드 빌딩으로 창업 생태계에 SPEC의 존재감을 각인시킵니다.',
    activities: [
      '알럼나이 네트워크 활성화 — 월간 동문 모임, 뉴스레터',
      '외부 행사 기획 및 운영 — 밋업, 네트워킹 이벤트',
      'SPEC 브랜드 관리 — SNS, 콘텐츠 전략',
      '타 창업 커뮤니티와의 교류 및 협업',
      '차기 기수 리쿠르팅 전략 수립 및 실행',
    ],
  },
];

const preneurMilestones = [
  { month: '3월', label: '기수 온보딩 & 조직 셋업' },
  { month: '5월', label: '중간 IR & 파트너 리뷰' },
  { month: '8월', label: 'Learner 데모데이 서포트' },
  { month: '11월', label: '기수 마무리 & 회고' },
];

/* ──────────────────────────────────────────────
   LEARNER TRACK DATA (30 weeks)
   ────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _learnerWeeks = [
  {
    week: 1,
    topic: 'Kickoff',
    objectives: 'SPEC 철학 / 전원 Edge(자기소개) 발표 / 러너 3기 발표 / 아이스브레이킹',
    assignment: '0원',
    notes: '프로그램 시작',
  },
  {
    week: 2,
    topic: '제로투원 챌린지',
    objectives: '제로투원 챌린지 소개 / 돈 버는 100가지 방법 / 팀 배정 / 슬랙, 노션 교육 / 팀별 브레인스토밍 / 아이디어 발표',
    assignment: '매출 자유·자본금 10만원',
    notes: '',
  },
  {
    week: 3,
    topic: '제로투원 챌린지 (성과 공유) / 비즈니스 케이스 스터디',
    objectives: '제로투원 챌린지 성과 공유 / 프리토타입 / 비즈니스 케이스 스터디 / 창업 이론 학습 / 사업 전략 수립',
    assignment: '매출 자유·자본금 10만원',
    notes: '',
  },
  {
    week: 'OFF',
    topic: '1학기 중간고사 OFF',
    objectives: '시험 기간',
    assignment: '-',
    notes: '',
  },
  {
    week: 4,
    topic: '10만원 챌린지',
    objectives: '10만원 챌린지 / 팀 배정 / 아이디어 발표 / 프리토타입 검증 방법 / 피그마 간단 실습',
    assignment: '매출 10만원·자본금 10만원',
    notes: '',
  },
  {
    week: 5,
    topic: '10만원 챌린지 (중간) / 데이터 분석 교육',
    objectives: '10만원 챌린지 / 데이터 분석 교육',
    assignment: '매출 10만원·자본금 10만원',
    notes: '',
  },
  {
    week: 6,
    topic: '10만원 챌린지 (성과 공유) / 30만원 챌린지',
    objectives: '10만원 챌린지 성과 공유 / 30만원 챌린지 / 아이디어 발표',
    assignment: '매출 10만원·자본금 10만원\n매출 30만원·자본금 10만원',
    notes: '',
  },
  {
    week: 7,
    topic: '30만원 챌린지 (중간) / 비즈니스 설계',
    objectives: '30만원 챌린지 / 비즈니스 이해 / 기회 발굴 / 비즈니스 모델 설계',
    assignment: '-',
    notes: '',
  },
  {
    week: 8,
    topic: '30만원 챌린지 (성과 공유) / 인터뷰, 가설 검증 설계',
    objectives: '30만원 챌린지 성과 공유 / 가설 수립 / 인터뷰 / 검증 실험 설계',
    assignment: '-',
    notes: '',
  },
  {
    week: 9,
    topic: '인터뷰 결과 공유',
    objectives: '인터뷰 결과 공유',
    assignment: '-',
    notes: '',
  },
  {
    week: 10,
    topic: 'BOOTCAMP 졸업 & IR 특강',
    objectives: 'BOOTCAMP 졸업 / STARTUP 페이즈 소개 / 아이디어톤 안내 / IR 특강',
    assignment: '-',
    notes: 'BOOTCAMP 졸업',
  },
  {
    week: 'EVENT',
    topic: '아이디어톤',
    objectives: '1박2일 / 아이디어 피칭 + 팀 스피드 데이팅 + 팀 확정 + 48시간 프로젝트',
    assignment: '-',
    notes: '팀 확정',
  },
  {
    week: 'OFF',
    topic: '1학기 기말고사 OFF',
    objectives: '시험 기간',
    assignment: '-',
    notes: '',
  },
  {
    week: 11,
    topic: 'MVP 빌드 전 구체화',
    objectives: 'MVP 정의 / 스프린트 방법론 / DB 설계 기초 / 기능 명세서 / WBS / IA / 화면 설계서 / Jira / Figjam',
    assignment: '-',
    notes: 'MVP 해커톤',
  },
  {
    week: 'EVENT',
    topic: 'MVP 해커톤',
    objectives: 'MVP 완성 스프린트 (1박2일) / 바이브 코딩 교육',
    assignment: '-',
    notes: 'MVP 해커톤',
  },
  {
    week: 12,
    topic: 'MVP 개발 스프린트',
    objectives: '빠른 이터레이션 / API 연동 / 유저 피드백 수집',
    assignment: '-',
    notes: '',
  },
  {
    week: 13,
    topic: '런칭',
    objectives: '런칭의 기술 (온/오프라인/하이브리드) / 배포 및 모니터링',
    assignment: '만원',
    notes: '',
  },
  {
    week: 14,
    topic: '그로스 해킹과 유닛 이코노믹스',
    objectives: '그로스 해킹 / 유닛 이코노믹스 / 획득 비용 (CAC) / 생애 가치 (LTV) / AARRR 퍼널 분석',
    assignment: '만원',
    notes: '연합 활동',
  },
  {
    week: 15,
    topic: '데이터 기반 의사결정 (리텐션)',
    objectives: '데이터 기반 의사결정 / 리텐션 차트 분석 / 이탈 지점 파악 / 코호트 분석 기법',
    assignment: '만원',
    notes: '',
  },
  {
    week: 16,
    topic: '피봇팅(Pivoting)의 기술',
    objectives: '피보팅 기술 / 가설 실패를 인정하는 법 / 핵심 가치만 남기고 깎아내기',
    assignment: '만원',
    notes: '',
  },
  {
    week: 'EVENT',
    topic: 'Demo Eve 밤샘',
    objectives: '중간 데모데이 전야제 / 피칭 리허설 / 외부 심사위원 피칭',
    assignment: '-',
    notes: '중간 데모데이 & 서울대 창업동아리와 합동 데모데이',
  },
  {
    week: 17,
    topic: '유료 마케팅과 콘텐츠 전략',
    objectives: '유로 마케팅 / 콘텐츠 전략 / Meta/Google 광고 기초 / 고효율 소재 제작 / AB 테스트',
    assignment: '3만원',
    notes: 'Demo Eve 밤샘 (8/13)',
  },
  {
    week: 18,
    topic: '바이럴 루프와 커뮤니티 빌딩',
    objectives: '바이럴 루프 / 커뮤니티 빌딩 / 유저가 유저를 불러오는 장치 설계 / 초기 팬덤 형성 전략',
    assignment: '3만원',
    notes: '',
  },
  {
    week: 19,
    topic: '운영 자동화와 No-Code 확장',
    objectives: '운영 자동화 / No-Code 확장 / 반복적인 CS / 운영 업무 자동화(Zapier, Make 활용)',
    assignment: '3만원',
    notes: '',
  },
  {
    week: 20,
    topic: '중간 점검 : Death Valley 생존 보고',
    objectives: '지표가 안 나오는 이유 처절하게 분석하기 (Self-Roasting)',
    assignment: '3만원',
    notes: '연합 활동',
  },
  {
    week: 21,
    topic: 'B2B 영업 및 제휴 전략',
    objectives: '스케일링이란? / 병목 지점 찾기 / 자동화 심화',
    assignment: '10만원',
    notes: '',
  },
  {
    week: 22,
    topic: '수익모델 구체화',
    objectives: '구독 서비스 vs 건당 결제 / 가격 심리학과 수익 극대화 / 수익모델 구체화',
    assignment: '10만원',
    notes: '',
  },
  {
    week: 23,
    topic: '고객 경험(CX)과 브랜드 보이스',
    objectives: '고객 경험(CX) / 브랜드 보이스',
    assignment: '10만원',
    notes: '연합 활동',
  },
  {
    week: 24,
    topic: '법률 및 세무 기초',
    objectives: '법인 설립 / 주주간 계약서 / 저작권 / 개인정보보호법',
    assignment: '10만원',
    notes: '',
  },
  {
    week: 'OFF',
    topic: '2학기 중간고사 OFF',
    objectives: '시험 기간',
    assignment: '-',
    notes: '',
  },
  {
    week: 25,
    topic: 'Product-Market Fit (PMF) 검증',
    objectives: 'Sean Ellis 테스트 / 재구매율, 재방문율 기반 PMF 판단',
    assignment: '30만원',
    notes: '연합 활동',
  },
  {
    week: 26,
    topic: '조직 관리와 채용',
    objectives: '초기 팀 빌딩 전략 / 컬처 핏(Culture Fit) 정의 / 면접',
    assignment: '30만원',
    notes: '',
  },
  {
    week: 27,
    topic: '최종 데모데이 리허설',
    objectives: '5분 피칭 / 3분 Q&A 대응 전략 / 시각 자료 시인성 개선',
    assignment: '30만원',
    notes: 'Final 해커톤 (11/7-8)',
  },
  {
    week: 'EVENT',
    topic: 'Final 해커톤',
    objectives: '최종 데모데이 준비 (1박2일) / 피칭 리허설',
    assignment: '-',
    notes: 'Final 해커톤',
  },
  {
    week: 28,
    topic: '최종 데모데이',
    objectives: '최종 리허설 / Q&A 마지막 준비 / 데모데이 당일 흐름',
    assignment: '100만원',
    notes: '최종 데모데이 & 연고대 창업동아리와 합동 진행',
  },
  {
    week: 29,
    topic: '회고 + 네트워킹',
    objectives: 'SPEC 4기 전체 회고 / 다음 단계 안내 / 알럼나이 네트워크',
    assignment: '100만원',
    notes: '',
  },
  {
    week: 30,
    topic: 'After SPEC',
    objectives: '스타트업 다음 단계 / 알럼나이 혜택 / 수료식',
    assignment: '지속',
    notes: '프로그램 종료',
  },
];

type Track = 'preneur' | 'learner' | 'vcc';

export default function CurriculumClient({ initialWeeks, initialAreas }: CurriculumClientProps) {
  const [activeTrack, setActiveTrack] = useState<Track>('preneur');

  return (
    <main className="flex-1 px-4 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[1100px]">
        <PageHeader
          title="Curriculum"
          subtitle="Preneur · Learner · VCC — SPEC을 이끄는 세 가지 트랙. 3월부터 11월까지."
        />

        {/* ── Track Switcher ── */}
        <div className="mb-14 flex justify-center">
          <div className="inline-flex rounded-full border border-[#d9d9cc] bg-white p-1">
            {([
              { key: 'preneur' as Track, label: 'Preneur Track' },
              { key: 'learner' as Track, label: 'Learner Track' },
              { key: 'vcc' as Track, label: 'VCC' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTrack(tab.key)}
                className={`rounded-full px-6 py-2.5 font-['Pretendard',sans-serif] text-[15px] font-semibold tracking-tight transition-all ${activeTrack === tab.key
                  ? 'bg-[#16140f] text-[#f5f5ee]'
                  : 'text-[#16140f]/60 hover:text-[#16140f]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTrack === 'preneur' && <PreneurTrack areas={initialAreas} />}
        {activeTrack === 'learner' && <LearnerTrack weeks={initialWeeks} />}
        {activeTrack === 'vcc' && <VccTrack />}

        {/* ── Bottom CTA ── */}
        <div className="mt-20 flex flex-col items-center gap-4 border-t border-[#d9d9cc] pt-16">
          <p
            className="font-['MaruBuri',serif] text-lg text-[#16140f]/70"
          >
            준비가 되셨다면, 지금 지원하세요.
          </p>
          <Link
            href="/apply"
            className="inline-flex h-[60px] items-center rounded-full bg-[#16140f] px-10 pb-0.5 font-['MaruBuri',serif] text-[22px] italic tracking-[0.01em] text-[#f5f5ee] transition-opacity hover:opacity-80"
          >
            지원하기 &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────
   PRENEUR TRACK VIEW
   ────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PreneurTrack({ areas }: { areas: any[] }) {
  return (
    <div>
      <div className="mb-16 border-l-4 border-[#FF6C0F] pl-6">
        <p
          className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-black uppercase leading-tight tracking-tight text-[#16140f]"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          SPEC 자체가 우리의 스타트업이다.
        </p>
        <p className="mt-2 font-['MaruBuri',serif] text-[16px] leading-relaxed text-[#16140f]/60">
          Preneur는 SPEC을 운영하고 성장시키는 리더십 트랙입니다.<br />
          조직의 스케일업과 파트너십 확대를 설계하며, Learner의 여정을 밀착 서포트합니다. | 2026.03 — 2026.11
        </p>
      </div>

      <div className="mb-12 grid grid-cols-2 md:grid-cols-4 divide-x divide-[#d9d9cc] rounded-lg border border-[#d9d9cc] bg-[#f5f5ee]">
        {preneurMilestones.map((ms) => (
          <div key={ms.month} className="flex flex-col items-center justify-center px-2 py-4">
            <span
              className="text-sm font-black uppercase tracking-tight text-[#FF6C0F]"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {ms.month}
            </span>
            <span className="mt-1 text-center font-['Pretendard',sans-serif] text-xs text-[#16140f]/50">
              {ms.label}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {areas.map((area) => (
          <div
            key={area.num}
            className="rounded-lg border border-[#d9d9cc] bg-white p-6 md:p-8"
          >
            <div className="mb-4 flex flex-wrap items-baseline gap-3">
              <span
                className="text-[clamp(2rem,4vw,3rem)] font-black leading-none tracking-tighter text-[#16140f]/10"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {area.num}
              </span>
            </div>

            <h3
              className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-black uppercase leading-tight tracking-tight text-[#16140f]"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {area.title}
            </h3>

            <p className="mt-1 font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#FF6C0F]">
              {area.subtitle}
            </p>

            <p className="mt-3 font-['MaruBuri',serif] text-[16px] leading-[1.75] text-[#16140f]/70">
              {area.description}
            </p>

            <ul className="mt-5 space-y-2">
              {area.activities.map((item: string, j: number) => (
                <li
                  key={j}
                  className="flex items-start gap-2.5 font-['MaruBuri',serif] text-[15px] leading-[1.6] text-[#16140f]/80"
                >
                  <span className="mt-[9px] block h-1 w-1 shrink-0 rounded-full bg-[#FF6C0F]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <p
          className="mb-6 text-center text-xs font-bold uppercase tracking-[0.25em] text-[#16140f]/40"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Preneur Core Values
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[
            { title: 'OWNERSHIP', desc: 'SPEC은 내 스타트업이다' },
            { title: 'SCALE', desc: '매 기수, 더 크게 성장' },
            { title: 'SUPPORT', desc: 'Learner의 성공이 곧 우리의 성공' },
            { title: 'LEGACY', desc: '다음 세대를 위한 시스템 구축' },
          ].map((value) => (
            <div
              key={value.title}
              className="rounded-lg border border-[#d9d9cc] bg-[#f5f5ee] p-4 text-center"
            >
              <h4
                className="text-sm font-black uppercase tracking-wide text-[#16140f] md:text-base"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {value.title}
              </h4>
              <p className="mt-2 font-['MaruBuri',serif] text-sm text-[#16140f]/50">
                {value.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   LEARNER TRACK VIEW
   ────────────────────────────────────────────── */

function VccTrack() {
  return (
    <div>
      <div className="mb-16 border-l-4 border-[#FF6C0F] pl-6">
        <p
          className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-black uppercase leading-tight tracking-tight text-[#16140f]"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Venture Creation Course
        </p>
        <p className="mt-2 font-['MaruBuri',serif] text-[16px] leading-relaxed text-[#16140f]/60">
          RISE 사업단 &times; 카카오모빌리티 &times; SPEC 합동 프로그램.<br />
          모빌리티·라이프스타일 영역에서 실제 벤처를 만들어 냅니다.
          SPEC 소속이면 누구나 수강 가능합니다.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap items-center gap-4">
        <Image src="/images/logos/rise.png" alt="RISE 사업단" width={240} height={84} className="h-20 w-auto object-contain" />
        <span className="font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/30">×</span>
        <Image src="/images/logos/kakao.svg" alt="Kakao Mobility" width={100} height={28} className="h-7 w-auto object-contain" />
        <span className="font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/30">×</span>
        <Image src="/images/logos/spec.svg" alt="SPEC" width={120} height={42} className="h-10 w-auto object-contain" />
      </div>

      <div className="mb-6 rounded-lg border border-[#FF6C0F]/15 bg-[#FF6C0F]/[0.03] p-5">
        <p className="font-['Pretendard',sans-serif] text-[14px] font-medium leading-relaxed text-[#16140f]/70">
          <span className="font-semibold text-[#FF6C0F]">수강 자격 :</span>{' '}
          SPEC 소속 전원 (Learner · Pre-Learner · Preneur). Learner 트랙
          커리큘럼과 VCC 커리큘럼을 동시에 수강할 수 있습니다.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-2 md:grid-cols-4 divide-x divide-[#d9d9cc] rounded-lg border border-[#d9d9cc] bg-[#f5f5ee]">
        {[
          { month: '4월', label: '문제 정의 & 팀 빌딩' },
          { month: '6월', label: '프로토타입 완성' },
          { month: '9월', label: 'MVP & 시장 검증' },
          { month: '11월', label: '합동 데모데이' },
        ].map((ms) => (
          <div key={ms.month} className="flex flex-col items-center justify-center px-2 py-4">
            <span
              className="text-sm font-black uppercase tracking-tight text-[#FF6C0F]"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {ms.month}
            </span>
            <span className="mt-1 text-center font-['Pretendard',sans-serif] text-xs text-[#16140f]/50">
              {ms.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Image
          src="/images/common/vcc-poster.jpeg"
          alt="Venture Creation Course 포스터"
          width={800}
          height={1131}
          className="w-full max-w-2xl rounded-xl shadow-lg"
          priority
        />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LearnerTrack({ weeks }: { weeks: any[] }) {
  return (
    <div>
      <div className="mb-16 border-l-4 border-[#FF6C0F] pl-6">
        <p
          className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-black uppercase leading-tight tracking-tight text-[#16140f]"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          10만 원부터 시작해서 수억을 만든다.
        </p>
        <p className="mt-2 font-['MaruBuri',serif] text-[16px] leading-relaxed text-[#16140f]/60">
          교실을 넘어 현장에서 매출로 증명하며 비즈니스의 본질을 체득합니다.<br />
          10만 원의 첫 수익에서 시작해 수억 원의 가치를 향한 폭발적 성장을 일궈냅니다.
        </p>
      </div>
        <div className="mb-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-[#d9d9cc] rounded-lg border border-[#d9d9cc] bg-[#f5f5ee]">
        {[
          { month: '3월', label: '프로그램 시작 & 첫 매출' },
          { month: '6월', label: '아이디어톤 & MVP 해커톤' },
          { month: '8월', label: '중간 데모데이' },
          { month: '11월', label: '최종 데모데이' },
        ].map((ms) => (
          <div key={ms.month} className="flex flex-col items-center justify-center px-2 py-4">
            <span
              className="text-sm font-black uppercase tracking-tight text-[#FF6C0F]"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {ms.month}
            </span>
            <span className="mt-1 text-center font-['Pretendard',sans-serif] text-xs text-[#16140f]/50">
              {ms.label}
            </span>
          </div>
        ))}
      </div>


      <div
        className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full min-w-[540px] border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-[#16140f]">
              <th className="sticky left-0 z-10 w-[72px] bg-[#16140f] px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70">
                STEP
              </th>
              <th className="w-[120px] px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70">
                날짜
              </th>
              <th className="w-[160px] px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70">
                주제
              </th>
              <th className="px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70">
                실행 목표
              </th>
              <th className="w-[220px] px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70">
                챌린지 KPI
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {weeks.map((row, i) => {
              const isNewSection = i % 2 === 0 && i > 0;
              return (
                <tr
                  key={`${row.week}-${i}`}
                  className={`border-t transition-colors hover:bg-[#FF6C0F]/[0.03] ${isNewSection ? 'border-t-[#d9d9cc]' : 'border-t-[#d9d9cc]/50'
                    } ${i % 2 === 0 ? 'bg-white' : 'bg-[#f5f5ee]/50'}`}
                >
                  {/* Week number — sticky on mobile */}
                  <td
                    className={`sticky left-0 z-10 px-4 py-3.5 font-['Pretendard',sans-serif] text-[14px] font-bold tabular-nums text-[#16140f] ${i % 2 === 0 ? 'bg-white' : 'bg-[#f5f5ee]/50'
                      }`}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#16140f]/5 text-[12px] font-bold">
                      {row.week}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] whitespace-nowrap">
                    {formatCurriculumDateRange(row.start_date, row.end_date)}
                  </td>

                  {/* Topic */}
                  <td className="px-4 py-3.5 font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#16140f]">
                    {row.topic}
                  </td>

                  {/* Learning Objectives */}
                  <td className="px-4 py-3.5 font-['MaruBuri',serif] text-[14px] leading-[1.6] text-[#16140f]/70">
                    {row.objectives}
                  </td>

                  {/* Assignment */}
                  <td className="whitespace-pre-line px-4 py-3.5 font-['MaruBuri',serif] text-[14px] leading-[1.6] text-[#16140f]/70">
                    {row.assignment}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/30">
          총 {weeks.length}주 실전 커리큘럼 &middot; 3월–11월 코호트
        </p>
        <p className="font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/30">
          * 매출 목표는 팀별로 조정될 수 있습니다
        </p>
      </div>

      {/* ── Calendar View ── */}
      <div className="mt-8">
        <CurriculumCalendar events={parseCurriculumDatesForCalendar(weeks)} />
      </div>
    </div>
  );
}
