'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/lib/utils/curriculum-dates';

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthTitle(year: number, month: number): string {
  return `${year}년 ${month + 1}월`;
}

function formatRange(e: CalendarEvent): string {
  if (!e.endDate) return '';
  const sm = e.date.getMonth() + 1;
  const sd = e.date.getDate();
  const em = e.endDate.getMonth() + 1;
  const ed = e.endDate.getDate();
  if (sm === em) return `${sm}/${sd}–${ed}`;
  return `${sm}/${sd}–${em}/${ed}`;
}

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function pillClass(label: string): string {
  const base =
    "rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold truncate cursor-pointer transition-colors";
  if (/off/i.test(label)) {
    return `${base} bg-[#f0efe6] text-[#6b6b5e]`;
  }
  if (/event/i.test(label)) {
    return `${base} bg-[#E8F0FE] text-[#2563EB]`;
  }
  return `${base} bg-[#FFF0E5] text-[#FF6C0F]`;
}

interface CurriculumCalendarProps {
  events: CalendarEvent[];
}

export default function CurriculumCalendar({ events }: CurriculumCalendarProps) {
  const initialDate = useMemo(() => {
    if (events.length > 0) {
      const first = events[0].date;
      return { year: first.getFullYear(), month: first.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [events]);

  const [year, setYear] = useState(initialDate.year);
  const [month, setMonth] = useState(initialDate.month);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const goPrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
    setExpandedKey(null);
  }, []);

  const goNext = useCallback(() => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
    setExpandedKey(null);
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of events) {
      if (e.date.getFullYear() === year && e.date.getMonth() === month) {
        const day = e.date.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(e);
      }
    }
    return map;
  }, [events, year, month]);

  const hasEvents = eventsByDay.size > 0;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
  const leadingBlanks = firstDay;

  const totalCells = leadingBlanks + daysInMonth;
  const trailingBlanks = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  const today = new Date();

  return (
    <div
      className="rounded-lg border border-[#ddd9cc] bg-white"
      data-testid="curriculum-calendar"
    >
      {/* ── Header: nav ── */}
      <div className="flex items-center justify-between border-b border-[#ece8db] px-4 py-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="이전 달"
          className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f0efe6]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        <h2
          className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]"
          data-testid="calendar-month-title"
        >
          {formatMonthTitle(year, month)}
        </h2>

        <button
          type="button"
          onClick={goNext}
          aria-label="다음 달"
          className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#f0efe6]"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 border-b border-[#ece8db]">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="px-1 py-2 text-center font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]"
            data-testid="day-header"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Grid body ── */}
      {hasEvents ? (
        <div className="grid grid-cols-7">
          {/* leading blanks (prev month) */}
          {Array.from({ length: leadingBlanks }, (_, i) => {
            const dayNum = prevDays - leadingBlanks + 1 + i;
            return (
              <div
                key={`prev-${dayNum}`}
                className="min-h-[72px] border-b border-r border-[#ece8db] p-1.5"
              >
                <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]/30">
                  {dayNum}
                </span>
              </div>
            );
          })}

          {/* actual days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const cellDate = new Date(year, month, dayNum);
            const isToday = sameDay(cellDate, today);
            const dayEvents = eventsByDay.get(dayNum) || [];
            const visibleEvents = dayEvents.slice(0, 2);
            const overflow = dayEvents.length - 2;

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[72px] border-b border-r border-[#ece8db] p-1.5 ${
                  isToday ? 'ring-2 ring-inset ring-[#FF6C0F]' : ''
                }`}
                data-testid={`day-cell-${dayNum}`}
              >
                <span
                  className={`mb-1 inline-block font-['Pretendard',sans-serif] text-xs font-semibold ${
                    isToday ? 'text-[#FF6C0F]' : 'text-[#16140f]'
                  }`}
                >
                  {dayNum}
                </span>

                <div className="flex flex-col gap-0.5">
                  {visibleEvents.map((e) => {
                    const key = `${dayNum}-${e.weekLabel}`;
                    const isExpanded = expandedKey === key;
                    const rangeStr = formatRange(e);

                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedKey(isExpanded ? null : key)
                          }
                          className={`${pillClass(e.weekLabel)} w-full text-left`}
                          data-testid="event-pill"
                          aria-expanded={isExpanded}
                        >
                          {e.weekLabel}
                          {rangeStr && (
                            <span className="ml-1 opacity-60">
                              {rangeStr}
                            </span>
                          )}
                        </button>

                        {isExpanded && (
                          <div
                            className="mt-1 rounded-md bg-[#f5f5ee] px-2 py-1.5 font-['Pretendard',sans-serif] text-xs leading-relaxed text-[#4a4a40]"
                            data-testid="event-detail"
                          >
                            {e.topic}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {overflow > 0 && (
                    <span className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">
                      +{overflow} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* trailing blanks (next month) */}
          {Array.from({ length: trailingBlanks }, (_, i) => {
            const dayNum = i + 1;
            return (
            <div
              key={`next-${dayNum}`}
              className="min-h-[72px] border-b border-r border-[#ece8db] p-1.5"
            >
              <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]/30">
                {dayNum}
              </span>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-12 text-center" data-testid="empty-month">
          <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            이 달에는 일정이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
