"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, TeamKpiStatus } from "@/lib/supabase/types";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "name" | "first_name" | "last_name" | "role" | "photo" | "is_admin"
>;
type StartupTeamRow = Database["public"]["Tables"]["startup_teams"]["Row"];
type StartupTeamMemberRow = Database["public"]["Tables"]["startup_team_members"]["Row"];
type TeamKpiRow = Database["public"]["Tables"]["team_kpis"]["Row"];
type TeamKpiTemplateRow = Database["public"]["Tables"]["team_kpi_templates"]["Row"];
type TeamReviewPostRow = Database["public"]["Tables"]["team_review_posts"]["Row"];
type OfficeHourRow = Database["public"]["Tables"]["office_hours"]["Row"];
type OfficeHourAttendeeRow = Database["public"]["Tables"]["office_hour_attendees"]["Row"];

export type TeamSpaceProfile = ProfileRow & { display_name: string };
export type TeamSpaceMember = StartupTeamMemberRow & { profile: TeamSpaceProfile | null };
export type TeamSpaceKpi = TeamKpiRow & {
  owner: TeamSpaceProfile | null;
  creator: TeamSpaceProfile | null;
  achievement_rate: number;
};
export type TeamSpaceOfficeHour = OfficeHourRow & {
  creator: TeamSpaceProfile | null;
  attendees: TeamSpaceProfile[];
};
export type TeamSpaceTeam = StartupTeamRow & {
  lead_preneur: TeamSpaceProfile | null;
  members: TeamSpaceMember[];
  kpis: TeamSpaceKpi[];
  office_hours: TeamSpaceOfficeHour[];
};
export type TeamSpaceData = {
  currentUser: TeamSpaceProfile;
  isManager: boolean;
  teams: TeamSpaceTeam[];
  eligibleProfiles: TeamSpaceProfile[];
  kpiTemplates: TeamKpiTemplateRow[];
  setupError?: string;
};

export type TeamBuildingKpi = TeamKpiRow & {
  team: Pick<StartupTeamRow, "id" | "name" | "batch" | "lead_preneur_id"> | null;
  owner: TeamSpaceProfile | null;
  achievement_rate: number;
};
export type TeamBuildingReviewPost = TeamReviewPostRow & {
  team: Pick<StartupTeamRow, "id" | "name" | "batch" | "lead_preneur_id"> | null;
  author: TeamSpaceProfile | null;
  linked_kpis: TeamBuildingKpi[];
};

export type TeamBuildingWeek = {
  label: string;
  startDate: string;
  kpis: TeamBuildingKpi[];
  reviewPosts: TeamBuildingReviewPost[];
};

export type TeamBuildingData = {
  weeks: TeamBuildingWeek[];
  teams: Array<Pick<StartupTeamRow, "id" | "name" | "batch" | "lead_preneur_id">>;
  writableTeamIds: string[];
  setupError?: string;
};

type ActionResult = { success: true } | { success: false; error: string };
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type KpiMeasurementType = "numeric" | "reduce" | "checklist";
type ChecklistItem = { id: string; text: string; done: boolean };
type ReviewContentBlock =
  | { type: "text"; text: string; variant?: "paragraph" | "heading1" | "heading2" | "heading3" }
  | { type: "blocknote"; blocks: unknown[]; markdown?: string }
  | { type: "kpi"; kpiId: string }
  | { type: "image"; url: string; width?: number }
  | { type: "file"; name: string; url: string };

const KPI_MEASUREMENT_TYPES = new Set<KpiMeasurementType>(["numeric", "reduce", "checklist"]);

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalId(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readIds(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
    .map((value) => value.trim())
    .filter(Boolean);
}

function readStringArrayJson(formData: FormData, key: string) {
  const rawValue = readText(formData, key);
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0) : [];
  } catch {
    return [];
  }
}

function readFileAttachmentsJson(formData: FormData, key: string) {
  const rawValue = readText(formData, key);
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue) as Array<Partial<{ name: string; url: string }>>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        name: typeof item.name === "string" ? item.name.trim() : "",
        url: typeof item.url === "string" ? item.url.trim() : "",
      }))
      .filter((item) => item.name && item.url);
  } catch {
    return [];
  }
}

