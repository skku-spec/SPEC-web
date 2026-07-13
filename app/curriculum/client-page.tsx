'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, List } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { formatCurriculumDateRange, parseCurriculumDatesForCalendar } from '@/lib/utils/curriculum-dates';
import CurriculumCalendar from '@/components/curriculum/CurriculumCalendar';

interface CurriculumClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialWeeks: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialAreas: any[];
}

const preneurMilestones = [
  { month: '3월', label: '기수 온보딩 & 조직 셋업' },
  { month: '5월', label: '중간 IR & 파트너 리뷰' },
  { month: '8월', label: 'Learner 데모데이 서포트' },
  { month: '11월', label: '기수 마무리 & 회고' },
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
        <div className="mb-14 flex justify-center overflow-x-auto pb-1">
          <div className="grid w-full max-w-[520px] grid-cols-3 rounded-lg border border-[#ddd9cc] bg-white p-1">
            {([
              { key: 'preneur' as Track, label: 'Preneur Track' },
              { key: 'learner' as Track, label: 'Learner Track' },
              { key: 'vcc' as Track, label: 'VCC' },
            ]).map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTrack(tab.key)}
                className={`min-w-0 rounded-md px-2 py-2.5 font-['Pretendard',sans-serif] text-xs font-semibold tracking-tight transition-colors sm:px-4 sm:text-[15px] ${activeTrack === tab.key
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
            className="inline-flex min-h-12 items-center rounded-md bg-[#16140f] px-4 pb-0.5 font-['MaruBuri',serif] text-lg italic tracking-[0.01em] text-[#f5f5ee] transition-opacity hover:opacity-80 sm:h-[60px] sm:px-10 sm:text-[22px]"
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
              {area.activities.map((item: string) => (
                <li
                  key={item}
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
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

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
      <div className="mb-10 grid grid-cols-2 divide-x divide-[#d9d9cc] rounded-lg border border-[#d9d9cc] bg-[#f5f5ee] md:grid-cols-4">
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

      <div className="mb-4 flex gap-1.5">
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={viewMode === 'table'
            ? "inline-flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white"
            : "inline-flex h-8 items-center gap-1.5 rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#6b6b5e] hover:bg-[#f0efe6]"
          }
        >
          <List className="h-4 w-4" />
          목록
        </button>
        <button
          type="button"
          onClick={() => setViewMode('calendar')}
          className={viewMode === 'calendar'
            ? "inline-flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white"
            : "inline-flex h-8 items-center gap-1.5 rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#6b6b5e] hover:bg-[#f0efe6]"
          }
        >
          <CalendarDays className="h-4 w-4" />
          캘린더
        </button>
      </div>

      {viewMode === 'table' && (
        <>
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
                  <th className="min-w-[200px] px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70">
                    주제
                  </th>
                  <th className="hidden px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70 md:table-cell">
                    실행 목표
                  </th>
                  <th className="hidden w-[220px] px-4 py-3 text-left font-['Pretendard',sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#f5f5ee]/70 md:table-cell">
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
                      key={`${row.week}-${row.topic}-${row.start_date ?? ''}-${row.end_date ?? ''}`}
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
                      <td className="whitespace-nowrap px-4 py-3.5 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                        {formatCurriculumDateRange(row.start_date, row.end_date)}
                      </td>

                      {/* Topic */}
                      <td className="px-4 py-3.5 font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f] md:text-[14px]">
                        {row.topic}
                      </td>

                      {/* Learning Objectives */}
                      <td className="hidden px-4 py-3.5 font-['MaruBuri',serif] text-[14px] leading-[1.6] text-[#16140f]/70 md:table-cell">
                        {row.objectives}
                      </td>

                      {/* Assignment */}
                      <td className="hidden whitespace-pre-line px-4 py-3.5 font-['MaruBuri',serif] text-[14px] leading-[1.6] text-[#16140f]/70 md:table-cell">
                        {row.assignment}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/30">
              총 {weeks.length}주 실전 커리큘럼 &middot; 3월–11월 코호트
            </p>
            <p className="font-['Pretendard',sans-serif] text-[13px] text-[#16140f]/30">
              * 매출 목표는 팀별로 조정될 수 있습니다
            </p>
          </div>
        </>
      )}

      {viewMode === 'calendar' && (
        <div className="mt-8">
          <CurriculumCalendar events={parseCurriculumDatesForCalendar(weeks)} />
        </div>
      )}
    </div>
  );
}
