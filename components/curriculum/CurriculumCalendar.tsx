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

function formatAgendaDate(d: Date): string {
  const dayName = DAY_HEADERS[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} ${dayName}`;
}

type CalendarDayEntry = CalendarEvent & {
  isMultiDay: boolean;
  isVisualStart: boolean;
  isVisualEnd: boolean;
};

function pillClass(label: string): string {
  const base =
    "rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold line-clamp-2 cursor-pointer transition-colors";
  if (/off/i.test(label)) {
    return `${base} bg-[#f0efe6] text-[#6b6b5e]`;
  }
  if (/event/i.test(label)) {
    return `${base} bg-[#E8F0FE] text-[#2563EB]`;
  }
  return `${base} bg-[#FFF0E5] text-[#FF6C0F]`;
}

function barColor(label: string): string {
  if (/off/i.test(label)) return 'bg-[#f0efe6] text-[#6b6b5e]';
  if (/event/i.test(label)) return 'bg-[#E8F0FE] text-[#2563EB]';
  return 'bg-[#FFF0E5] text-[#FF6C0F]';
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
    const map = new Map<number, CalendarDayEntry[]>();
    const monthDays = getDaysInMonth(year, month);
    const monthFirstDay = getFirstDayOfWeek(year, month);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, monthDays);

    for (const e of events) {
      const startDate = e.date;
      const endDate = e.endDate;
      const isMultiDay = !!(endDate && !sameDay(startDate, endDate));

      if (isMultiDay) {
        // Skip events that don't overlap with current month
        if (startDate > monthEnd || endDate! < monthStart) continue;
        // Clamp iteration range to current month
        const rangeStart = startDate < monthStart ? monthStart : startDate;
        const rangeEnd = endDate! > monthEnd ? monthEnd : endDate!;
        const cursor = new Date(rangeStart);
        while (cursor <= rangeEnd) {
          const day = cursor.getDate();
          const col = (monthFirstDay + day - 1) % 7;
          const isActualStart = sameDay(cursor, startDate);
          const isActualEnd = sameDay(cursor, endDate!);
          if (!map.has(day)) map.set(day, []);
          map.get(day)!.push({
            ...e,
            isMultiDay: true,
            isVisualStart: isActualStart || col === 0 || day === 1,
            isVisualEnd: isActualEnd || col === 6 || day === monthDays,
          });
          cursor.setDate(cursor.getDate() + 1);
        }
      } else {
        // Single-day event
        if (startDate.getFullYear() === year && startDate.getMonth() === month) {
          const day = startDate.getDate();
          if (!map.has(day)) map.set(day, []);
          map.get(day)!.push({
            ...e,
            isMultiDay: false,
            isVisualStart: true,
            isVisualEnd: true,
          });
        }
      }
    }
    return map;
  }, [events, year, month]);

  const monthAgendaEvents = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const mDays = getDaysInMonth(year, month);
    const monthEnd = new Date(year, month, mDays);

    return events
      .filter((e) => {
        const end = e.endDate || e.date;
        return e.date <= monthEnd && end >= monthStart;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
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
      <div className="hidden sm:grid sm:grid-cols-7 border-b border-[#ece8db]">
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
        <>
        <div className="hidden sm:grid sm:grid-cols-7">
          {/* leading blanks (prev month) */}
          {Array.from({ length: leadingBlanks }, (_, i) => {
            const dayNum = prevDays - leadingBlanks + 1 + i;
            return (
              <div
                key={`prev-${dayNum}`}
                className="min-h-[90px] border-b border-r border-[#ece8db] p-1.5"
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
            const sorted = [...dayEvents].sort((a, b) =>
              (b.isMultiDay ? 1 : 0) - (a.isMultiDay ? 1 : 0)
            );
            const visibleEvents = sorted.slice(0, 3);
            const overflow = sorted.length - 3;

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[90px] border-b border-r border-[#ece8db] p-1.5 ${
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
                  {visibleEvents.map((entry) => {
                    if (entry.isMultiDay) {
                      const radius =
                        entry.isVisualStart && entry.isVisualEnd
                          ? 'rounded-md'
                          : entry.isVisualStart
                            ? 'rounded-l-md'
                            : entry.isVisualEnd
                              ? 'rounded-r-md'
                              : '';

                      return (
                        <div
                          key={`${dayNum}-${entry.weekLabel}-bar`}
                          className="-mx-1.5"
                        >
                          <div
                            className={`flex h-6 items-center ${barColor(entry.weekLabel)} ${radius} font-['Pretendard',sans-serif] text-xs font-semibold`}
                            title={`${entry.weekLabel} — ${entry.topic}`}
                            data-testid={entry.isVisualStart ? 'event-pill' : 'event-bar'}
                          >
                            {entry.isVisualStart && (
                              <span className="truncate pl-2 pr-1">
                                {entry.weekLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    const key = `${dayNum}-${entry.weekLabel}`;
                    const isExpanded = expandedKey === key;
                    const rangeStr = formatRange(entry);

                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedKey(isExpanded ? null : key)
                          }
                          className={`${pillClass(entry.weekLabel)} w-full text-left`}
                          data-testid="event-pill"
                          aria-expanded={isExpanded}
                          title={`${entry.weekLabel} — ${entry.topic}`}
                        >
                          {entry.weekLabel}
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
                            {entry.topic}
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
              className="min-h-[90px] border-b border-r border-[#ece8db] p-1.5"
            >
              <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]/30">
                {dayNum}
              </span>
            </div>
            );
          })}
        </div>

        {/* ── Mobile agenda view ── */}
        <div className="sm:hidden" data-testid="mobile-agenda">
          {monthAgendaEvents.map((entry, idx) => {
            const isOff = /off/i.test(entry.weekLabel);
            const isEvent = /event/i.test(entry.weekLabel);

            if (isOff || isEvent) {
              const rangeStr =
                entry.endDate && !sameDay(entry.date, entry.endDate)
                  ? formatRange(entry)
                  : formatAgendaDate(entry.date);
              return (
                <div
                  key={`agenda-${entry.weekLabel}-${entry.date.getTime()}`}
                  className={`border-b border-[#ece8db] px-3 py-2.5 ${
                    isOff ? 'bg-[#f0efe6]' : 'bg-[#E8F0FE]'
                  }`}
                  data-testid="agenda-event"
                >
                  <p
                    className={`rounded-md px-3 py-2 font-['Pretendard',sans-serif] text-xs font-semibold ${
                      isOff ? 'text-[#6b6b5e]' : 'text-[#2563EB]'
                    }`}
                  >
                    {rangeStr}
                    {' · '}
                    {entry.topic || entry.weekLabel}
                  </p>
                </div>
              );
            }

            const dateStr =
              entry.endDate && !sameDay(entry.date, entry.endDate)
                ? formatRange(entry)
                : formatAgendaDate(entry.date);

            return (
              <div
                key={`agenda-${entry.weekLabel}-${entry.date.getTime()}`}
                className="flex items-start border-b border-[#ece8db] px-3 py-2.5"
                data-testid="agenda-event"
              >
                <span className="w-16 shrink-0 pt-0.5 font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                  {dateStr}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                    {entry.weekLabel}
                  </p>
                  {entry.topic && (
                    <p className="line-clamp-1 font-['Pretendard',sans-serif] text-xs text-[#4a4a40]">
                      {entry.topic}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
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