function readReviewContentBlocks(formData: FormData): ReviewContentBlock[] {
  const rawValue = readText(formData, "content_blocks");
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue) as Array<Partial<ReviewContentBlock>>;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((block): ReviewContentBlock[] => {
      if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
        const variant = block.variant === "heading1" || block.variant === "heading2" || block.variant === "heading3" ? block.variant : "paragraph";
        return [{ type: "text", text: block.text.trim(), variant }];
      }
      if (block.type === "blocknote" && Array.isArray(block.blocks)) {
        const markdown = typeof block.markdown === "string" ? block.markdown.trim() : "";
        return [{ type: "blocknote", blocks: block.blocks, markdown }];
      }
      if (block.type === "kpi" && typeof block.kpiId === "string" && block.kpiId.trim()) {
        return [{ type: "kpi", kpiId: block.kpiId.trim() }];
      }
      if (block.type === "image" && typeof block.url === "string" && block.url.trim()) {
        const width = typeof block.width === "number" && Number.isFinite(block.width) ? Math.min(100, Math.max(25, Math.round(block.width))) : 100;
        return [{ type: "image", url: block.url.trim(), width }];
      }
      if (block.type === "file" && typeof block.name === "string" && typeof block.url === "string" && block.name.trim() && block.url.trim()) {
        return [{ type: "file", name: block.name.trim(), url: block.url.trim() }];
      }
      return [];
    });
  } catch {
    return [];
  }
}

function readOptionalNumber(formData: FormData, key: string) {
  const value = readText(formData, key);
  if (!value) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : Number.NaN;
}

function readChecklistItems(formData: FormData): ChecklistItem[] {
  const rawValue = readText(formData, "checklist_items");
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue) as Array<Partial<ChecklistItem>>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => ({
        id: typeof item.id === "string" && item.id ? item.id : `item-${index + 1}`,
        text: typeof item.text === "string" ? item.text.trim() : "",
        done: item.done === true,
      }))
      .filter((item) => item.text.length > 0);
  } catch {
    return [];
  }
}

function displayName(profile: ProfileRow) {
  if (profile.last_name || profile.first_name) {
    return `${profile.last_name ?? ""}${profile.first_name ?? ""}`.trim();
  }
  return profile.name?.trim() || "이름 미입력";
}

function toTeamSpaceProfile(profile: ProfileRow): TeamSpaceProfile {
  return { ...profile, display_name: displayName(profile) };
}

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/team-space");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, first_name, last_name, role, photo, is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/");
  }

  const role = normalizeRole(profile.role);
  const isAdminFlag = profile.is_admin === true;
  const isManager = role === "preneur" || isAdminFlag;

  if (role !== "learner" && !isManager) {
    redirect("/");
  }

  return { supabase, user, profile: toTeamSpaceProfile(profile), role, isManager, isAdminFlag };
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function isMissingTeamSpaceSchema(error: { code?: string; message?: string } | null | undefined) {
  return (
    error?.code === "42P01" ||
    error?.message?.includes("startup_team") ||
    error?.message?.includes("team_kpis") ||
    error?.message?.includes("team_kpi_templates") ||
    error?.message?.includes("team_review_posts") ||
    error?.message?.includes("team_ctas") ||
    error?.message?.includes("office_hours")
  );
}

function clampRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function achievementRate(kpi: Pick<TeamKpiRow, "measurement_type" | "start_value" | "current_value" | "target_value" | "is_measured" | "checklist_items">) {
  if (!kpi.is_measured) return 0;

  if (kpi.measurement_type === "checklist") {
    const items = Array.isArray(kpi.checklist_items) ? kpi.checklist_items : [];
    if (items.length === 0) return 0;
    const doneCount = items.filter((item) => item.done).length;
    return clampRate(doneCount / items.length * 100);
  }

  if (kpi.measurement_type === "reduce") {
    const startValue = kpi.start_value;
    const denominator = startValue !== null ? startValue - kpi.target_value : 0;
    if (!Number.isFinite(denominator) || denominator <= 0) return 0;
    return clampRate((startValue! - kpi.current_value) / denominator * 100);
  }

  if (!Number.isFinite(kpi.target_value) || kpi.target_value <= 0) return 0;
  return clampRate(kpi.current_value / kpi.target_value * 100);
}

function statusFromRate(isMeasured: boolean, rate: number): TeamKpiStatus {
  if (!isMeasured) return "planned";
  if (rate >= 80) return "achieved";
  if (rate >= 50) return "in_progress";
  return "missed";
}

