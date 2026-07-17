"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, CircleAlert, Clock3, Coffee, ImageIcon, Paperclip, Target, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";

import {
  createCtaReport,
  deleteTeamReviewPost,
  createOfficeHour,
  deleteTeamKpi,
  updateTeamReviewPost,
  updateStartupTeamDescription,
  updateStartupTeamHomeProfile,
  updateTeamKpi,
  updateTeamKpiProgress,
  type TeamSpaceData,
  type TeamSpaceProfile,
  type TeamSpaceTeam,
} from "@/lib/actions/team-space";
import { uploadTeamBuildingFile, uploadTeamBuildingImage } from "@/lib/storage";
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
type TeamWorkspacePanel = "home" | "kpi" | "coffee-chat";
type KpiMeasurementType = "numeric" | "reduce" | "checklist";
type ChecklistItem = { id: string; text: string; done: boolean };
type CtaAttachment = { id: string; type: "image" | "file"; name: string; url: string };
type CtaContentBlock =
  | { type: "text"; text: string; variant?: "paragraph" | "heading1" | "heading2" | "heading3" }
  | { type: "image"; url: string; width?: number }
  | { type: "file"; name: string; url: string };

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

function createAttachmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function CtaAttachmentField({
  teamId,
  attachments,
  onChange,
}: {
  teamId: string;
  attachments: CtaAttachment[];
  onChange: (attachments: CtaAttachment[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(Array.from(files).map(async (file) => {
        if (file.type.startsWith("image/")) {
          return {
            id: createAttachmentId(),
            type: "image" as const,
            name: file.name,
            url: await uploadTeamBuildingImage(teamId, file),
          };
        }
        const result = await uploadTeamBuildingFile(teamId, file);
        return {
          id: createAttachmentId(),
          type: "file" as const,
          name: result.name || file.name,
          url: result.url,
        };
      }));
      onChange([...attachments, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "첨부 파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(id: string) {
    onChange(attachments.filter((attachment) => attachment.id !== id));
  }

  return (
    <div className="mt-3 rounded-lg border border-[#ece8dc] bg-[#fbfaf4] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#ddd9cc] bg-white px-3 text-xs font-bold text-[#4a4a40] transition-colors hover:border-[#FF6C0F]">
          <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} />
          이미지/파일 첨부
          <input type="file" multiple onChange={(event) => uploadFiles(event.target.files)} className="sr-only" />
        </label>
        {uploading ? <span className="text-xs font-semibold text-[#6b6b5e]">업로드 중...</span> : null}
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-[#b42318]">{error}</p> : null}
      {attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <span key={attachment.id} className="inline-flex max-w-full items-center gap-2 rounded-md border border-[#ddd9cc] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#4a4a40]">
              {attachment.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-[#FF6C0F]" strokeWidth={2} /> : <Paperclip className="h-3.5 w-3.5 text-[#FF6C0F]" strokeWidth={2} />}
              <span className="max-w-[220px] truncate">{attachment.name}</span>
              <button type="button" onClick={() => removeAttachment(attachment.id)} className="text-[#8a877c] hover:text-[#b42318]" aria-label={`${attachment.name} 삭제`}>
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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

function TeamDashboard({
  team,
  isPending,
  runAction,
}: {
  team: TeamSpaceTeam;
  isPending: boolean;
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) => void;
}) {
  const [heroImageUrl, setHeroImageUrl] = useState(team.hero_image_url);
  const [heroUploadMessage, setHeroUploadMessage] = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);

  useEffect(() => {
    setHeroImageUrl(team.hero_image_url);
    setHeroUploadMessage(null);
  }, [team.id, team.hero_image_url]);

  async function uploadHeroImage(file: File | undefined) {
    if (!file) return;
    setHeroUploading(true);
    setHeroUploadMessage(null);
    try {
      const url = await uploadTeamBuildingImage(team.id, file);
      setHeroImageUrl(url);
      setHeroUploadMessage("대표 이미지가 업로드되었습니다. Home 저장을 눌러 반영해 주세요.");
    } catch (error) {
      setHeroUploadMessage(error instanceof Error ? error.message : "대표 이미지 업로드에 실패했습니다.");
    } finally {
      setHeroUploading(false);
    }
  }

  return (
    <section className="space-y-5">
      <form onSubmit={(event) => runAction(event, (formData) => updateStartupTeamHomeProfile(team.id, formData))} className="rounded-lg border border-[#ddd9cc] bg-white p-5">
        <div className="mb-5">
          <h3 className="text-xl font-black">팀 소개 Home 설정</h3>
          <p className="mt-1 text-sm text-[#6b6b5e]">2026 Team Building의 팀별 Home에 표시되는 소개 정보를 입력합니다.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-xs font-bold text-[#6b6b5e]">
            한 줄 소개
            <input name="tagline" defaultValue={team.tagline} placeholder="팀을 한 문장으로 소개해 주세요." className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
          </label>
          <label className="block text-xs font-bold text-[#6b6b5e]">
            현재 스테이지
            <input name="stage" defaultValue={team.stage} placeholder="예: Problem validation, MVP, Beta" className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
          </label>
        </div>

        <label className="mt-4 block text-xs font-bold text-[#6b6b5e]">
          대표 이미지 URL
          <input name="hero_image_url" value={heroImageUrl} onChange={(event) => setHeroImageUrl(event.target.value)} placeholder="https://..." className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#ddd9cc] bg-white px-3 text-xs font-bold text-[#4a4a40] transition-colors hover:border-[#FF6C0F]">
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} />
            대표 이미지 업로드
            <input type="file" accept="image/*" onChange={(event) => uploadHeroImage(event.target.files?.[0])} className="sr-only" />
          </label>
          {heroUploading ? <span className="text-xs font-semibold text-[#6b6b5e]">업로드 중...</span> : null}
          {heroUploadMessage ? <span className="text-xs font-semibold text-[#6b6b5e]">{heroUploadMessage}</span> : null}
        </div>

        <label className="mt-4 block text-xs font-bold text-[#6b6b5e]">
          팀 소개
          <textarea name="description" defaultValue={team.description} placeholder="팀의 배경, 방향성, 현재 집중하고 있는 일을 적어주세요." className="mt-1 min-h-24 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm leading-6 outline-none focus:border-[#FF6C0F]" />
        </label>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-xs font-bold text-[#6b6b5e]">
            해결하려는 문제
            <textarea name="problem" defaultValue={team.problem} className="mt-1 min-h-28 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm leading-6 outline-none focus:border-[#FF6C0F]" />
          </label>
          <label className="block text-xs font-bold text-[#6b6b5e]">
            솔루션
            <textarea name="solution" defaultValue={team.solution} className="mt-1 min-h-28 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm leading-6 outline-none focus:border-[#FF6C0F]" />
          </label>
          <label className="block text-xs font-bold text-[#6b6b5e]">
            타깃 고객
            <textarea name="target_customer" defaultValue={team.target_customer} className="mt-1 min-h-24 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm leading-6 outline-none focus:border-[#FF6C0F]" />
          </label>
          <label className="block text-xs font-bold text-[#6b6b5e]">
            핵심 가치
            <textarea name="core_value" defaultValue={team.core_value} className="mt-1 min-h-24 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm leading-6 outline-none focus:border-[#FF6C0F]" />
          </label>
        </div>

        <button disabled={isPending} className="mt-5 h-10 rounded-md bg-[#16140f] px-4 text-xs font-semibold text-white disabled:opacity-50">
          Home 저장
        </button>
      </form>

      <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
        <h3 className="text-sm font-black text-[#16140f]">미리보기</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-3xl font-black">{team.name}</p>
            <p className="mt-2 text-base font-semibold text-[#FF6C0F]">{team.tagline || "한 줄 소개가 아직 없습니다."}</p>
            <p className="mt-4 text-sm leading-6 text-[#6b6b5e]">{team.description || "팀 소개를 입력하면 이곳에 표시됩니다."}</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#ddd9cc] bg-[#f5f5ee]">
            {heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImageUrl} alt={`${team.name} 대표 이미지`} className="h-52 w-full object-cover" />
            ) : (
              <div className="grid h-52 place-items-center text-sm font-semibold text-[#8a877c]">대표 이미지 없음</div>
            )}
          </div>
        </div>
      </section>
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

function KpiEditForm({
  kpi,
  team,
  isPending,
  runAction,
  onCancel,
}: {
  kpi: TeamKpi;
  team: TeamSpaceTeam;
  isPending: boolean;
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) => void;
  onCancel: () => void;
}) {
  const kpiRound = getKpiRound(kpi);
  const [title, setTitle] = useState(kpi.title);
  const [description, setDescription] = useState(kpi.description);
  const [ownerId, setOwnerId] = useState(kpi.owner_id ?? "");
  const [measurementType, setMeasurementType] = useState<KpiMeasurementType>(kpi.measurement_type);
  const [startValue, setStartValue] = useState(kpi.start_value !== null ? String(kpi.start_value) : "");
  const [targetValue, setTargetValue] = useState(String(kpi.target_value));
  const [currentValue, setCurrentValue] = useState(kpi.is_measured ? String(kpi.current_value) : "");
  const [unit, setUnit] = useState(UNIT_OPTIONS.includes(kpi.unit) ? kpi.unit : UNIT_OPTIONS[0]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(getChecklistItems(kpi).length > 0 ? getChecklistItems(kpi) : [{ id: "item-1", text: "", done: false }]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(kpiRound.index);
  const selectedRound = KPI_ROUNDS[selectedRoundIndex] ?? KPI_ROUNDS[0];
  const preview = calculatePreview({ measurementType, startValue, targetValue, currentValue, checklistItems });

  function updateChecklistItem(id: string, update: Partial<ChecklistItem>) {
    setChecklistItems((items) => items.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }

  function addChecklistItem() {
    setChecklistItems((items) => [...items, { id: `edit-item-${Date.now()}`, text: "", done: false }]);
  }

  function removeChecklistItem(id: string) {
    setChecklistItems((items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items));
  }

  return (
    <form onSubmit={(event) => runAction(event, (formData) => updateTeamKpi(kpi.id, formData), onCancel)} className="mt-4 space-y-4 rounded-lg border border-[#ddd9cc] bg-[#fbfaf4] p-3">
      <input type="hidden" name="measurement_type" value={measurementType} />
      <input type="hidden" name="checklist_items" value={JSON.stringify(checklistItems)} />
      <input type="hidden" name="period_start" value={selectedRound.start} />
      <input type="hidden" name="period_end" value={selectedRound.end} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-[#6b6b5e]">
          지표명
          <input name="title" required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
        </label>
        <label className="text-xs font-bold text-[#6b6b5e]">
          담당자 선택
          <select name="owner_id" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
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
        <textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm outline-none focus:border-[#FF6C0F]" />
      </label>

      <label className="block text-xs font-bold text-[#6b6b5e]">
        KPI 회차
        <select value={selectedRoundIndex} onChange={(event) => setSelectedRoundIndex(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
          {KPI_ROUNDS.map((round) => (
            <option key={round.index} value={round.index}>
              {round.label} · {formatDateRange(round.start, round.end)}
            </option>
          ))}
        </select>
      </label>

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
            <select name="unit" required value={unit} onChange={(event) => setUnit(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
              {UNIT_OPTIONS.map((unitOption) => (
                <option key={unitOption} value={unitOption}>
                  {unitOption}
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#6b6b5e]">미리보기</span>
          <span className="text-sm font-black text-[#16140f]">{preview.measured ? `${preview.rate}%` : "미측정"}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${preview.measured ? signalClass(preview.rate) : "bg-[#f0efe6] text-[#6b6b5e]"}`}>
            {preview.measured ? signalLabel(preview.rate) : "미측정"}
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="h-9 rounded-md border border-[#ddd9cc] bg-white px-3 text-xs font-semibold text-[#6b6b5e]">
            취소
          </button>
          <button disabled={isPending} className="h-9 rounded-md bg-[#16140f] px-3 text-xs font-semibold text-white disabled:opacity-50">
            수정 저장
          </button>
        </div>
      </div>
    </form>
  );
}

function CtaReportEditForm({
  post,
  isPending,
  runAction,
  onCancel,
}: {
  post: TeamSpaceTeam["review_posts"][number];
  isPending: boolean;
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={(event) => runAction(event, (formData) => updateTeamReviewPost(post.id, formData), onCancel)} className="mt-4 space-y-3 rounded-lg bg-[#fbfaf4] p-4">
      <label className="block text-xs font-bold text-[#6b6b5e]">
        보고서 제목
        <input name="title" required defaultValue={post.title} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
      </label>
      <label className="block text-xs font-bold text-[#6b6b5e]">
        보고서 본문
        <textarea name="content" defaultValue={post.content} className="mt-1 min-h-48 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm leading-6 outline-none focus:border-[#FF6C0F]" />
      </label>
      <p className="text-xs leading-5 text-[#8a877c]">수정 저장 시 기존 첨부 이미지는 본문 텍스트 기준으로 정리됩니다. 첨부를 새로 구성하려면 새 CTA 보고서로 다시 제출해 주세요.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="h-9 rounded-md border border-[#ddd9cc] bg-white px-3 text-xs font-semibold text-[#6b6b5e]">
          취소
        </button>
        <button disabled={isPending} className="h-9 rounded-md bg-[#16140f] px-3 text-xs font-semibold text-white disabled:opacity-50">
          수정 저장
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
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) => void;
  runVoidAction: (action: () => Promise<{ success: boolean; error?: string }>) => void;
}) {
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [currentCta, setCurrentCta] = useState("");
  const [failurePenalty, setFailurePenalty] = useState("");
  const [previousCta, setPreviousCta] = useState("");
  const [previousResult, setPreviousResult] = useState("달성 완료");
  const [achievementRate, setAchievementRate] = useState("");
  const [previousPenalty, setPreviousPenalty] = useState("");
  const [penaltyResult, setPenaltyResult] = useState("이행 완료");
  const [currentAttachments, setCurrentAttachments] = useState<CtaAttachment[]>([]);
  const [previousAttachments, setPreviousAttachments] = useState<CtaAttachment[]>([]);
  const [penaltyAttachments, setPenaltyAttachments] = useState<CtaAttachment[]>([]);
  const selectedRound = KPI_ROUNDS[selectedRoundIndex] ?? KPI_ROUNDS[0];
  const dashboardTitle = `${selectedRound.label} CTA 보고서`;
  const dashboardDescription = [
    "이번 2주간의 목표",
    `- 핵심 CTA: ${currentCta || "미입력"}`,
    `- 이번 시즌 실패 시 벌칙: ${failurePenalty || "미입력"}`,
    "",
    "지난 시즌 결과 정산",
    `- 목표였던 지난 CTA: ${previousCta || "미입력"}`,
    `- 최종 결과: ${previousResult}`,
    `- 성취율: ${achievementRate || "0"}%`,
    "",
    "지지난 2주 CTA 벌칙 수행 결과",
    `- 벌칙 내용: ${previousPenalty || "미입력"}`,
    `- 수행 결과: ${penaltyResult}`,
  ].join("\n");
  const kpiGroups = groupKpisByRound(team.kpis);
  const ctaReports = team.review_posts
    .filter((post) => post.report_type === "cta")
    .sort((a, b) => new Date(b.period_start ?? b.created_at).getTime() - new Date(a.period_start ?? a.created_at).getTime());
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const allAttachments = [...currentAttachments, ...previousAttachments, ...penaltyAttachments];
  const reportImageUrls = allAttachments.filter((attachment) => attachment.type === "image").map((attachment) => attachment.url);
  const reportFileAttachments = allAttachments
    .filter((attachment) => attachment.type === "file")
    .map((attachment) => ({ name: attachment.name, url: attachment.url }));
  const ctaContentBlocks: CtaContentBlock[] = [
    {
      type: "text",
      variant: "heading2",
      text: `${selectedRound.label} 이번 2주간의 목표`,
    },
    {
      type: "text",
      text: [`- 핵심 CTA: ${currentCta || "미입력"}`, `- 이번 시즌 실패 시 벌칙: ${failurePenalty || "미입력"}`].join("\n"),
    },
    ...currentAttachments.map((attachment): CtaContentBlock => attachment.type === "image" ? { type: "image", url: attachment.url, width: 100 } : { type: "file", name: attachment.name, url: attachment.url }),
    {
      type: "text",
      variant: "heading2",
      text: "지난 시즌 결과 정산",
    },
    {
      type: "text",
      text: [`- 목표였던 지난 CTA: ${previousCta || "미입력"}`, `- 최종 결과: ${previousResult}`, `- 성취율: ${achievementRate || "0"}%`].join("\n"),
    },
    ...previousAttachments.map((attachment): CtaContentBlock => attachment.type === "image" ? { type: "image", url: attachment.url, width: 100 } : { type: "file", name: attachment.name, url: attachment.url }),
    {
      type: "text",
      variant: "heading2",
      text: "지지난 2주 CTA 벌칙 수행 결과",
    },
    {
      type: "text",
      text: [`- 벌칙 내용: ${previousPenalty || "미입력"}`, `- 수행 결과: ${penaltyResult}`].join("\n"),
    },
    ...penaltyAttachments.map((attachment): CtaContentBlock => attachment.type === "image" ? { type: "image", url: attachment.url, width: 100 } : { type: "file", name: attachment.name, url: attachment.url }),
  ];

  function resetKpiForm() {
    setCurrentCta("");
    setFailurePenalty("");
    setPreviousCta("");
    setPreviousResult("달성 완료");
    setAchievementRate("");
    setPreviousPenalty("");
    setPenaltyResult("이행 완료");
    setCurrentAttachments([]);
    setPreviousAttachments([]);
    setPenaltyAttachments([]);
  }

  return (
    <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">CTA 보고서 작성 및 제출</h3>
          <p className="mt-1 text-sm text-[#6b6b5e]">2주 목표, 실패 벌칙, 지난 시즌 결과 정산을 한 번에 기록합니다.</p>
        </div>
        <Target className="h-6 w-6 text-[#FF6C0F]" strokeWidth={2} />
      </div>

      {canManage ? (
        <form onSubmit={(event) => runAction(event, createCtaReport, resetKpiForm)} className="mb-5 space-y-4 rounded-lg bg-[#f5f5ee] p-4">
          <input type="hidden" name="team_id" value={team.id} />
          <input type="hidden" name="content" value={dashboardDescription} />
          <input type="hidden" name="period_start" value={selectedRound.start} />
          <input type="hidden" name="period_end" value={selectedRound.end} />
          <input type="hidden" name="report_title" value={dashboardTitle} />
          <input type="hidden" name="round_number" value={selectedRound.index + 1} />
          <input type="hidden" name="content_blocks" value={JSON.stringify(ctaContentBlocks)} />
          <input type="hidden" name="image_urls" value={JSON.stringify(reportImageUrls)} />
          <input type="hidden" name="file_attachments" value={JSON.stringify(reportFileAttachments)} />

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

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <h4 className="text-base font-black text-[#16140f]">{selectedRound.label} 이번 2주간의 목표</h4>
            <label className="mt-3 block text-xs font-bold text-[#6b6b5e]">
              핵심 CTA
              <textarea required value={currentCta} onChange={(event) => setCurrentCta(event.target.value)} placeholder="이번 2주 동안 달성할 핵심 CTA를 적으세요." className="mt-1 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm outline-none focus:border-[#FF6C0F]" />
            </label>
            <label className="mt-3 block text-xs font-bold text-[#6b6b5e]">
              이번 시즌 실패 시 벌칙
              <input value={failurePenalty} onChange={(event) => setFailurePenalty(event.target.value)} placeholder="이번 CTA 실패 시 다음 2주 동안 수행할 벌칙" className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
            </label>
            <CtaAttachmentField teamId={team.id} attachments={currentAttachments} onChange={setCurrentAttachments} />
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <h4 className="text-base font-black text-[#16140f]">지난 시즌 결과 정산</h4>
            <p className="mt-1 text-xs leading-5 text-[#6b6b5e]">이번 2주 동안 확인하고 수행해야 했던 과거 결과물입니다.</p>
            <label className="mt-3 block text-xs font-bold text-[#6b6b5e]">
              목표였던 지난 CTA
              <textarea value={previousCta} onChange={(event) => setPreviousCta(event.target.value)} placeholder="지난 2주 CTA를 적어주세요." className="mt-1 min-h-16 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm outline-none focus:border-[#FF6C0F]" />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#6b6b5e]">
                최종 결과
                <select value={previousResult} onChange={(event) => setPreviousResult(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
                  <option value="달성 완료">달성 완료</option>
                  <option value="실패">실패</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#6b6b5e]">
                성취율
                <input type="number" min="0" max="100" value={achievementRate} onChange={(event) => setAchievementRate(event.target.value)} placeholder="%" className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
              </label>
            </div>
            <CtaAttachmentField teamId={team.id} attachments={previousAttachments} onChange={setPreviousAttachments} />
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <h4 className="text-base font-black text-[#16140f]">지지난 2주 CTA 벌칙 수행 결과</h4>
            <label className="mt-3 block text-xs font-bold text-[#6b6b5e]">
              벌칙 내용
              <textarea value={previousPenalty} onChange={(event) => setPreviousPenalty(event.target.value)} placeholder="지지난 시즌 실패로 지난 2주 동안 수행해야 했던 벌칙" className="mt-1 min-h-16 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm outline-none focus:border-[#FF6C0F]" />
            </label>
            <label className="mt-3 block text-xs font-bold text-[#6b6b5e]">
              수행 결과
              <select value={penaltyResult} onChange={(event) => setPenaltyResult(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]">
                <option value="이행 완료">이행 완료</option>
                <option value="미이행">미이행</option>
              </select>
            </label>
            <CtaAttachmentField teamId={team.id} attachments={penaltyAttachments} onChange={setPenaltyAttachments} />
          </div>

          <button disabled={isPending} className="h-10 rounded-md bg-[#16140f] px-4 text-xs font-semibold text-white disabled:opacity-50">
            CTA 보고서 제출
          </button>
        </form>
      ) : null}

      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-black text-[#16140f]">제출된 CTA 보고서</h4>
          <span className="text-xs font-bold text-[#FF6C0F]">{ctaReports.length}개</span>
        </div>
        {ctaReports.length === 0 ? (
          <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">아직 제출된 CTA 보고서가 없습니다.</p>
        ) : (
          ctaReports.map((post) => (
            <article key={post.id} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold text-[#16140f]">{post.title}</p>
                  <p className="mt-1 text-xs text-[#6b6b5e]">
                    {post.round_number ? `${post.round_number}회차 · ` : ""}{formatDateRange(post.period_start ?? post.created_at.slice(0, 10), post.period_end ?? post.created_at.slice(0, 10))}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditingReportId((current) => current === post.id ? null : post.id)} className="text-xs font-semibold text-[#16140f]">
                    {editingReportId === post.id ? "수정 닫기" : "수정"}
                  </button>
                  <button type="button" onClick={() => runVoidAction(() => deleteTeamReviewPost(post.id))} className="inline-flex items-center gap-1 text-xs font-semibold text-[#b42318]">
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    삭제
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6b6b5e]">{post.content || "본문 없음"}</p>
              {editingReportId === post.id ? (
                <CtaReportEditForm post={post} isPending={isPending} runAction={runAction} onCancel={() => setEditingReportId(null)} />
              ) : null}
            </article>
          ))
        )}
      </div>

      <div className="space-y-3">
        {team.kpis.length === 0 ? (
          <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">이전 KPI 데이터가 없습니다.</p>
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
                        <span>{formatDateRange(kpi.period_start ?? group.round.start, kpi.period_end ?? group.round.end)} · {kpi.owner?.display_name ?? "팀 공통"}</span>
                        <span className="font-bold text-[#16140f]">{kpi.is_measured ? `${kpi.achievement_rate}%` : "미측정"}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0efe6]">
                        <div className="h-full rounded-full bg-[#FF6C0F]" style={{ width: `${kpi.is_measured ? Math.min(kpi.achievement_rate, 100) : 0}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-[#6b6b5e]">{kpiValueSummary(kpi)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {canDelete ? (
                        <button type="button" onClick={() => runVoidAction(() => deleteTeamKpi(kpi.id))} className="inline-flex items-center gap-1 text-xs font-semibold text-[#b42318]">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          삭제
                        </button>
                      ) : null}
                    </div>
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

function CoffeeChatPanel({
  team,
  canManage,
  isPending,
  runAction,
}: {
  team: TeamSpaceTeam;
  canManage: boolean;
  isPending: boolean;
  runAction: (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) => void;
}) {
  const [mentorName, setMentorName] = useState("");
  const [mentorCareer, setMentorCareer] = useState("");
  const [mentorLinkedIn, setMentorLinkedIn] = useState("");
  const [mentorResources, setMentorResources] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [heldAt, setHeldAt] = useState(todayKey());
  const [meetingTime, setMeetingTime] = useState("");
  const [nextDueAt, setNextDueAt] = useState(twoWeeksLaterKey());
  const [meetingPlace, setMeetingPlace] = useState("");
  const [domainOne, setDomainOne] = useState("");
  const [domainOneQ1, setDomainOneQ1] = useState("");
  const [domainOneQ2, setDomainOneQ2] = useState("");
  const [domainTwo, setDomainTwo] = useState("");
  const [domainTwoQ1, setDomainTwoQ1] = useState("");
  const [domainTwoQ2, setDomainTwoQ2] = useState("");
  const [coffeeChatNotes, setCoffeeChatNotes] = useState("");
  const [photoProof, setPhotoProof] = useState("");
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [applicationPoints, setApplicationPoints] = useState("");
  const [thanksSent, setThanksSent] = useState(false);
  const [thanksMessage, setThanksMessage] = useState("");
  const selectedRound = KPI_ROUNDS.find((round) => heldAt >= round.start && heldAt <= round.end) ?? KPI_ROUNDS[0];
  const summary = [
    "기본 사항",
    `- 멘토 성함: ${mentorName || "미입력"}`,
    `- 멘토 이력: ${mentorCareer || "미입력"}`,
    `- 링크드인 주소: ${mentorLinkedIn || "미입력"}`,
    `- 기타 참고 자료: ${mentorResources || "미입력"}`,
    "",
    "연락 메세지",
    contactMessage || "미입력",
    "",
    "약속",
    `- 날짜와 시간: ${heldAt || "미입력"} ${meetingTime || ""}`.trim(),
    `- 장소 또는 줌 URL: ${meetingPlace || "미입력"}`,
    "",
    "사전 질문",
    `[${domainOne || "도메인 1"}]`,
    `Q1. ${domainOneQ1 || "미입력"}`,
    `Q2. ${domainOneQ2 || "미입력"}`,
    "",
    `[${domainTwo || "도메인 2"}]`,
    `Q1. ${domainTwoQ1 || "미입력"}`,
    `Q2. ${domainTwoQ2 || "미입력"}`,
    "",
    "커피챗 내용",
    coffeeChatNotes || "미입력",
    "",
    "커피챗 사진",
    photoProof || "미입력",
  ].join("\n");
  const decisions = [
    "이후 회의",
    "고민해야 할 점",
    discussionPoints || "미입력",
    "",
    "적용해볼 점",
    applicationPoints || "미입력",
  ].join("\n");
  const nextActions = [
    "사후 감사 메세지",
    `- 발송 여부: ${thanksSent ? "발송 완료" : "미발송"}`,
    thanksMessage || "미입력",
  ].join("\n");

  function resetOfficeHourForm() {
    setMentorName("");
    setMentorCareer("");
    setMentorLinkedIn("");
    setMentorResources("");
    setContactMessage("");
    setHeldAt(todayKey());
    setMeetingTime("");
    setNextDueAt(twoWeeksLaterKey());
    setMeetingPlace("");
    setDomainOne("");
    setDomainOneQ1("");
    setDomainOneQ2("");
    setDomainTwo("");
    setDomainTwoQ1("");
    setDomainTwoQ2("");
    setCoffeeChatNotes("");
    setPhotoProof("");
    setDiscussionPoints("");
    setApplicationPoints("");
    setThanksSent(false);
    setThanksMessage("");
  }

  return (
    <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">커피챗 보고서 작성 및 제출</h3>
          <p className="mt-1 text-sm text-[#6b6b5e]">멘토 커피챗 준비, 진행 메모, 증빙, 후속 액션을 기록하고 공유합니다.</p>
        </div>
        <Coffee className="h-6 w-6 text-[#FF6C0F]" strokeWidth={2} />
      </div>

      {canManage ? (
        <form onSubmit={(event) => runAction(event, createOfficeHour, resetOfficeHourForm)} className="mb-5 space-y-3 rounded-lg bg-[#f5f5ee] p-3">
          <input type="hidden" name="team_id" value={team.id} />
          <input type="hidden" name="summary" value={summary} />
          <input type="hidden" name="decisions" value={decisions} />
          <input type="hidden" name="next_actions" value={nextActions} />
          <input type="hidden" name="publish_report" value="true" />
          <input type="hidden" name="report_type" value="coffee_chat" />
          <input type="hidden" name="report_title" value={`${selectedRound.label} 커피챗 보고서`} />
          <input type="hidden" name="round_number" value={selectedRound.index + 1} />
          <input type="hidden" name="period_start" value={selectedRound.start} />
          <input type="hidden" name="period_end" value={selectedRound.end} />
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <h4 className="text-base font-black text-[#16140f]">기본 사항</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#6b6b5e]">
                멘토 성함
                <input required value={mentorName} onChange={(event) => setMentorName(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
              </label>
              <label className="text-xs font-semibold text-[#6b6b5e]">
                링크드인 주소
                <input value={mentorLinkedIn} onChange={(event) => setMentorLinkedIn(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
              </label>
            </div>
            <label className="mt-3 block text-xs font-semibold text-[#6b6b5e]">
              이력
              <textarea value={mentorCareer} onChange={(event) => setMentorCareer(event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
            </label>
            <label className="mt-3 block text-xs font-semibold text-[#6b6b5e]">
              기타 참고 자료
              <textarea value={mentorResources} onChange={(event) => setMentorResources(event.target.value)} placeholder="URL, 이미지 링크 등" className="mt-1 min-h-16 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
            </label>
          </div>

          <label className="block rounded-lg border border-[#ddd9cc] bg-white p-4 text-xs font-semibold text-[#6b6b5e]">
            연락 메세지
            <textarea value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm font-normal text-[#16140f]" />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-[#6b6b5e]">
              커피챗 날짜
              <input name="held_at" type="date" value={heldAt} onChange={(event) => setHeldAt(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
            </label>
            <label className="text-xs font-semibold text-[#6b6b5e]">
              시간
              <input type="time" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
            </label>
            <label className="text-xs font-semibold text-[#6b6b5e]">
              후속 회의 예정일
              <input name="next_due_at" type="date" value={nextDueAt} onChange={(event) => setNextDueAt(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
            </label>
          </div>
          <label className="block text-xs font-semibold text-[#6b6b5e]">
            장소 또는 줌 URL
            <input value={meetingPlace} onChange={(event) => setMeetingPlace(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
          </label>
          <div>
            <p className="mb-2 text-xs font-semibold text-[#6b6b5e]">참석자</p>
            <TeamMemberCheckboxes profiles={team.members.map((member) => member.profile).filter((profile): profile is TeamSpaceProfile => Boolean(profile))} name="attendee_ids" />
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <h4 className="text-base font-black text-[#16140f]">사전 질문</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <input value={domainOne} onChange={(event) => setDomainOne(event.target.value)} placeholder="도메인 1" className="h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
                <input value={domainOneQ1} onChange={(event) => setDomainOneQ1(event.target.value)} placeholder="Q1." className="h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
                <input value={domainOneQ2} onChange={(event) => setDomainOneQ2(event.target.value)} placeholder="Q2." className="h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <input value={domainTwo} onChange={(event) => setDomainTwo(event.target.value)} placeholder="도메인 2" className="h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
                <input value={domainTwoQ1} onChange={(event) => setDomainTwoQ1(event.target.value)} placeholder="Q1." className="h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
                <input value={domainTwoQ2} onChange={(event) => setDomainTwoQ2(event.target.value)} placeholder="Q2." className="h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm" />
              </div>
            </div>
          </div>

          <label className="block rounded-lg border border-[#ddd9cc] bg-white p-4 text-xs font-semibold text-[#6b6b5e]">
            커피챗 내용
            <textarea value={coffeeChatNotes} onChange={(event) => setCoffeeChatNotes(event.target.value)} placeholder="메모" className="mt-2 min-h-32 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm font-normal text-[#16140f]" />
          </label>

          <label className="block rounded-lg border border-[#ddd9cc] bg-white p-4 text-xs font-semibold text-[#6b6b5e]">
            커피챗 사진 (증빙)
            <input name="photo_proof" value={photoProof} onChange={(event) => setPhotoProof(event.target.value)} placeholder="멘토와 참여자 얼굴이 모두 포함된 증빙 링크" className="mt-2 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm font-normal text-[#16140f]" />
          </label>

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <h4 className="text-base font-black text-[#16140f]">이후 회의</h4>
            <label className="mt-3 block text-xs font-semibold text-[#6b6b5e]">
              고민해야 할 점
              <textarea value={discussionPoints} onChange={(event) => setDiscussionPoints(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
            </label>
            <label className="mt-3 block text-xs font-semibold text-[#6b6b5e]">
              적용해볼 점
              <textarea value={applicationPoints} onChange={(event) => setApplicationPoints(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
            </label>
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#16140f]">
              <input type="checkbox" checked={thanksSent} onChange={(event) => setThanksSent(event.target.checked)} className="h-4 w-4 rounded border-[#c9c3b5] text-[#FF6C0F]" />
              사후 감사 메세지 발송
            </label>
            <textarea value={thanksMessage} onChange={(event) => setThanksMessage(event.target.value)} placeholder="감사 메세지 내용" className="mt-3 min-h-20 w-full rounded-lg border border-[#ddd9cc] p-3 text-sm" />
          </div>

          <button disabled={isPending} className="h-9 rounded-md bg-[#16140f] px-3 text-xs font-semibold text-white disabled:opacity-50">
            커피챗 보고서 제출
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {team.office_hours.length === 0 ? (
          <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">아직 커피챗 기록이 없습니다.</p>
        ) : (
          team.office_hours.map((officeHour) => (
            <article key={officeHour.id} className="rounded-lg border border-[#ddd9cc] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-bold">
                  <Clock3 className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
                  {formatDate(officeHour.held_at)}
                </p>
                <span className="text-xs text-[#6b6b5e]">후속 {formatDate(officeHour.next_due_at)}</span>
              </div>
              <div className="space-y-3 text-sm leading-6">
                <p><span className="font-semibold">커피챗 내용</span> {officeHour.summary || "기록 없음"}</p>
                <p><span className="font-semibold">이후 회의</span> {officeHour.decisions || "기록 없음"}</p>
                <p><span className="font-semibold">후속 액션</span> {officeHour.next_actions || "기록 없음"}</p>
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
    { id: "kpi", label: "CTA", icon: <Target className="h-4 w-4" strokeWidth={2} /> },
    { id: "coffee-chat", label: "커피챗", icon: <Coffee className="h-4 w-4" strokeWidth={2} /> },
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
  const canDeleteTeamKpis = true;

  function runAction(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) {
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
      onSuccess?.();
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
              내가 속한 팀의 2주 KPI와 커피챗 기록을 확인하고 달성률을 업데이트합니다. 여러 팀에 속해 있다면 왼쪽에서 팀을 선택할 수 있습니다.
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
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-3">
              {initialData.teams.map((team) => {
                const latestOfficeHour = team.office_hours[0];
                const activeKpisForTeam = team.kpis.filter((kpi) => kpi.status !== "achieved");
                return (
                  <Link
                    key={team.id}
                    href={`/team-space/${team.id}`}
                    prefetch={false}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setActivePanel("home");
                    }}
                    className={`block rounded-lg border p-4 transition-colors ${
                      selectedTeam?.id === team.id ? "border-[#FF6C0F] bg-white" : "border-[#ddd9cc] bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
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
              <section className="min-w-0 space-y-6">
                <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
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

                {activePanel === "home" ? <TeamDashboard team={selectedTeam} isPending={isPending} runAction={runAction} /> : activePanel === "kpi" ? (
                  <KpiPanel
                    team={selectedTeam}
                    canManage={true}
                    canDelete={canDeleteTeamKpis}
                    isPending={isPending}
                    runAction={runAction}
                    runVoidAction={runVoidAction}
                  />
                ) : activePanel === "coffee-chat" ? (
                  <CoffeeChatPanel
                    team={selectedTeam}
                    canManage={true}
                    isPending={isPending}
                    runAction={runAction}
                  />
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
