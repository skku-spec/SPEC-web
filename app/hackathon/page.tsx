import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { Target, CheckCircle2, Calendar, LayoutGrid, ClipboardList, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "SPEC Execution Camp | SPEC",
  description:
    "문제 정의부터 가설 검증 결과물 제작까지를 1박 2일 안에 완료하는 SPEC Execution Camp",
};

const DAY1_TIMETABLE = [
  { time: "12:00", session: "킥오프", content: "행사 컨셉 · 레이스 · 진행 방식 안내", leader: "" },
  { time: "14:00", session: "세션 A 멘토링", content: "문제 정의 / 솔루션 / BM 멘토링", leader: "" },
  { time: "16:00", session: "멘토 네트워킹", content: "멘토 개별 네트워킹 (멘토 참석 시)", leader: "" },
  { time: "17:00", session: "세션 A 작업", content: "팀별 문제 정의 · 솔루션 · BM 정리 및 회의", leader: "" },
  { time: "18:00", session: "저녁 식사", content: "—", leader: "" },
  { time: "19:00", session: "세션 A 작업 (계속)", content: "팀별 문제 정의 · 솔루션 · BM 정리 및 회의", leader: "" },
  { time: "20:00", session: "세션 A 중간 피칭", content: "문제 정의 / 솔루션 / BM 발표 · 피드백", leader: "" },
  { time: "21:00", session: "세션 B 멘토링", content: "가설 검증 방법 / KPI 설정 / 로드맵 멘토링", leader: "" },
  { time: "23:00", session: "세션 B 작업", content: "팀별 가설 검증 방식 적용 및 결과물 제작 (야식 제공)", leader: "" },
];

const DAY2_TIMETABLE = [
  { time: "08:00", session: "파이널 피칭 · 피드백", content: "가설 검증 방식 + 결과물 발표 · 팀별 즉석 피드백 (프리토타입 / 페이크도어 / 설문조사 페이지 등)", leader: "" },
  { time: "10:00", session: "정리 및 퇴실", content: "—", leader: "" },
];

