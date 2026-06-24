"use client";

import { FormEvent, type ReactNode, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, CalendarDays, CircleAlert, ClipboardCheck, Clock3, FileText, Target, Trash2, TrendingDown, TrendingUp } from "lucide-react";

import {
  createOfficeHour,
  createTeamKpi,
  deleteTeamKpi,
  updateStartupTeamDescription,
  updateTeamKpiProgress,
  type TeamSpaceData,
  type TeamSpaceProfile,
  type TeamSpaceTeam,
} from "@/lib/actions/team-space";
import type { TeamKpiStatus } from "@/lib/supabase/types";

type TeamSpaceClientProps = {
  initialData: TeamSpaceData;
  initialTeamId?: string;
};

const STATUS_LABEL: Record<TeamKpiStatus, string> = {
  planned: "계획",
  in_progress: "진행",
  achieved: "달성",
  missed: "미달성",
  blocked: "블로커",
};

function formatDate(value: string | null) {
  if (!value) return "미정";
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function twoWeeksLaterKey() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function isOfficeHourDue(team: TeamSpaceTeam, nowMs: number) {
  const latest = team.office_hours[0];
  if (!latest) return true;
  const basis = latest.next_due_at ?? latest.held_at;
  return nowMs - new Date(basis).getTime() > 14 * 24 * 60 * 60 * 1000;
}

function TeamMemberCheckboxes({ profiles, name }: { profiles: TeamSpaceProfile[]; name: string }) {
  return (
    <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border border-[#ddd9cc] bg-white p-3 sm:grid-cols-2">
      {profiles.map((profile) => (
        <label key={profile.id} className="flex items-center gap-2 text-sm text-[#4a4a40]">
          <input type="checkbox" name={name} value={profile.id} className="h-4 w-4 rounded border-[#c9c3b5] text-[#FF6C0F]" />
          <span className="truncate">{profile.display_name}</span>
        </label>
      ))}
    </div>
  );
}

type TeamKpi = TeamSpaceTeam["kpis"][number];
type TeamWorkspacePanel = "home" | "attendance-homework" | "kpi" | "office-hours";
type KpiMeasurementType = "numeric" | "reduce" | "checklist";
type ChecklistItem = { id: string; text: string; done: boolean };

const UNIT_OPTIONS = ["%", "명", "건", "원", "만원", "회", "개"];
const MEASUREMENT_OPTIONS: Array<{ value: KpiMeasurementType; label: string; description: string }> = [
  { value: "numeric", label: "수치 목표형", description: "많을수록 좋은 지표" },
  { value: "reduce", label: "감소 목표형", description: "낮을수록 좋은 지표" },
  { value: "checklist", label: "체크리스트형", description: "항목 완료 기반" },
];
const KPI_ROUND_START = "2026-06-26";
const KPI_ROUND_DAYS = 14;
const KPI_ROUNDS = Array.from({ length: 12 }, (_, index) => {
  const start = new Date(`${KPI_ROUND_START}T00:00:00`);
  start.setDate(start.getDate() + index * KPI_ROUND_DAYS);
  const end = new Date(start);
  end.setDate(end.getDate() + KPI_ROUND_DAYS - 1);
  return {
    index,
    label: `${index + 1}회차`,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
});

function formatRelativeDate(value: string | null, nowMs: number) {
  if (!value) return "업데이트 없음";
  const elapsedDays = Math.floor((nowMs - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (elapsedDays <= 0) return "오늘";
  if (elapsedDays === 1) return "1일 전";
  return `${elapsedDays}일 전`;
}

function averageAchievement(kpis: TeamKpi[]) {
  const measuredKpis = kpis.filter((kpi) => kpi.is_measured);
  if (measuredKpis.length === 0) return 0;
  return Math.round(measuredKpis.reduce((sum, kpi) => sum + kpi.achievement_rate, 0) / measuredKpis.length);
}

function clampRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseInputNumber(value: string) {
  if (value.trim() === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function calculatePreview({
  measurementType,
  startValue,
  targetValue,
  currentValue,
  checklistItems,
}: {
  measurementType: KpiMeasurementType;
  startValue: string;
  targetValue: string;
  currentValue: string;
  checklistItems: ChecklistItem[];
}) {
  if (measurementType === "checklist") {
    if (checklistItems.length === 0) return { measured: false, rate: 0, over: false };
    return {
      measured: true,
      rate: clampRate(checklistItems.filter((item) => item.done).length / checklistItems.length * 100),
      over: false,
    };
  }

  const target = parseInputNumber(targetValue);
  const current = parseInputNumber(currentValue);
  if (current === null || target === null || target <= 0) return { measured: false, rate: 0, over: false };

  if (measurementType === "reduce") {
    const start = parseInputNumber(startValue);
    if (start === null || start <= target) return { measured: false, rate: 0, over: false };
    const rawRate = (start - current) / (start - target) * 100;
    return { measured: true, rate: clampRate(rawRate), over: rawRate > 100 };
  }

  const rawRate = current / target * 100;
  return { measured: true, rate: clampRate(rawRate), over: rawRate > 100 };
}

function signalLabel(rate: number) {
  if (rate >= 80) return "양호";
  if (rate >= 50) return "주의";
  return "위험";
}

function signalClass(rate: number) {
  if (rate >= 80) return "bg-[#E6F9E6] text-[#2f9e44]";
  if (rate >= 50) return "bg-[#FFF0E5] text-[#b45309]";
  return "bg-[#FEE2E2] text-[#b42318]";
}

function getChecklistItems(kpi: TeamKpi): ChecklistItem[] {
  return Array.isArray(kpi.checklist_items) ? kpi.checklist_items : [];
}

function kpiMeasurementLabel(type: KpiMeasurementType) {
  return MEASUREMENT_OPTIONS.find((option) => option.value === type)?.label ?? "수치 목표형";
}

function getKpiRound(kpi: TeamKpi) {
  const basis = kpi.period_start ?? kpi.period_end ?? kpi.created_at;
  const startMs = new Date(`${KPI_ROUND_START}T00:00:00`).getTime();
  const elapsed = Math.floor((new Date(basis).getTime() - startMs) / (KPI_ROUND_DAYS * 24 * 60 * 60 * 1000));
  const index = Math.max(0, elapsed);
  return KPI_ROUNDS[index] ?? {
    index,
    label: `${index + 1}회차`,
    start: basis.slice(0, 10),
    end: kpi.period_end ?? basis.slice(0, 10),
  };
}

function groupKpisByRound(kpis: TeamKpi[]) {
  const groups = new Map<number, { round: ReturnType<typeof getKpiRound>; kpis: TeamKpi[] }>();
  for (const kpi of kpis) {
    const round = getKpiRound(kpi);
    const group = groups.get(round.index) ?? { round, kpis: [] };
    group.kpis.push(kpi);
    groups.set(round.index, group);
  }
  return Array.from(groups.values())
    .sort((a, b) => b.round.index - a.round.index)
    .map((group) => ({
      ...group,
      kpis: group.kpis.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    }));
}

function kpiValueSummary(kpi: TeamKpi) {
  if (!kpi.is_measured) return "미측정";
  if (kpi.measurement_type === "checklist") {
    return `${getChecklistItems(kpi).filter((item) => item.done).length}/${getChecklistItems(kpi).length}개 완료`;
  }
  if (kpi.measurement_type === "reduce") {
    return `시작 ${kpi.start_value ?? "-"}${kpi.unit} · 현재 ${kpi.current_value}${kpi.unit} · 목표 ${kpi.target_value}${kpi.unit}`;
  }
  return `현재 ${kpi.current_value}${kpi.unit} / 목표 ${kpi.target_value}${kpi.unit}`;
}

function kpiSignalClass(kpi: TeamKpi) {
  if (!kpi.is_measured) return "bg-[#f0efe6] text-[#6b6b5e]";
  if (kpi.status === "blocked" || kpi.status === "missed" || kpi.achievement_rate < 50) return "bg-[#FEE2E2] text-[#b42318]";
  if (kpi.achievement_rate < 80) return "bg-[#FFF0E5] text-[#b45309]";
  return "bg-[#E6F9E6] text-[#2f9e44]";
}

function latestKpiUpdate(kpis: TeamKpi[]) {
  return [...kpis].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
}

function KpiTrendChart({ kpis }: { kpis: TeamKpi[] }) {
  const points = [...kpis]
    .filter((kpi) => kpi.is_measured)
    .sort((a, b) => new Date(a.period_end ?? a.created_at).getTime() - new Date(b.period_end ?? b.created_at).getTime())
    .slice(-8);

  if (points.length === 0) {
    return <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">아직 측정된 KPI가 없어 추이를 그릴 수 없습니다.</p>;
  }

  const width = 520;
  const height = 180;
  const xStep = points.length > 1 ? width / (points.length - 1) : width;
  const toY = (rate: number) => height - Math.min(rate, 120) / 120 * height;
  const polyline = points.map((kpi, index) => `${index * xStep},${toY(kpi.achievement_rate)}`).join(" ");
  const targetY = toY(100);

  return (
    <div className="overflow-hidden rounded-lg border border-[#ddd9cc] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-[#16140f]">KPI 달성률 추이</p>
        <span className="text-xs font-semibold text-[#6b6b5e]">목표선 100%</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible">
        <line x1="0" x2={width} y1={targetY} y2={targetY} stroke="#ddd9cc" strokeDasharray="6 6" strokeWidth="2" />
        <polyline points={polyline} fill="none" stroke="#FF6C0F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((kpi, index) => (
          <circle key={kpi.id} cx={index * xStep} cy={toY(kpi.achievement_rate)} r="5" fill="#FF6C0F" />
        ))}
      </svg>
      <div className="mt-2 grid gap-2 text-xs text-[#6b6b5e] sm:grid-cols-2">
        {points.slice(-2).map((kpi) => (
          <div key={kpi.id} className="truncate">
            {kpi.title}: <span className="font-bold text-[#16140f]">{kpi.achievement_rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamDashboard({ team, nowMs }: { team: TeamSpaceTeam; nowMs: number }) {
  const kpis = team.kpis;
  const northStar = [...kpis].sort((a, b) => {
    if (a.status === "blocked" && b.status !== "blocked") return -1;
    if (b.status === "blocked" && a.status !== "blocked") return 1;
    return new Date(b.period_end ?? b.updated_at).getTime() - new Date(a.period_end ?? a.updated_at).getTime();
  })[0] ?? null;
  const sortedByEnd = [...kpis].sort((a, b) => new Date(b.period_end ?? b.updated_at).getTime() - new Date(a.period_end ?? a.updated_at).getTime());
  const previous = sortedByEnd.find((kpi) => kpi.id !== northStar?.id) ?? null;
  const delta = northStar && previous ? northStar.achievement_rate - previous.achievement_rate : 0;
  const average = averageAchievement(kpis);
  const latest = latestKpiUpdate(kpis);
  const latestAgeDays = latest ? Math.floor((nowMs - new Date(latest.updated_at).getTime()) / (24 * 60 * 60 * 1000)) : null;
  const actionKpis = kpis.filter((kpi) => kpi.status === "in_progress" || kpi.status === "blocked" || kpi.status === "missed");
  const completedKpis = kpis.filter((kpi) => kpi.status === "achieved");

  return (
    <section className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#6b6b5e]">
            <Target className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
            대표 KPI
          </div>
          {northStar ? (
            <>
              <p className="truncate text-sm font-bold text-[#16140f]">{northStar.title}</p>
              <p className="mt-3 text-2xl font-black">{northStar.is_measured ? `${northStar.achievement_rate}%` : "미측정"}</p>
              <p className="mt-2 text-sm text-[#6b6b5e]">{kpiValueSummary(northStar)}</p>
              <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${delta >= 0 ? "bg-[#E6F9E6] text-[#2f9e44]" : "bg-[#FEE2E2] text-[#b42318]"}`}>
                {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> : <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />}
                {delta >= 0 ? "+" : ""}{delta}% vs previous
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6b6b5e]">등록된 KPI가 없습니다.</p>
          )}
        </div>

        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="mb-3 text-xs font-semibold text-[#6b6b5e]">목표 달성률</p>
          <div className="flex items-center gap-5">
            <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(#FF6C0F ${Math.min(average, 100)}%, #f0efe6 0)` }}>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black">{average}%</div>
            </div>
            <div className="text-sm text-[#6b6b5e]">
              <p><span className="font-bold text-[#16140f]">{kpis.length}</span> KPIs tracked</p>
              <p className="mt-1"><span className="font-bold text-[#16140f]">{completedKpis.length}</span> achieved</p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg border p-5 ${latestAgeDays !== null && latestAgeDays >= 7 ? "border-[#f2b8b5] bg-[#fff5f5]" : "border-[#ddd9cc] bg-white"}`}>
          <p className="mb-3 text-xs font-semibold text-[#6b6b5e]">마지막 업데이트</p>
          {latest ? (
            <>
              <p className="text-2xl font-black">{formatRelativeDate(latest.updated_at, nowMs)}</p>
              <p className="mt-2 text-sm text-[#6b6b5e]">{latest.owner?.display_name ?? "팀 공통"} · {latest.title}</p>
              {latestAgeDays !== null && latestAgeDays >= 7 ? (
                <span className="mt-3 inline-flex rounded-full bg-[#FEE2E2] px-2.5 py-1 text-xs font-bold text-[#b42318]">확인 필요</span>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-[#6b6b5e]">업데이트된 KPI가 없습니다.</p>
          )}
        </div>
      </div>

      <KpiTrendChart kpis={kpis} />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
            <h3 className="text-sm font-bold">지표 카드</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {kpis.length === 0 ? (
              <p className="text-sm text-[#6b6b5e]">KPI를 등록하면 지표 카드가 표시됩니다.</p>
            ) : (
              kpis.map((kpi) => (
                <div key={kpi.id} className="rounded-lg border border-[#ddd9cc] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{kpi.title}</p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${kpiSignalClass(kpi)}`}>{kpi.achievement_rate}%</span>
                  </div>
                  <p className="mt-2 text-xs text-[#6b6b5e]">{kpiValueSummary(kpi)}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0efe6]">
                    <div className="h-full rounded-full bg-[#FF6C0F]" style={{ width: `${Math.min(kpi.achievement_rate, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <h3 className="mb-4 text-sm font-bold">실행 현황</h3>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold text-[#6b6b5e]">진행/막힘</p>
              {actionKpis.length === 0 ? (
                <p className="text-sm text-[#6b6b5e]">진행 중이거나 막힌 KPI가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {actionKpis.slice(0, 4).map((kpi) => (
                    <div key={kpi.id} className="rounded-lg bg-[#f5f5ee] p-3 text-sm">
                      <p className="font-semibold">{kpi.title}</p>
                      <p className="mt-1 text-xs text-[#6b6b5e]">{STATUS_LABEL[kpi.status]} · {kpi.progress_note || "진행 메모 없음"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-[#6b6b5e]">완료한 일</p>
              <p className="text-sm text-[#6b6b5e]">{completedKpis.length > 0 ? completedKpis.map((kpi) => kpi.title).join(", ") : "이번 기간 달성 KPI가 없습니다."}</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-[#6b6b5e]">다음 액션</p>
              <p className="text-sm text-[#6b6b5e]">{team.office_hours[0]?.next_actions || northStar?.progress_note || "다음 액션이 아직 기록되지 않았습니다."}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiProgressForm({
  kpi,
  isPending,
  runAction,
}: {
  kpi: TeamKpi;
  isPending: boolean;
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>) => void;
}) {
  const [currentValue, setCurrentValue] = useState(kpi.is_measured ? String(kpi.current_value) : "");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(getChecklistItems(kpi));
  const preview = calculatePreview({
    measurementType: kpi.measurement_type,
    startValue: kpi.start_value !== null ? String(kpi.start_value) : "",
    targetValue: String(kpi.target_value),
    currentValue,
    checklistItems,
  });

  function updateChecklistItem(id: string, done: boolean) {
    setChecklistItems((items) => items.map((item) => (item.id === id ? { ...item, done } : item)));
  }

  return (
    <form onSubmit={(event) => runAction(event, (formData) => updateTeamKpiProgress(kpi.id, formData))} className="mt-4 space-y-3 rounded-lg bg-[#fbfaf4] p-3">
      <input type="hidden" name="checklist_items" value={JSON.stringify(checklistItems)} />
      {kpi.measurement_type === "checklist" ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#6b6b5e]">완료 항목</p>
          {checklistItems.map((item) => (
            <label key={item.id} className="flex items-center gap-2 rounded-lg border border-[#ddd9cc] bg-white px-3 py-2 text-sm">
              <input type="checkbox" checked={item.done} onChange={(event) => updateChecklistItem(item.id, event.target.checked)} className="h-4 w-4 rounded border-[#c9c3b5] text-[#FF6C0F]" />
              <span>{item.text}</span>
            </label>
          ))}
        </div>
      ) : (
        <label className="block text-xs font-bold text-[#6b6b5e]">
          현재값
          <input name="current_value" type="number" min="0" step="any" value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
        </label>
      )}
      <label className="block text-xs font-bold text-[#6b6b5e]">
        한 줄 코멘트
        <input name="progress_note" defaultValue={kpi.progress_note} placeholder="성과 공유 피드에 올릴 수 있는 숫자 기반 코멘트" className="mt-1 h-9 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#6b6b5e]">달성률</span>
          <span className="text-sm font-black text-[#16140f]">{preview.measured ? `${preview.rate}%` : "미측정"}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${preview.measured ? signalClass(preview.rate) : "bg-[#f0efe6] text-[#6b6b5e]"}`}>
            {preview.measured ? signalLabel(preview.rate) : "미측정"}
          </span>
        </div>
        <button disabled={isPending} className="h-9 rounded-md border border-[#ddd9cc] bg-white px-3 text-xs font-semibold disabled:opacity-50">
          업데이트
        </button>
      </div>
    </form>
  );
}

function KpiPanel({
  team,
  canManage,
  canDelete,
  isPending,
  runAction,
  runVoidAction,
}: {
  team: TeamSpaceTeam;
  canManage: boolean;
  canDelete: boolean;
  isPending: boolean;
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>) => void;
  runVoidAction: (action: () => Promise<{ success: boolean; error?: string }>) => void;
}) {
  const [measurementType, setMeasurementType] = useState<KpiMeasurementType>("numeric");
  const [startValue, setStartValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([{ id: "item-1", text: "", done: false }]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const selectedRound = KPI_ROUNDS[selectedRoundIndex] ?? KPI_ROUNDS[0];
  const preview = calculatePreview({ measurementType, startValue, targetValue, currentValue, checklistItems });
  const kpiGroups = groupKpisByRound(team.kpis);

  function updateChecklistItem(id: string, update: Partial<ChecklistItem>) {
    setChecklistItems((items) => items.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }

  function addChecklistItem() {
    setChecklistItems((items) => [...items, { id: `item-${Date.now()}`, text: "", done: false }]);
  }

  function removeChecklistItem(id: string) {
    setChecklistItems((items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items));
  }

  return (
    <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">KPI 설정 및 제출</h3>
          <p className="mt-1 text-sm text-[#6b6b5e]">2주 단위 KPI를 등록하고 현재값을 제출해 달성률을 업데이트합니다.</p>
        </div>
        <Target className="h-6 w-6 text-[#FF6C0F]" strokeWidth={2} />
      </div>

      {canManage ? (
        <form onSubmit={(event) => runAction(event, createTeamKpi)} className="mb-5 space-y-4 rounded-lg bg-[#f5f5ee] p-4">
          <input type="hidden" name="team_id" value={team.id} />
          <input type="hidden" name="measurement_type" value={measurementType} />
          <input type="hidden" name="checklist_items" value={JSON.stringify(checklistItems)} />
          <input type="hidden" name="period_start" value={selectedRound.start} />
          <input type="hidden" name="period_end" value={selectedRound.end} />

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-3">
            <p className="text-xs font-bold text-[#6b6b5e]">측정 유형</p>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {MEASUREMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMeasurementType(option.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    measurementType === option.value ? "border-[#FF6C0F] bg-[#FFF0E5]" : "border-[#ddd9cc] bg-white hover:border-[#FF6C0F]"
                  }`}
                >
                  <p className="text-sm font-black text-[#16140f]">{option.label}</p>
                  <p className="mt-1 text-xs text-[#6b6b5e]">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#6b6b5e]">
              지표명
              <input name="title" required className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
            </label>
            <label className="text-xs font-bold text-[#6b6b5e]">
              담당자 선택
              <select name="owner_id" className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
                <option value="">팀 공통</option>
                {team.members
                  .map((member) => member.profile)
                  .filter((profile): profile is TeamSpaceProfile => Boolean(profile))
                  .map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.display_name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-[#6b6b5e]">
            설명
            <textarea name="description" placeholder="무엇을 어떻게 측정하는지 한 줄로 정의" className="mt-1 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm outline-none focus:border-[#FF6C0F]" />
          </label>

          <label className="block text-xs font-bold text-[#6b6b5e]">
            KPI 회차
            <select
              value={selectedRoundIndex}
              onChange={(event) => setSelectedRoundIndex(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]"
            >
              {KPI_ROUNDS.map((round) => (
                <option key={round.index} value={round.index}>
                  {round.label} · {formatDateRange(round.start, round.end)}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-medium text-[#6b6b5e]">2026년 6월 26일부터 2주 단위로 자동 설정됩니다.</span>
          </label>

          {measurementType === "checklist" ? (
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-3">
              <p className="text-xs font-bold text-[#6b6b5e]">체크리스트 항목</p>
              <div className="mt-3 space-y-2">
                {checklistItems.map((item, index) => (
                  <div key={item.id} className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <input type="checkbox" checked={item.done} onChange={(event) => updateChecklistItem(item.id, { done: event.target.checked })} className="h-4 w-4 rounded border-[#c9c3b5] text-[#FF6C0F]" />
                    <input value={item.text} onChange={(event) => updateChecklistItem(item.id, { text: event.target.value })} required placeholder={`항목 ${index + 1}`} className="h-10 rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
                    <button type="button" onClick={() => removeChecklistItem(item.id)} className="h-9 rounded-md border border-[#ddd9cc] px-3 text-xs font-semibold text-[#6b6b5e]">
                      제거
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addChecklistItem} className="mt-3 h-9 rounded-md border border-[#FF6C0F] px-3 text-xs font-bold text-[#FF6C0F]">
                + 항목 추가
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#6b6b5e]">
                단위
                <select name="unit" required className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>
              {measurementType === "reduce" ? (
                <label className="text-xs font-bold text-[#6b6b5e]">
                  시작값
                  <input name="start_value" type="number" min="0" step="any" required value={startValue} onChange={(event) => setStartValue(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
                </label>
              ) : null}
              <label className="text-xs font-bold text-[#6b6b5e]">
                목표값
                <input name="target_value" type="number" min="0.000001" step="any" required value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
              </label>
              <label className="text-xs font-bold text-[#6b6b5e]">
                현재값
                <input name="current_value" type="number" min="0" step="any" value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ddd9cc] bg-white p-3">
            <div>
              <p className="text-xs font-bold text-[#6b6b5e]">실시간 달성률</p>
              <p className="mt-1 text-lg font-black text-[#16140f]">{preview.measured ? `${preview.rate}%` : "미측정"}</p>
            </div>
            <div className="flex items-center gap-2">
              {preview.over ? <span className="rounded-full bg-[#E6F9E6] px-2.5 py-1 text-xs font-bold text-[#2f9e44]">초과달성</span> : null}
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${preview.measured ? signalClass(preview.rate) : "bg-[#f0efe6] text-[#6b6b5e]"}`}>
                {preview.measured ? signalLabel(preview.rate) : "미측정"}
              </span>
            </div>
          </div>

          <button disabled={isPending} className="h-10 rounded-md bg-[#16140f] px-4 text-xs font-semibold text-white disabled:opacity-50">
            KPI 추가
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {team.kpis.length === 0 ? (
          <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">등록된 KPI가 없습니다.</p>
        ) : (
          kpiGroups.map((group) => (
            <section key={group.round.index} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
              <div className="mb-4 flex flex-col gap-1 border-b border-[#ece8dc] pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="text-base font-black text-[#16140f]">{group.round.label}</h4>
                  <p className="text-xs font-semibold text-[#6b6b5e]">{formatDateRange(group.round.start, group.round.end)}</p>
                </div>
                <span className="text-xs font-bold text-[#FF6C0F]">{group.kpis.length} KPIs</span>
              </div>
              <div className="space-y-3">
                {group.kpis.map((kpi) => (
                  <div key={kpi.id} className="rounded-lg border border-[#ece8dc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{kpi.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#6b6b5e]">{kpi.description || "설명 없음"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${kpi.is_measured ? signalClass(kpi.achievement_rate) : "bg-[#f0efe6] text-[#6b6b5e]"}`}>
                        {kpi.is_measured ? signalLabel(kpi.achievement_rate) : "미측정"}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-[#6b6b5e]">
                        <span>{kpiMeasurementLabel(kpi.measurement_type)} · {kpi.owner?.display_name ?? "팀 공통"}</span>
                        <span className="font-bold text-[#16140f]">{kpi.is_measured ? `${kpi.achievement_rate}%` : "미측정"}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0efe6]">
                        <div className="h-full rounded-full bg-[#FF6C0F]" style={{ width: `${kpi.is_measured ? Math.min(kpi.achievement_rate, 100) : 0}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-[#6b6b5e]">{kpiValueSummary(kpi)}</p>
                    </div>
                    <KpiProgressForm kpi={kpi} isPending={isPending} runAction={runAction} />
                    {canDelete ? (
                      <button type="button" onClick={() => runVoidAction(() => deleteTeamKpi(kpi.id))} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#b42318]">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        삭제
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}

function OfficeHoursPanel({
  team,
  canManage,
  isPending,
  runAction,
}: {
  team: TeamSpaceTeam;
  canManage: boolean;
  isPending: boolean;
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>) => void;
}) {
  return (
    <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">오피스아워 설정 및 제출</h3>
          <p className="mt-1 text-sm text-[#6b6b5e]">2주마다 진행한 프러너 오피스아워 내용을 기록하고 다음 액션을 공유합니다.</p>
        </div>
        <CalendarDays className="h-6 w-6 text-[#FF6C0F]" strokeWidth={2} />
      </div>

      {canManage ? (
        <form onSubmit={(event) => runAction(event, createOfficeHour)} className="mb-5 space-y-3 rounded-lg bg-[#f5f5ee] p-3">
          <input type="hidden" name="team_id" value={team.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-[#6b6b5e]">
              진행일
              <input name="held_at" type="date" defaultValue={todayKey()} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
            </label>
            <label className="text-xs font-semibold text-[#6b6b5e]">
              다음 예정일
              <input name="next_due_at" type="date" defaultValue={twoWeeksLaterKey()} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
            </label>
          </div>
          <textarea name="summary" placeholder="논의 내용" className="min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
          <textarea name="decisions" placeholder="결정 사항" className="min-h-16 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
          <textarea name="next_actions" placeholder="다음 액션" className="min-h-16 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
          <div>
            <p className="mb-2 text-xs font-semibold text-[#6b6b5e]">참석자</p>
            <TeamMemberCheckboxes profiles={team.members.map((member) => member.profile).filter((profile): profile is TeamSpaceProfile => Boolean(profile))} name="attendee_ids" />
          </div>
          <button disabled={isPending} className="h-9 rounded-md bg-[#16140f] px-3 text-xs font-semibold text-white disabled:opacity-50">
            기록 제출
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {team.office_hours.length === 0 ? (
          <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">아직 오피스아워 기록이 없습니다.</p>
        ) : (
          team.office_hours.map((officeHour) => (
            <article key={officeHour.id} className="rounded-lg border border-[#ddd9cc] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-bold">
                  <Clock3 className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
                  {formatDate(officeHour.held_at)}
                </p>
                <span className="text-xs text-[#6b6b5e]">다음 {formatDate(officeHour.next_due_at)}</span>
              </div>
              <div className="space-y-3 text-sm leading-6">
                <p><span className="font-semibold">논의</span> {officeHour.summary || "기록 없음"}</p>
                <p><span className="font-semibold">결정</span> {officeHour.decisions || "기록 없음"}</p>
                <p><span className="font-semibold">다음 액션</span> {officeHour.next_actions || "기록 없음"}</p>
              </div>
              <p className="mt-3 text-xs text-[#6b6b5e]">
                참석 {officeHour.attendees.map((profile) => profile.display_name).join(", ") || "미기록"}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function TeamSpaceTabs({
  activePanel,
  onChange,
}: {
  activePanel: TeamWorkspacePanel;
  onChange: (panel: TeamWorkspacePanel) => void;
}) {
  const tabs: Array<{ id: TeamWorkspacePanel; label: string; icon: ReactNode }> = [
    { id: "home", label: "Home", icon: <Activity className="h-4 w-4" strokeWidth={2} /> },
    { id: "attendance-homework", label: "출석 과제", icon: <ClipboardCheck className="h-4 w-4" strokeWidth={2} /> },
    { id: "kpi", label: "KPI", icon: <Target className="h-4 w-4" strokeWidth={2} /> },
    { id: "office-hours", label: "오피스아워", icon: <CalendarDays className="h-4 w-4" strokeWidth={2} /> },
  ];

  return (
    <div className="mt-6 flex gap-2 overflow-x-auto border-t border-[#ece8dc] pt-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors ${
            activePanel === tab.id ? "bg-[#16140f] text-white" : "bg-[#f5f5ee] text-[#4a4a40] hover:bg-[#e8e6dc]"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AttendanceHomeworkPanel({ team }: { team: TeamSpaceTeam }) {
  return (
    <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">출석 과제</h3>
          <p className="mt-1 text-sm text-[#6b6b5e]">팀 활동에 필요한 출석과 과제 확인 동선을 모아둡니다.</p>
        </div>
        <ClipboardCheck className="h-6 w-6 text-[#FF6C0F]" strokeWidth={2} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/dashboard" className="rounded-lg border border-[#ddd9cc] bg-[#fbfaf4] p-4 transition-colors hover:border-[#FF6C0F] hover:bg-[#fffaf6]">
          <div className="flex items-center gap-2 text-sm font-black text-[#16140f]">
            <ClipboardCheck className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
            출석 확인
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6b6b5e]">개인 대시보드에서 세션 출석 상태를 확인합니다.</p>
        </Link>
        <Link href="/dashboard/homework" className="rounded-lg border border-[#ddd9cc] bg-[#fbfaf4] p-4 transition-colors hover:border-[#FF6C0F] hover:bg-[#fffaf6]">
          <div className="flex items-center gap-2 text-sm font-black text-[#16140f]">
            <FileText className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
            과제 제출
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6b6b5e]">개인 과제 제출 현황과 제출 페이지로 이동합니다.</p>
        </Link>
      </div>

      <div className="mt-5 rounded-lg bg-[#f5f5ee] p-4 text-sm leading-6 text-[#6b6b5e]">
        <p className="font-bold text-[#16140f]">{team.name}</p>
        <p className="mt-1">팀 단위 출석·과제 집계 데이터는 아직 팀스페이스 데이터에 연결되어 있지 않습니다. 연결 전까지는 개인 대시보드 동선을 사용합니다.</p>
      </div>
    </section>
  );
}

export default function TeamSpaceClient({ initialData, initialTeamId }: TeamSpaceClientProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    if (initialTeamId && initialData.teams.some((team) => team.id === initialTeamId)) return initialTeamId;
    return initialData.teams[0]?.id ?? "";
  });
  const [activePanel, setActivePanel] = useState<TeamWorkspacePanel>("home");

  const selectedTeam = useMemo(
    () => initialData.teams.find((team) => team.id === selectedTeamId) ?? initialData.teams[0] ?? null,
    [initialData.teams, selectedTeamId],
  );
  const canDeleteTeamKpis = initialData.isManager;

  function runAction(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.success) {
        setMessage(result.error ?? "요청을 처리하지 못했습니다.");
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  function runVoidAction(action: () => Promise<{ success: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setMessage(result.error ?? "요청을 처리하지 못했습니다.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-[#f5f5ee] text-[#16140f] [font-family:Pretendard,system-ui,sans-serif]">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-normal">My Teamspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6b5e]">
              내가 속한 팀의 2주 KPI와 오피스아워 기록을 확인하고 달성률을 업데이트합니다. 여러 팀에 속해 있다면 왼쪽에서 팀을 선택할 수 있습니다.
            </p>
          </div>
          <div className="text-sm text-[#6b6b5e]">{initialData.currentUser.display_name}</div>
        </div>

        {message ? (
          <div className="mb-6 rounded-lg border border-[#f2b8b5] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
            {message}
          </div>
        ) : null}

        {initialData.setupError ? (
          <div className="mb-6 rounded-lg border border-[#f2b8b5] bg-[#fff5f5] px-4 py-4 text-sm text-[#b42318]">
            <p className="font-bold">{initialData.setupError}</p>
            <p className="mt-1 text-[#7a271a]">Supabase SQL 적용 후 팀스페이스를 사용할 수 있습니다.</p>
          </div>
        ) : null}

        {initialData.teams.length === 0 ? (
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-10 text-center">
            <CircleAlert className="mx-auto mb-3 h-7 w-7 text-[#FF6C0F]" strokeWidth={2} />
            <p className="font-semibold">아직 배정된 팀스페이스가 없습니다.</p>
            <p className="mt-2 text-sm text-[#6b6b5e]">관리자 대시보드에서 팀 배정이 완료되면 이곳에 표시됩니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-3">
              {initialData.teams.map((team) => {
                const latestOfficeHour = team.office_hours[0];
                const activeKpisForTeam = team.kpis.filter((kpi) => kpi.status !== "achieved");
                return (
                  <Link
                    key={team.id}
                    href={`/team-space/${team.id}`}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setActivePanel("home");
                    }}
                    className={`block rounded-lg border p-4 transition-colors ${
                      selectedTeam?.id === team.id ? "border-[#FF6C0F] bg-white" : "border-[#ddd9cc] bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{team.name}</p>
                        <p className="mt-1 text-xs text-[#6b6b5e]">{team.lead_preneur?.display_name ?? "담당 프러너 미정"}</p>
                      </div>
                      {isOfficeHourDue(team, nowMs) ? (
                        <span className="rounded-full bg-[#FFF0E5] px-2 py-1 text-[11px] font-semibold text-[#b42318]">OH 필요</span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-[#6b6b5e]">
                      <span>KPI {activeKpisForTeam.length}</span>
                      <span>최근 OH {latestOfficeHour ? formatDate(latestOfficeHour.held_at) : "없음"}</span>
                    </div>
                  </Link>
                );
              })}
            </aside>

            {selectedTeam ? (
              <section className="space-y-6">
                <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black">{selectedTeam.name}</h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTeam.members.map((member) => (
                          <span key={member.id} className="rounded-full bg-[#f5f5ee] px-3 py-1 text-xs font-semibold text-[#4a4a40]">
                            {member.profile?.display_name ?? "알 수 없음"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#f5f5ee] px-4 py-3 text-sm">
                      담당 프러너
                      <p className="mt-1 font-bold">{selectedTeam.lead_preneur?.display_name ?? "미정"}</p>
                    </div>
                  </div>
                  <form onSubmit={(event) => runAction(event, (formData) => updateStartupTeamDescription(selectedTeam.id, formData))} className="mt-5">
                    <label className="text-xs font-bold text-[#6b6b5e]" htmlFor={`team-description-${selectedTeam.id}`}>
                      팀 설명
                    </label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <textarea
                        id={`team-description-${selectedTeam.id}`}
                        name="description"
                        defaultValue={selectedTeam.description}
                        placeholder="팀 한 줄 소개와 현재 스테이지를 적어주세요."
                        className="min-h-20 rounded-lg border border-[#ddd9cc] bg-[#fbfaf4] p-3 text-sm leading-6 outline-none focus:border-[#FF6C0F]"
                      />
                      <button disabled={isPending} className="h-10 rounded-md bg-[#16140f] px-4 text-xs font-semibold text-white disabled:opacity-50 sm:self-end">
                        저장
                      </button>
                    </div>
                  </form>

                  <TeamSpaceTabs activePanel={activePanel} onChange={setActivePanel} />
                </div>

                {activePanel === "home" ? <TeamDashboard team={selectedTeam} nowMs={nowMs} /> : activePanel === "kpi" ? (
                  <KpiPanel
                    team={selectedTeam}
                    canManage={true}
                    canDelete={canDeleteTeamKpis}
                    isPending={isPending}
                    runAction={runAction}
                    runVoidAction={runVoidAction}
                  />
                ) : activePanel === "office-hours" ? (
                  <OfficeHoursPanel
                    team={selectedTeam}
                    canManage={true}
                    isPending={isPending}
                    runAction={runAction}
                  />
                ) : (
                  <AttendanceHomeworkPanel team={selectedTeam} />
                )}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
