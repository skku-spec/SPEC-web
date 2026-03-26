"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarDays, ChevronRight, Flame, Users } from "lucide-react";
import { getEventsByBatch } from "@/lib/actions/spec-log";

type SpecEvent = {
  id: string;
  title: string;
  description: string;
  batch: string;
  status: string;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator: { id: string; name: string } | null;
  logCount: number;
  participantCount: number;
  recentAuthors: { name: string }[];
};

type Props = {
  initialEvents: SpecEvent[];
  batches: string[];
  defaultBatch: string;
  currentUser: { name: string } | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  active: {
    label: "진행 중",
    bg: "bg-[#E6F9E6]",
    text: "text-[#2f9e44]",
    border: "border-l-2 border-l-[#2f9e44]",
  },
  upcoming: {
    label: "예정",
    bg: "bg-[#E8F0FE]",
    text: "text-[#2563EB]",
    border: "border-l-2 border-l-[#2563EB]",
  },
  closed: {
    label: "종료",
    bg: "bg-[#f0efe6]",
    text: "text-[#6b6b5e]",
    border: "",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function SpecLogListClient({
  initialEvents,
  batches,
  defaultBatch,
  currentUser,
}: Props) {
  const [selectedBatch, setSelectedBatch] = useState(defaultBatch);
  const [events, setEvents] = useState<SpecEvent[]>(initialEvents);
  const [isPending, startTransition] = useTransition();
  void currentUser;

  function handleBatchChange(batch: string) {
    if (batch === selectedBatch) return;
    setSelectedBatch(batch);
    startTransition(async () => {
      const result = await getEventsByBatch(batch);
      if (result.success && result.data) {
        setEvents(result.data);
      }
    });
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10 sm:py-16">
      <h1 className="mb-2 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
        SPEC 로그
      </h1>
      <p className="mb-8 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
        SPEC의 굵직한 행사들을 함께 기록하고, 서로의 성장을 응원하는
        공간입니다.
      </p>

      <div className="mb-8 flex items-center gap-1 border-b border-[#ece8db]">
        {batches.map((batch) => (
          <button
            key={batch}
            type="button"
            onClick={() => handleBatchChange(batch)}
            className={`relative px-4 py-2.5 font-['Pretendard',sans-serif] text-sm font-medium transition-colors ${
              selectedBatch === batch
                ? "text-[#FF6C0F]"
                : "text-[#6b6b5e] hover:text-[#16140f]"
            }`}
          >
            {batch}
            {selectedBatch === batch && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#FF6C0F]" />
            )}
          </button>
        ))}
      </div>

      <div
        className={`space-y-4${isPending ? " opacity-60 transition-opacity" : ""}`}
      >
        {events.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
              {selectedBatch}에 등록된 이벤트가 없습니다.
            </p>
          </div>
        )}

        {events.map((event) => {
          const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.closed;

          return (
            <Link
              key={event.id}
              href={`/spec-log/${event.id}`}
              className={`group block rounded-lg border border-[#ddd9cc] bg-white p-5 transition-colors hover:border-[#FF6C0F]/30${status.border ? ` ${status.border}` : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2.5">
                    <h2 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
                      {event.title}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="mb-3 line-clamp-2 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      <CalendarDays
                        className="h-3.5 w-3.5"
                        strokeWidth={2}
                      />
                      {formatDate(event.start_date)} ~{" "}
                      {formatDate(event.end_date)}
                    </span>

                    {event.logCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                        <Flame className="h-3.5 w-3.5" strokeWidth={2} />
                        {event.logCount}개 로그
                      </span>
                    )}

                    {event.participantCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                        <Users className="h-3.5 w-3.5" strokeWidth={2} />
                        {event.participantCount}명 참여
                      </span>
                    )}
                  </div>

                  {event.recentAuthors.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {event.recentAuthors.slice(0, 4).map((author) => (
                          <div
                            key={author.name}
                            className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#e8e6dc] font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#4a4a40]"
                            title={author.name}
                          >
                            {getInitial(author.name)}
                          </div>
                        ))}
                        {event.recentAuthors.length > 4 && (
                          <div className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#e8e6dc] font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#4a4a40]">
                            +{event.recentAuthors.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                        최근 활동
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight
                  className="mt-1 h-5 w-5 shrink-0 text-[#ddd9cc] transition-colors group-hover:text-[#FF6C0F]"
                  strokeWidth={2}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