async function canAccessTeam(teamId: string, profileId: string, isAdminFlag: boolean) {
  if (isAdminFlag) {
    return true;
  }

  const supabase = await createClient();
  const [{ data: membership }, { data: leadTeam }] = await Promise.all([
    supabase
    .from("startup_team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("profile_id", profileId)
      .maybeSingle(),
    supabase
      .from("startup_teams")
      .select("id")
      .eq("id", teamId)
      .eq("lead_preneur_id", profileId)
      .maybeSingle(),
  ]);

  return Boolean(membership || leadTeam);
}

function revalidateTeamSpace(teamId?: string) {
  revalidatePath("/team-space");
  revalidatePath("/admin/teams");
  if (teamId) {
    revalidatePath(`/team-space/${teamId}`);
  }
}

async function getScopedTeamIds(profileId: string, isManager: boolean) {
  const supabase = await createClient();
  const { data: myMemberships, error: membershipsError } = await supabase
    .from("startup_team_members")
    .select("team_id")
    .eq("profile_id", profileId);

  if (membershipsError) {
    return { teamIds: [] as string[], error: membershipsError };
  }

  let leadTeamIds: string[] = [];
  if (isManager) {
    const { data: leadTeams, error: leadTeamsError } = await supabase
      .from("startup_teams")
      .select("id")
      .eq("lead_preneur_id", profileId);

    if (leadTeamsError) {
      return { teamIds: [] as string[], error: leadTeamsError };
    }

    leadTeamIds = (leadTeams ?? []).map((team) => team.id);
  }

  return {
    teamIds: unique([...(myMemberships ?? []).map((membership) => membership.team_id), ...leadTeamIds]),
    error: null,
  };
}

async function loadTeamSpaceData({ adminScope }: { adminScope: boolean }): Promise<TeamSpaceData> {
  const { supabase, profile, isManager } = await getAuthContext();

  if (adminScope && !isManager) {
    redirect("/");
  }

  let teamIds: string[] | null = null;
  if (!adminScope) {
    const { teamIds: scopedTeamIds, error } = await getScopedTeamIds(profile.id, isManager);
    if (error) {
      if (isMissingTeamSpaceSchema(error)) {
        return {
          currentUser: profile,
          isManager,
          teams: [],
          eligibleProfiles: [],
          kpiTemplates: [],
          setupError: "팀스페이스 DB 마이그레이션이 아직 적용되지 않았습니다.",
        };
      }
      throw new Error(error.message);
    }

    teamIds = scopedTeamIds;
    if (teamIds.length === 0) {
      return {
        currentUser: profile,
        isManager,
        teams: [],
        eligibleProfiles: [],
        kpiTemplates: [],
      };
    }
  }

  let teamQuery = supabase.from("startup_teams").select("*").order("created_at", { ascending: false });
  if (teamIds) {
    teamQuery = teamQuery.in("id", teamIds);
  }
  const { data: teams, error: teamsError } = await teamQuery;
  if (teamsError) {
    if (isMissingTeamSpaceSchema(teamsError)) {
      return {
        currentUser: profile,
        isManager,
        teams: [],
        eligibleProfiles: [],
        kpiTemplates: [],
        setupError: "팀스페이스 DB 마이그레이션이 아직 적용되지 않았습니다.",
      };
    }
    throw new Error(teamsError.message);
  }

  const visibleTeamIds = (teams ?? []).map((team) => team.id);
  if (visibleTeamIds.length === 0) {
    const eligibleProfiles = isManager ? await getEligibleProfiles(supabase) : [];
    return {
      currentUser: profile,
      isManager,
      teams: [],
      eligibleProfiles,
      kpiTemplates: await getKpiTemplates(supabase),
    };
  }

  const [
    { data: memberships, error: membershipsError },
    { data: kpis, error: kpisError },
    { data: officeHours, error: officeHoursError },
  ] = await Promise.all([
    supabase.from("startup_team_members").select("*").in("team_id", visibleTeamIds),
    supabase.from("team_kpis").select("*").in("team_id", visibleTeamIds).order("period_end", { ascending: true }),
    supabase.from("office_hours").select("*").in("team_id", visibleTeamIds).order("held_at", { ascending: false }),
  ]);

  if (membershipsError) throw new Error(membershipsError.message);
  if (kpisError) throw new Error(kpisError.message);
  if (officeHoursError) throw new Error(officeHoursError.message);

  const officeHourIds = (officeHours ?? []).map((officeHour) => officeHour.id);
  const { data: attendees, error: attendeesError } = officeHourIds.length
    ? await supabase.from("office_hour_attendees").select("*").in("office_hour_id", officeHourIds)
    : { data: [] as OfficeHourAttendeeRow[], error: null };

  if (attendeesError) {
    throw new Error(attendeesError.message);
  }

  const profileIds = unique([
    profile.id,
    ...(teams ?? []).flatMap((team) => [team.lead_preneur_id, team.created_by]),
    ...(memberships ?? []).map((membership) => membership.profile_id),
    ...(kpis ?? []).flatMap((kpi) => [kpi.owner_id, kpi.created_by]),
    ...(officeHours ?? []).map((officeHour) => officeHour.created_by),
    ...(attendees ?? []).map((attendee) => attendee.profile_id),
  ]);

  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, first_name, last_name, role, photo, is_admin")
    .in("id", profileIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileMap = new Map((profileRows ?? []).map((row) => [row.id, toTeamSpaceProfile(row)]));
  const membershipsByTeam = new Map<string, TeamSpaceMember[]>();
  for (const membership of memberships ?? []) {
    const rows = membershipsByTeam.get(membership.team_id) ?? [];
    rows.push({ ...membership, profile: profileMap.get(membership.profile_id) ?? null });
    membershipsByTeam.set(membership.team_id, rows);
  }

  const kpisByTeam = new Map<string, TeamSpaceKpi[]>();
  for (const kpi of kpis ?? []) {
    const rows = kpisByTeam.get(kpi.team_id) ?? [];
    rows.push({
      ...kpi,
      owner: kpi.owner_id ? profileMap.get(kpi.owner_id) ?? null : null,
      creator: kpi.created_by ? profileMap.get(kpi.created_by) ?? null : null,
      achievement_rate: achievementRate(kpi),
    });
    kpisByTeam.set(kpi.team_id, rows);
  }

  const attendeesByOfficeHour = new Map<string, TeamSpaceProfile[]>();
  for (const attendee of attendees ?? []) {
    const rows = attendeesByOfficeHour.get(attendee.office_hour_id) ?? [];
    const attendeeProfile = profileMap.get(attendee.profile_id);
    if (attendeeProfile) {
      rows.push(attendeeProfile);
    }
    attendeesByOfficeHour.set(attendee.office_hour_id, rows);
  }

  const officeHoursByTeam = new Map<string, TeamSpaceOfficeHour[]>();
  for (const officeHour of officeHours ?? []) {
    const rows = officeHoursByTeam.get(officeHour.team_id) ?? [];
    rows.push({
      ...officeHour,
      creator: officeHour.created_by ? profileMap.get(officeHour.created_by) ?? null : null,
      attendees: attendeesByOfficeHour.get(officeHour.id) ?? [],
    });
    officeHoursByTeam.set(officeHour.team_id, rows);
  }

  const [eligibleProfiles, kpiTemplates] = await Promise.all([
    isManager ? getEligibleProfiles(supabase) : Promise.resolve([]),
    getKpiTemplates(supabase),
  ]);

  return {
    currentUser: profile,
    isManager,
    eligibleProfiles,
    kpiTemplates,
    teams: (teams ?? []).map((team) => ({
      ...team,
      lead_preneur: team.lead_preneur_id ? profileMap.get(team.lead_preneur_id) ?? null : null,
      members: membershipsByTeam.get(team.id) ?? [],
      kpis: kpisByTeam.get(team.id) ?? [],
      office_hours: officeHoursByTeam.get(team.id) ?? [],
    })),
  };
}

export async function getTeamSpaceData(): Promise<TeamSpaceData> {
  return loadTeamSpaceData({ adminScope: false });
}

export async function getAdminTeamSpaceData(): Promise<TeamSpaceData> {
  return loadTeamSpaceData({ adminScope: true });
}

export async function getMyTeamSpacePath(): Promise<string> {
  const { profile, isManager } = await getAuthContext();

  const { teamIds, error } = await getScopedTeamIds(profile.id, isManager);

  if (isMissingTeamSpaceSchema(error)) {
    return "/team-space";
  }

  if (error) {
    return "/team-space";
  }

  return teamIds.length === 1 ? `/team-space/${teamIds[0]}` : "/team-space";
}

const KPI_ROUND_START = "2026-06-26";
const KPI_ROUND_DAYS = 14;

function addDaysKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function kpiRoundStartKey(dateValue: string) {
  const startMs = new Date(`${KPI_ROUND_START}T00:00:00`).getTime();
  const dateMs = new Date(dateValue).getTime();
  const elapsedRounds = Math.max(0, Math.floor((dateMs - startMs) / (KPI_ROUND_DAYS * 24 * 60 * 60 * 1000)));
  return addDaysKey(KPI_ROUND_START, elapsedRounds * KPI_ROUND_DAYS);
}

function formatRoundLabel(startDate: string) {
  const startMs = new Date(`${KPI_ROUND_START}T00:00:00`).getTime();
  const roundIndex = Math.max(0, Math.floor((new Date(`${startDate}T00:00:00`).getTime() - startMs) / (KPI_ROUND_DAYS * 24 * 60 * 60 * 1000)));
  const formattedStart = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(startDate));
  const formattedEnd = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(addDaysKey(startDate, KPI_ROUND_DAYS - 1)));
  return `${roundIndex + 1}회차 · ${formattedStart} - ${formattedEnd}`;
}

