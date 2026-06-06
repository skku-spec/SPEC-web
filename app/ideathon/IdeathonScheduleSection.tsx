import { Calendar, Info, MapPin } from "lucide-react";

type TimetableItem = {
  readonly time: string;
  readonly programs: readonly [string, ...string[]];
  readonly details?: readonly string[];
};

type TimetableColumnProps = {
  readonly label: string;
  readonly date: string;
  readonly items: readonly TimetableItem[];
  readonly showNote?: boolean;
};

const TIMETABLE_DAY1: readonly TimetableItem[] = [
  {
    time: "12:00 ~ 13:00",
    programs: [
      "출석 (luma QR 이용)",
      "참가자 집합 및 행사 안내",
      "프러너",
      "공간 사용 안내 및 알파브라더스 소개",
    ],
    details: [
      "전체 일정, 운영 방식, 팀빌딩/발표 기준 안내",
      "프러너 소개: 아이디어톤 페이지에 띄워두고 1분 자기 소개",
    ],
  },
  {
    time: "13:00 ~ 14:30",
    programs: ["아이디어 개별/자유 피칭"],
    details: ["개별 아이디어 또는 관심 문제를 짧게 공유하고 팀빌딩 후보를 형성 (1인당 5분 피칭 + 3분 QA)"],
  },
  {
    time: "14:30 ~ 15:00",
    programs: ["휴식 및 팀빌딩 준비"],
    details: ["아이디어 분류, 관심 팀 후보 정리, 스피드 데이팅 준비"],
  },
  {
    time: "15:00 ~ 17:00",
    programs: ["팀 스피드 데이팅 및 팀빌딩"],
    details: ["관심 아이디어별 대화 후 팀 구성 확정"],
  },
  {
    time: "17:00 ~ 18:00",
    programs: ["팀 회의"],
    details: ["팀별 아이디어 문제 정의, 타깃 고객, 해결 방식, 초기 검증 방향 구체화 정리"],
  },
  {
    time: "18:00 ~ 19:00",
    programs: ["저녁 식사"],
    details: ["배달 식사 제공 및 멘토링 세션 준비"],
  },
  {
    time: "19:00 ~ 19:05",
    programs: ["오프닝 및 멘토 소개"],
    details: ["멘토 소개, 세션 목적, 진행 방식 안내"],
  },
  {
    time: "19:05 ~ 19:35",
    programs: ["멘토 창업 스토리 공유"],
    details: ["이정민 대표·배지현 변리사 각 15분 내외로 경험과 관점 공유"],
  },
  { time: "19:35 ~ 19:50", programs: ["질의 응답"] },
  {
    time: "19:50 ~ 20:50",
    programs: ["팀별 간단 피칭 및 멘토 피드백"],
    details: [
      "팀별 핵심 아이디어 공유 후 사업성·실행 가능성·권리화 관점 피드백",
      "각 팀 총 10분씩 (3분 발표, 7분 피드백)피드백",
    ],
  },
  {
    time: "20:50 ~ 21:00",
    programs: ["마무리 코멘트"],
    details: ["공통 피드백 정리 및 Day 2 발표 준비 방향 안내"],
  },
  {
    time: "21:00 ~",
    programs: ["야식 및 팀별 자율 작업"],
    details: ["팀별 피드백 반영 및 자유 작업"],
  },
];

const TIMETABLE_DAY2: readonly TimetableItem[] = [
  {
    time: "09:00 ~ 10:00",
    programs: ["아침 식사 및 팀별 최종 작업"],
    details: ["아침 배달 식사 제공, 전날 피드백 반영 사항 점검, 발표 자료 구조 확정, 팀별 리허설"],
  },
  {
    time: "10:00 ~ 11:20",
    programs: ["팀별 최종 발표"],
    details: ["팀별 발표 진행 및 질의응답", "각팀 10분 (7분 발표 + 3분 QA)"],
  },
  {
    time: "11:20 ~ 11:50",
    programs: ["심사위원 Q&A 및 총평"],
    details: ["전체 질의응답, 공통 피드백, 후속 실행 방향 코멘트"],
  },
  {
    time: "11:50 ~ 12:10",
    programs: ["시상 및 마무리"],
    details: ["우수 팀 발표, 행사 회고, 후속 일정 안내"],
  },
];

function TimetableColumn({ label, date, items, showNote = false }: TimetableColumnProps) {
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
            세부 시간은 공간 사용 가능 시간과 멘토/심사위원 일정에 따라 일부 조정될 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

export function IdeathonScheduleSection() {
  return (
    <section id="schedule" className="relative w-full overflow-hidden" style={{ backgroundColor: "#16140f" }}>
      <div id="timetable" className="relative z-10 mx-auto max-w-[960px] px-6 pt-16 md:pt-24">
        <div className="mb-12 text-center">
          <h2 className="font-['Pretendard',sans-serif] text-3xl font-bold tracking-tight text-white sm:text-4xl">
            SCHEDULE & VENUE
          </h2>
          <p className="mt-3 font-['Pretendard',sans-serif] text-base text-white/75">
            SPEC 4기 아이디어톤을 관통하는 1박 2일의 스케줄과 오시는 길
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
                2026.06.06 (토) - 2026.06.07 (일)
              </p>
              <p className="font-['Pretendard',sans-serif] text-sm text-white/75">
                1박 2일간의 강도 높은 몰입형 팀 빌딩 및 피칭 스프린트로 진행됩니다.
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
                알파브러더스 사무실
              </p>
              <p className="font-['Pretendard',sans-serif] text-sm text-white/75">
                아이디어 구체화와 협업을 극대화할 수 있는 창의적인 코워킹 플레이스입니다.
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
            <TimetableColumn label="Day 1" date="6/6 (토)" items={TIMETABLE_DAY1} />
            <TimetableColumn label="Day 2" date="6/7 (일)" items={TIMETABLE_DAY2} showNote />
          </div>
        </div>
      </div>
    </section>
  );
}
