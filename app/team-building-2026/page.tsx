import TeamBuildingCommunity, {
  type FeedPost,
  type TeamKpiOption,
  type TeamSummary,
} from "@/app/team-building-2026/TeamBuildingCommunity";
import { getTeamBuilding2026Data } from "@/lib/actions/team-space";
import type { TeamKpiStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<TeamKpiStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  achieved: "Achieved",
  missed: "Missed",
  blocked: "Blocked",
};

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "S";
}

function kpiValueSummary(kpi: Awaited<ReturnType<typeof getTeamBuilding2026Data>>["weeks"][number]["kpis"][number]) {
  if (!kpi.is_measured) return "Not measured yet.";
  if (kpi.measurement_type === "checklist") {
    const items = Array.isArray(kpi.checklist_items) ? kpi.checklist_items : [];
    return `${items.filter((item) => item.done).length}/${items.length} checklist items completed.`;
  }
  if (kpi.measurement_type === "reduce") {
    return `Current ${kpi.current_value}${kpi.unit}, target ${kpi.target_value}${kpi.unit}, starting from ${kpi.start_value ?? "-"}${kpi.unit}.`;
  }
  return `Current ${kpi.current_value}${kpi.unit}, target ${kpi.target_value}${kpi.unit}.`;
}

function kpiToPost(kpi: Awaited<ReturnType<typeof getTeamBuilding2026Data>>["weeks"][number]["kpis"][number], weekLabel: string): FeedPost {
  const teamName = kpi.team?.name ?? "Unknown Team";
  const status = STATUS_LABEL[kpi.status];
  const due = formatDate(kpi.period_end);

  return {
    id: kpi.id,
    kind: "kpi",
    teamId: kpi.team?.id ?? kpi.team_id,
    status: kpi.status,
    isMeasured: kpi.is_measured,
    author: {
      name: teamName,
      avatarUrl: null,
      fallback: initials(teamName),
      meta: `${status} KPI | ${kpi.owner?.display_name ?? "Team-wide"} @${teamName}`,
    },
    date: `${weekLabel} · Due ${due}`,
    title: kpi.title,
    paragraphs: [
      kpi.description
        ? kpi.description
        : `This team shared a **${status.toLowerCase()} KPI** for the current two-week sprint.`,
      kpi.is_measured ? `Achievement: **${kpi.achievement_rate}%**. ${kpiValueSummary(kpi)}` : `Achievement: **Not measured yet**. ${kpiValueSummary(kpi)}`,
      kpi.progress_note
        ? `Latest update: **${kpi.progress_note}**`
        : "No progress note has been shared yet. The team can update KPI progress from its Team Space.",
    ],
    translateLabel: "Translate",
    reactionCount: kpi.status === "achieved" ? 16 : kpi.status === "blocked" ? 8 : 5,
    commentCount: kpi.status === "blocked" || kpi.status === "missed" ? 4 : 1,
    achievementRate: kpi.achievement_rate,
  };
}

function reviewToPost(post: Awaited<ReturnType<typeof getTeamBuilding2026Data>>["weeks"][number]["reviewPosts"][number], weekLabel: string): FeedPost {
  const teamName = post.team?.name ?? "Unknown Team";
  const linkedAverage = post.linked_kpis.filter((kpi) => kpi.is_measured);
  const achievementRate = linkedAverage.length > 0
    ? Math.round(linkedAverage.reduce((sum, kpi) => sum + kpi.achievement_rate, 0) / linkedAverage.length)
    : 0;

  return {
    id: post.id,
    kind: "review",
    teamId: post.team?.id ?? post.team_id,
    status: "in_progress",
    isMeasured: linkedAverage.length > 0,
    author: {
      name: post.author?.display_name ?? teamName,
      avatarUrl: post.author?.photo ?? null,
      fallback: initials(post.author?.display_name ?? teamName),
      meta: `KPI review @${teamName}`,
    },
    date: `${weekLabel} · Review`,
    title: post.title,
    paragraphs: [post.content || "KPI review has been shared."],
    translateLabel: "Translate",
    reactionCount: 0,
    commentCount: 0,
    achievementRate,
    imageUrls: post.image_urls,
    fileAttachments: post.file_attachments,
    linkedKpis: post.linked_kpis.map((kpi) => ({
      id: kpi.id,
      title: kpi.title,
      achievementRate: kpi.achievement_rate,
      isMeasured: kpi.is_measured,
    })),
    contentBlocks: post.content_blocks.map((block) => {
      if (block.type !== "kpi") return block;
      const kpi = post.linked_kpis.find((item) => item.id === block.kpiId);
      return {
        ...block,
        title: kpi?.title,
        achievementRate: kpi?.achievement_rate,
        isMeasured: kpi?.is_measured,
      };
    }),
  };
}

export default async function TeamBuilding2026Page() {
  const data = await getTeamBuilding2026Data();
  const posts = data.weeks.flatMap((week) => [
    ...week.kpis.map((kpi) => kpiToPost(kpi, week.label)),
    ...week.reviewPosts.map((post) => reviewToPost(post, week.label)),
  ]);
  const kpiOptions: TeamKpiOption[] = data.weeks.flatMap((week) =>
    week.kpis.map((kpi) => ({
      id: kpi.id,
      teamId: kpi.team?.id ?? kpi.team_id,
      title: kpi.title,
      achievementRate: kpi.achievement_rate,
      isMeasured: kpi.is_measured,
    })),
  );
  const postsByTeam = new Map<string, FeedPost[]>();

  for (const post of posts) {
    const rows = postsByTeam.get(post.teamId) ?? [];
    rows.push(post);
    postsByTeam.set(post.teamId, rows);
  }

  const teams: TeamSummary[] = data.teams.map((team) => {
    const teamPosts = postsByTeam.get(team.id) ?? [];
    const measuredPosts = teamPosts.filter((post) => post.isMeasured);
    const averageAchievement = measuredPosts.length > 0
      ? Math.round(measuredPosts.reduce((sum, post) => sum + post.achievementRate, 0) / measuredPosts.length)
      : 0;
    return {
      id: team.id,
      name: team.name,
      batch: team.batch,
      totalKpis: teamPosts.length,
      activeKpis: teamPosts.filter((post) => post.status !== "achieved").length,
      atRiskKpis: teamPosts.filter((post) => post.status === "blocked" || post.status === "missed").length,
      measuredKpis: measuredPosts.length,
      averageAchievement,
      latestTitle: teamPosts.at(-1)?.title ?? "No KPI shared yet",
    };
  });

  return <TeamBuildingCommunity teams={teams} posts={posts} kpiOptions={kpiOptions} writableTeamIds={data.writableTeamIds} setupError={data.setupError} />;
}