export async function getTeamBuilding2026Data(): Promise<TeamBuildingData> {
  const { profile, isManager } = await getAuthContext();
  const { teamIds: writableTeamIds } = await getScopedTeamIds(profile.id, isManager);

  const supabase = createAdminClient();
  const { data: teams, error: teamsError } = await supabase
    .from("startup_teams")
    .select("id, name, batch, lead_preneur_id")
    .order("created_at", { ascending: true });

  if (isMissingTeamSpaceSchema(teamsError)) {
    return { teams: [], weeks: [], writableTeamIds: [], setupError: "팀스페이스 DB 마이그레이션이 아직 적용되지 않았습니다." };
  }
  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const { data: kpis, error: kpisError } = await supabase
    .from("team_kpis")
    .select("*")
    .order("created_at", { ascending: true });

  if (isMissingTeamSpaceSchema(kpisError)) {
    return { teams: teams ?? [], weeks: [], writableTeamIds, setupError: "팀스페이스 DB 마이그레이션이 아직 적용되지 않았습니다." };
  }
  if (kpisError) {
    throw new Error(kpisError.message);
  }

  const { data: reviewPosts, error: reviewPostsError } = await supabase
    .from("team_review_posts")
    .select("*")
    .order("created_at", { ascending: true });

  if (isMissingTeamSpaceSchema(reviewPostsError)) {
    return { teams: teams ?? [], weeks: [], writableTeamIds, setupError: "팀 리뷰 글 DB 마이그레이션이 아직 적용되지 않았습니다." };
  }
  if (reviewPostsError) {
    throw new Error(reviewPostsError.message);
  }

  const profileIds = unique([...(kpis ?? []).map((kpi) => kpi.owner_id), ...(reviewPosts ?? []).map((post) => post.author_id)]);
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, first_name, last_name, role, photo, is_admin")
        .in("id", profileIds)
    : { data: [] as ProfileRow[], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const teamMap = new Map((teams ?? []).map((team) => [team.id, team]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, toTeamSpaceProfile(profile)]));
  const kpiMap = new Map<string, TeamBuildingKpi>();
  const grouped = new Map<string, { kpis: TeamBuildingKpi[]; reviewPosts: TeamBuildingReviewPost[] }>();

  for (const kpi of kpis ?? []) {
    const basis = kpi.period_start ?? kpi.period_end ?? kpi.created_at;
    const weekKey = kpiRoundStartKey(basis);
    const group = grouped.get(weekKey) ?? { kpis: [], reviewPosts: [] };
    const row = {
      ...kpi,
      team: teamMap.get(kpi.team_id) ?? null,
      owner: kpi.owner_id ? profileMap.get(kpi.owner_id) ?? null : null,
      achievement_rate: achievementRate(kpi),
    };
    group.kpis.push(row);
    kpiMap.set(kpi.id, row);
    grouped.set(weekKey, group);
  }

  for (const post of reviewPosts ?? []) {
    const weekKey = kpiRoundStartKey(post.created_at);
    const group = grouped.get(weekKey) ?? { kpis: [], reviewPosts: [] };
    group.reviewPosts.push({
      ...post,
      team: teamMap.get(post.team_id) ?? null,
      author: post.author_id ? profileMap.get(post.author_id) ?? null : null,
      linked_kpis: post.kpi_ids.map((kpiId) => kpiMap.get(kpiId)).filter((kpi): kpi is TeamBuildingKpi => Boolean(kpi)),
    });
    grouped.set(weekKey, group);
  }

  const weekKeys = Array.from(grouped.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return {
    teams: teams ?? [],
    writableTeamIds,
    weeks: weekKeys.map((weekKey) => ({
      label: formatRoundLabel(weekKey),
      startDate: weekKey,
      kpis: grouped.get(weekKey)?.kpis ?? [],
      reviewPosts: grouped.get(weekKey)?.reviewPosts ?? [],
    })),
  };
}

async function getEligibleProfiles(supabase: SupabaseServerClient): Promise<TeamSpaceProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, first_name, last_name, role, photo, is_admin")
    .in("role", ["learner", "preneur"])
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toTeamSpaceProfile);
}