export default function HackathonPage() {
  return (
    <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-10 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[960px] px-6">
        <PageHeader 
          title="SPEC Execution Camp" 
          subtitle="문제 정의부터 가설 검증 결과물 제작까지, 1박 2일간의 실전 액션 캠프"
        />
        
        <article className="mx-auto max-w-[720px] space-y-16">
          {/* 개요 */}
          <section className="space-y-4">
            <h2 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#FF6C0F]" strokeWidth={1.5} />
              <span>캠프 개요</span>
            </h2>
            <div className="space-y-4">
              <p className="font-['Pretendard',sans-serif] font-medium text-[18px] leading-[1.8] text-[#16140f]">
                {"문제 정의부터 가설 검증 결과물 제작까지를 1박 2일 안에 완료하는 것이 목표입니다."}
              </p>
              <p className="font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.7] text-[#4a4a40]">
                {"8월 말 피칭 세션까지 이어지는 레이스의 시작점으로, 이 캠프에서 각 팀은 실제 고객 반응을 측정할 수 있는 결과물을 완성합니다."}
              </p>
            </div>
          </section>

          {/* 목표 */}
          <section className="space-y-6">
            <h2 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#FF6C0F]" strokeWidth={1.5} />
              <span>핵심 목표</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-5">
                <div className="mb-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">GOAL 01</div>
                <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] leading-relaxed">
                  문제 정의 · 솔루션 · BM 구조 정리
                </h3>
              </div>
              <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-5">
                <div className="mb-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">GOAL 02</div>
                <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] leading-relaxed">
                  가설 검증 방법론 습득 및 팀 아이템 직접 적용
                </h3>
              </div>
              <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-5">
                <div className="mb-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">GOAL 03</div>
                <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] leading-relaxed">
                  가설 검증 결과물 제작 및 발표
                </h3>
              </div>
            </div>
          </section>

          {/* 세션 구조 */}
          <section className="space-y-6">
            <h2 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f] flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-[#FF6C0F]" strokeWidth={1.5} />
              <span>세션 구조</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-6">
                <h3 className="mb-3 font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
                  세션 A — 문제 정의 · 솔루션 · BM
                </h3>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  문제가 실재하는지, 솔루션이 그 문제를 해결하는지, 수익 구조가 성립하는지를 점검합니다. 개념 강의 후 각 팀 아이템에 직접 적용합니다.
                </p>
              </div>
              <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-6">
                <h3 className="mb-3 font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
                  세션 B — 가설 검증 · KPI · 로드맵
                </h3>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  검증할 가설을 특정하고, 방법과 일정을 구조화합니다. 개념 강의 후 팀별 적용합니다. 세션 B의 산출물이 파이널 피칭의 발표 내용이 됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 최종 산출물 */}
          <section className="space-y-6">
            <h2 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#FF6C0F]" strokeWidth={1.5} />
              <span>최종 산출물 제출 안내</span>
            </h2>
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
              <p className="mb-4 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                각 팀은 캠프 종료 시점까지 아래 중 하나 이상의 형태를 선택하여 실제 고객 반응을 측정하고 제출합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "고객 인터뷰 질문지 + 섭외 페이지",
                  "프리토타입 (Pretotype)",
                  "페이크도어 (Fake Door)",
                  "랜딩페이지 / 홈페이지",
                  "그 외 실제 고객 반응을 측정할 수 있는 형태",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[#fcfcf8] border border-[#ece8db]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6C0F]/10 text-[#FF6C0F] font-['Pretendard',sans-serif] text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-['Pretendard',sans-serif] text-sm text-[#16140f] font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 타임테이블 */}
          <section className="space-y-8">
            <h2 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#FF6C0F]" strokeWidth={1.5} />
              <span>캠프 타임테이블</span>
            </h2>
            
            <div className="space-y-8">
              {/* Day 1 */}
              <div className="space-y-3">
                <h3 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF6C0F]/10 text-xs font-bold text-[#FF6C0F]">Day 1</span>
                  <span>6월 27일 (금)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
                  <table className="w-full min-w-[500px] border-collapse">
                    <thead>
                      <tr className="bg-[#f0efe6] text-left">
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-24">시간</th>
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-40">세션</th>
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">내용</th>
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-32">담당 프러너</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAY1_TIMETABLE.map((row, idx) => (
                        <tr key={idx} className="border-t border-[#ece8db] hover:bg-[#fcfcf8]/50">
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#16140f] font-semibold tabular-nums">{row.time}</td>
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#16140f] font-semibold">{row.session}</td>
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{row.content}</td>
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{row.leader}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Day 2 */}
              <div className="space-y-3">
                <h3 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FF6C0F]/10 text-xs font-bold text-[#FF6C0F]">Day 2</span>
                  <span>6월 28일 (토)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
                  <table className="w-full min-w-[500px] border-collapse">
                    <thead>
                      <tr className="bg-[#f0efe6] text-left">
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-24">시간</th>
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-40">세션</th>
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">내용</th>
                        <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-32">담당 프러너</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAY2_TIMETABLE.map((row, idx) => (
                        <tr key={idx} className="border-t border-[#ece8db] hover:bg-[#fcfcf8]/50">
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#16140f] font-semibold tabular-nums">{row.time}</td>
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#16140f] font-semibold">{row.session}</td>
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{row.content}</td>
                          <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{row.leader}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* 안내 정보 */}
          <section className="rounded-lg border border-[#ddd9cc] bg-[#f5f5ee] p-6 flex items-start gap-4">
            <Clock className="h-5 w-5 text-[#FF6C0F] shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h3 className="font-['Pretendard',sans-serif] text-sm font-bold text-[#16140f] mb-1">
                캠프 진행 및 혜택 안내
              </h3>
              <ul className="list-disc pl-4 space-y-1 font-['Pretendard',sans-serif] text-xs text-[#4a4a40]">
                <li>세션 B 작업 시간 중 야식이 제공됩니다.</li>
                <li>파이널 피칭 시 프리토타입, 페이크도어, 설문조사 페이지 등 실제 고객 반응 측정 도구를 활용하여 팀별 피드백이 즉석으로 제공됩니다.</li>
                <li>1박 2일 몰입 기간 동안 안전에 각별히 유의해 주시기 바랍니다.</li>
              </ul>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