async function getKpiTemplates(supabase: SupabaseServerClient): Promise<TeamKpiTemplateRow[]> {
  const { data, error } = await supabase
    .from("team_kpi_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (isMissingTeamSpaceSchema(error)) {
    return [];
  }

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createStartupTeam(formData: FormData): Promise<ActionResult> {
  const { supabase, profile, isManager } = await getAuthContext();
  if (!isManager) {
    return { success: false, error: "팀을 생성할 권한이 없습니다." };
  }

  const name = readText(formData, "name");
  if (!name) {
    return { success: false, error: "팀명을 입력해 주세요." };
  }

  const leadPreneurId = readOptionalId(formData, "lead_preneur_id");
  const memberIds = unique([...readIds(formData, "member_ids"), leadPreneurId]);

  const { data: team, error } = await supabase
    .from("startup_teams")
    .insert({
      name,
      description: readText(formData, "description"),
      batch: readText(formData, "batch") || "4",
      lead_preneur_id: leadPreneurId,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (memberIds.length > 0) {
    const { error: membersError } = await supabase.from("startup_team_members").insert(
      memberIds.map((memberId) => ({
        team_id: team.id,
        profile_id: memberId,
        role_in_team: memberId === leadPreneurId ? "담당 프러너" : "팀원",
      })),
    );

    if (membersError) {
      return { success: false, error: membersError.message };
    }
  }

  revalidateTeamSpace(team.id);
  return { success: true };
}

export async function updateStartupTeamMembers(teamId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, isManager } = await getAuthContext();
  if (!isManager) {
    return { success: false, error: "팀원을 수정할 권한이 없습니다." };
  }

  const leadPreneurId = readOptionalId(formData, "lead_preneur_id");
  const memberIds = unique([...readIds(formData, "member_ids"), leadPreneurId]);

  const { error: teamError } = await supabase
    .from("startup_teams")
    .update({
      lead_preneur_id: leadPreneurId,
      name: readText(formData, "name"),
      description: readText(formData, "description"),
      batch: readText(formData, "batch") || "4",
    })
    .eq("id", teamId);

  if (teamError) {
    return { success: false, error: teamError.message };
  }

  const { error: deleteError } = await supabase.from("startup_team_members").delete().eq("team_id", teamId);
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  if (memberIds.length > 0) {
    const { error: insertError } = await supabase.from("startup_team_members").insert(
      memberIds.map((memberId) => ({
        team_id: teamId,
        profile_id: memberId,
        role_in_team: memberId === leadPreneurId ? "담당 프러너" : "팀원",
      })),
    );

    if (insertError) {
      return { success: false, error: insertError.message };
    }
  }

  revalidateTeamSpace(teamId);
  return { success: true };
}

export async function createTeamKpi(formData: FormData): Promise<ActionResult> {
  const { profile, isAdminFlag } = await getAuthContext();

  const teamId = readText(formData, "team_id");
  const title = readText(formData, "title");
  const measurementType = readText(formData, "measurement_type") as KpiMeasurementType;
  const ownerId = readOptionalId(formData, "owner_id");
  const periodStart = readText(formData, "period_start");
  const periodEnd = readText(formData, "period_end");

  if (!teamId || !title || !periodStart || !periodEnd || !KPI_MEASUREMENT_TYPES.has(measurementType)) {
    return { success: false, error: "필수 KPI 정보를 모두 입력해 주세요." };
  }

  if (!(await canAccessTeam(teamId, profile.id, isAdminFlag))) {
    return { success: false, error: "이 팀의 KPI를 생성할 권한이 없습니다." };
  }

  let startValue: number | null = null;
  let targetValue = 0;
  let currentValue = 0;
  let isMeasured = false;
  let checklistItems: ChecklistItem[] = [];
  let unit = readText(formData, "unit");

  if (measurementType === "checklist") {
    checklistItems = readChecklistItems(formData);
    if (checklistItems.length === 0) {
      return { success: false, error: "체크리스트 항목을 1개 이상 입력해 주세요." };
    }
    targetValue = checklistItems.length;
    currentValue = checklistItems.filter((item) => item.done).length;
    isMeasured = checklistItems.length > 0;
    unit = "개";
  } else {
    targetValue = readOptionalNumber(formData, "target_value") ?? Number.NaN;
    const optionalCurrentValue = readOptionalNumber(formData, "current_value");

    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      return { success: false, error: "목표값은 0보다 큰 숫자여야 합니다." };
    }

    if (optionalCurrentValue !== null && (!Number.isFinite(optionalCurrentValue) || optionalCurrentValue < 0)) {
      return { success: false, error: "현재값은 0 이상의 숫자여야 합니다." };
    }

    currentValue = optionalCurrentValue ?? 0;
    isMeasured = optionalCurrentValue !== null;

    if (measurementType === "reduce") {
      startValue = readOptionalNumber(formData, "start_value");
      if (startValue === null || !Number.isFinite(startValue)) {
        return { success: false, error: "감소 목표형은 시작값이 필요합니다." };
      }
      if (startValue <= targetValue) {
        return { success: false, error: "감소 목표형은 시작값이 목표값보다 커야 합니다." };
      }
    }
  }

  const adminSupabase = createAdminClient();
  const status = statusFromRate(
    isMeasured,
    achievementRate({ measurement_type: measurementType, start_value: startValue, current_value: currentValue, target_value: targetValue, is_measured: isMeasured, checklist_items: checklistItems }),
  );
  const { error } = await adminSupabase.from("team_kpis").insert({
    team_id: teamId,
    title,
    description: readText(formData, "description"),
    owner_id: ownerId,
    period_start: periodStart,
    period_end: periodEnd,
    measurement_type: measurementType,
    start_value: startValue,
    target_value: targetValue,
    current_value: currentValue,
    unit,
    is_measured: isMeasured,
    checklist_items: checklistItems,
    status,
    created_by: profile.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTeamSpace(teamId);
  return { success: true };
}

export async function updateTeamKpi(kpiId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, profile, isAdminFlag } = await getAuthContext();
  const { data: kpi, error: kpiError } = await supabase
    .from("team_kpis")
    .select("*")
    .eq("id", kpiId)
    .single();

  if (kpiError || !kpi) {
    return { success: false, error: kpiError?.message ?? "KPI를 찾을 수 없습니다." };
  }

  if (!(await canAccessTeam(kpi.team_id, profile.id, isAdminFlag))) {
    return { success: false, error: "KPI를 수정할 권한이 없습니다." };
  }

  const title = readText(formData, "title");
  const measurementType = readText(formData, "measurement_type") as KpiMeasurementType;
  const periodStart = readText(formData, "period_start");
  const periodEnd = readText(formData, "period_end");

  if (!title || !periodStart || !periodEnd || !KPI_MEASUREMENT_TYPES.has(measurementType)) {
    return { success: false, error: "필수 KPI 정보를 모두 입력해 주세요." };
  }

  let startValue: number | null = null;
  let targetValue = 0;
  let currentValue = 0;
  let isMeasured = false;
  let checklistItems: ChecklistItem[] = [];
  let unit = readText(formData, "unit");

  if (measurementType === "checklist") {
    checklistItems = readChecklistItems(formData);
    if (checklistItems.length === 0) {
      return { success: false, error: "체크리스트 항목을 1개 이상 입력해 주세요." };
    }
    targetValue = checklistItems.length;
    currentValue = checklistItems.filter((item) => item.done).length;
    isMeasured = true;
    unit = "개";
  } else {
    targetValue = readOptionalNumber(formData, "target_value") ?? Number.NaN;
    const optionalCurrentValue = readOptionalNumber(formData, "current_value");

    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      return { success: false, error: "목표값은 0보다 큰 숫자여야 합니다." };
    }

    if (optionalCurrentValue !== null && (!Number.isFinite(optionalCurrentValue) || optionalCurrentValue < 0)) {
      return { success: false, error: "현재값은 0 이상의 숫자여야 합니다." };
    }

    currentValue = optionalCurrentValue ?? 0;
    isMeasured = optionalCurrentValue !== null;

    if (measurementType === "reduce") {
      startValue = readOptionalNumber(formData, "start_value");
      if (startValue === null || !Number.isFinite(startValue)) {
        return { success: false, error: "감소 목표형은 시작값이 필요합니다." };
      }
      if (startValue <= targetValue) {
        return { success: false, error: "감소 목표형은 시작값이 목표값보다 커야 합니다." };
      }
    }
  }

  const rate = achievementRate({ measurement_type: measurementType, start_value: startValue, current_value: currentValue, target_value: targetValue, is_measured: isMeasured, checklist_items: checklistItems });
  const { error } = await supabase
    .from("team_kpis")
    .update({
      title,
      description: readText(formData, "description"),
      owner_id: readOptionalId(formData, "owner_id"),
      period_start: periodStart,
      period_end: periodEnd,
      measurement_type: measurementType,
      start_value: startValue,
      target_value: targetValue,
      current_value: currentValue,
      unit,
      is_measured: isMeasured,
      checklist_items: checklistItems,
      status: statusFromRate(isMeasured, rate),
    })
    .eq("id", kpiId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTeamSpace(kpi.team_id);
  return { success: true };
}

export async function updateStartupTeamDescription(teamId: string, formData: FormData): Promise<ActionResult> {
  const { profile, isAdminFlag } = await getAuthContext();

  if (!(await canAccessTeam(teamId, profile.id, isAdminFlag))) {
    return { success: false, error: "팀 설명을 수정할 권한이 없습니다." };
  }

  const description = readText(formData, "description");
  if (description.length > 1000) {
    return { success: false, error: "팀 설명은 1000자 이하로 입력해 주세요." };
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("startup_teams")
    .update({ description })
    .eq("id", teamId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTeamSpace(teamId);
  return { success: true };
}

export async function createTeamReviewPost(formData: FormData): Promise<ActionResult> {
  const { profile, isAdminFlag } = await getAuthContext();
  const teamId = readText(formData, "team_id");
  const title = readText(formData, "title");
  const content = readText(formData, "content");

  if (!teamId || !title) {
    return { success: false, error: "팀과 제목을 입력해 주세요." };
  }

  if (!(await canAccessTeam(teamId, profile.id, isAdminFlag))) {
    return { success: false, error: "이 팀 피드에 글을 작성할 권한이 없습니다." };
  }

  const kpiIds = unique(readIds(formData, "kpi_ids"));
  const contentBlocks = readReviewContentBlocks(formData);
  const imageUrls = unique([...readStringArrayJson(formData, "image_urls"), ...contentBlocks.flatMap((block) => block.type === "image" ? [block.url] : [])]);
  const fileAttachments = [...readFileAttachmentsJson(formData, "file_attachments"), ...contentBlocks.flatMap((block) => block.type === "file" ? [{ name: block.name, url: block.url }] : [])];
  const linkedKpiIds = unique([...kpiIds, ...contentBlocks.flatMap((block) => block.type === "kpi" ? [block.kpiId] : [])]);

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.from("team_review_posts").insert({
    team_id: teamId,
    author_id: profile.id,
    title,
    content,
    content_blocks: contentBlocks,
    kpi_ids: linkedKpiIds,
    image_urls: imageUrls,
    file_attachments: fileAttachments,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/team-building-2026");
  revalidateTeamSpace(teamId);
  return { success: true };
}

export async function updateTeamKpiProgress(kpiId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, profile, isAdminFlag } = await getAuthContext();
  const { data: kpi, error: kpiError } = await supabase
    .from("team_kpis")
    .select("*")
    .eq("id", kpiId)
    .single();

  if (kpiError || !kpi) {
    return { success: false, error: kpiError?.message ?? "KPI를 찾을 수 없습니다." };
  }

  if (!(await canAccessTeam(kpi.team_id, profile.id, isAdminFlag))) {
    return { success: false, error: "KPI를 수정할 권한이 없습니다." };
  }

  let currentValue = kpi.current_value;
  let targetValue = kpi.target_value;
  let checklistItems = Array.isArray(kpi.checklist_items) ? kpi.checklist_items : [];
  let isMeasured = false;

  if (kpi.measurement_type === "checklist") {
    checklistItems = readChecklistItems(formData);
    if (checklistItems.length === 0) {
      return { success: false, error: "체크리스트 항목을 1개 이상 입력해 주세요." };
    }
    targetValue = checklistItems.length;
    currentValue = checklistItems.filter((item) => item.done).length;
    isMeasured = true;
  } else {
    const optionalCurrentValue = readOptionalNumber(formData, "current_value");
    if (optionalCurrentValue !== null && (!Number.isFinite(optionalCurrentValue) || optionalCurrentValue < 0)) {
      return { success: false, error: "현재값은 0 이상의 숫자여야 합니다." };
    }
    currentValue = optionalCurrentValue ?? 0;
    isMeasured = optionalCurrentValue !== null;
  }

  const rate = achievementRate({ ...kpi, current_value: currentValue, target_value: targetValue, is_measured: isMeasured, checklist_items: checklistItems });
  const status = statusFromRate(isMeasured, rate);
  const { error } = await supabase
    .from("team_kpis")
    .update({
      status,
      target_value: targetValue,
      current_value: currentValue,
      is_measured: isMeasured,
      checklist_items: checklistItems,
      progress_note: readText(formData, "progress_note"),
    })
    .eq("id", kpiId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTeamSpace(kpi.team_id);
  return { success: true };
}

export async function deleteTeamKpi(kpiId: string): Promise<ActionResult> {
  const { supabase, profile, isAdminFlag } = await getAuthContext();

  const { data: kpi } = await supabase.from("team_kpis").select("team_id").eq("id", kpiId).maybeSingle();
  if (!kpi || !(await canAccessTeam(kpi.team_id, profile.id, isAdminFlag))) {
    return { success: false, error: "KPI를 삭제할 권한이 없습니다." };
  }

  const { error } = await supabase.from("team_kpis").delete().eq("id", kpiId);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTeamSpace(kpi?.team_id);
  return { success: true };
}

export async function createOfficeHour(formData: FormData): Promise<ActionResult> {
  const { profile, isAdminFlag } = await getAuthContext();

  const teamId = readText(formData, "team_id");
  if (!teamId) {
    return { success: false, error: "팀을 선택해 주세요." };
  }

  if (!(await canAccessTeam(teamId, profile.id, isAdminFlag))) {
    return { success: false, error: "이 팀의 커피챗을 기록할 권한이 없습니다." };
  }

  const adminSupabase = createAdminClient();
  const { data: officeHour, error } = await adminSupabase
    .from("office_hours")
    .insert({
      team_id: teamId,
      held_at: readText(formData, "held_at") || new Date().toISOString().slice(0, 10),
      next_due_at: readText(formData, "next_due_at") || null,
      summary: readText(formData, "summary"),
      decisions: readText(formData, "decisions"),
      next_actions: readText(formData, "next_actions"),
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const attendeeIds = unique(readIds(formData, "attendee_ids"));
  if (attendeeIds.length > 0) {
    const { error: attendeeError } = await adminSupabase.from("office_hour_attendees").insert(
      attendeeIds.map((attendeeId) => ({
        office_hour_id: officeHour.id,
        profile_id: attendeeId,
      })),
    );

    if (attendeeError) {
      return { success: false, error: attendeeError.message };
    }
  }

  revalidateTeamSpace(teamId);
  return { success: true };
}
