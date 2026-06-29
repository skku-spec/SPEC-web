"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { BlockNoteView } from "@blocknote/mantine";
import { Activity, BarChart3, CircleAlert, ListFilter, Target, Users } from "lucide-react";

import FeedCard from "@/app/team-building-2026/FeedCard";
import { createTeamReviewPost } from "@/lib/actions/team-space";
import type { TeamKpiStatus } from "@/lib/supabase/types";
import { uploadTeamBuildingImage } from "@/lib/storage";

export type FeedPost = {
  id: string;
  kind: "kpi" | "review";
  teamId: string;
  status: TeamKpiStatus;
  achievementRate: number;
  isMeasured: boolean;
  author: {
    name: string;
    avatarUrl: string | null;
    fallback?: string;
    meta: string;
  };
  date: string;
  title: string;
  paragraphs: string[];
  translateLabel: string;
  reactionCount: number;
  commentCount: number;
  imageUrls?: string[];
  fileAttachments?: Array<{ name: string; url: string }>;
  linkedKpis?: Array<{ id: string; title: string; achievementRate: number; isMeasured: boolean }>;
  contentBlocks?: Array<
    | { type: "text"; text: string; variant?: "paragraph" | "heading1" | "heading2" | "heading3" }
    | { type: "blocknote"; blocks: unknown[]; markdown?: string }
    | { type: "kpi"; kpiId: string; title?: string; achievementRate?: number; isMeasured?: boolean }
    | { type: "image"; url: string; width?: number }
    | { type: "file"; name: string; url: string }
  >;
};

export type TeamSummary = {
  id: string;
  name: string;
  batch: string;
  totalKpis: number;
  activeKpis: number;
  atRiskKpis: number;
  measuredKpis: number;
  averageAchievement: number;
  latestTitle: string;
};

export type TeamKpiOption = {
  id: string;
  teamId: string;
  title: string;
  achievementRate: number;
  isMeasured: boolean;
};

type TeamDetailTab = "home" | "feeds";

function Header() {
  return (
    <header className="border-b border-[#ddd9cc] bg-[#f5f5ee]">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <p className="font-[system-ui] text-sm font-bold text-[#1A1A1A]">2026 Team Building</p>
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-[#ddd9cc] bg-[#e8e6dc]">
          <Image src="/images/common/logo.png" alt="SPEC profile" fill sizes="36px" className="object-contain p-1.5" />
        </div>
      </div>
    </header>
  );
}

function Sidebar({
  teams,
  selectedTeamId,
  onChange,
}: {
  teams: TeamSummary[];
  selectedTeamId: string | null;
  onChange: (teamId: string | null) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="hidden w-[220px] rounded-lg border border-[#ddd9cc] bg-white p-3 lg:block">
        <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-wide text-[#6b6b5e]">Teams</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors ${
              selectedTeamId === null ? "bg-[#16140f] text-white" : "text-[#4a4a40] hover:bg-[#f0efe6]"
            }`}
          >
            <BarChart3 className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span>
              <span className="block text-sm font-bold">전체</span>
              <span className={`block text-xs ${selectedTeamId === null ? "text-white/65" : "text-[#6b6b5e]"}`}>KPI 진행 현황</span>
            </span>
          </button>

          {teams.map((team) => {
            const active = selectedTeamId === team.id;
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => onChange(team.id)}
                className={`w-full rounded-md px-3 py-3 text-left transition-colors ${
                  active ? "bg-[#16140f] text-white" : "text-[#4a4a40] hover:bg-[#f0efe6]"
                }`}
              >
                <span className="block truncate text-sm font-bold">{team.name}</span>
                <span className={`mt-0.5 block text-xs ${active ? "text-white/65" : "text-[#6b6b5e]"}`}>
                  {team.totalKpis} KPIs · {team.averageAchievement}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`h-10 shrink-0 rounded-lg px-4 text-sm font-bold ${
            selectedTeamId === null ? "bg-[#16140f] text-white" : "border border-[#ddd9cc] bg-white text-[#4a4a40]"
          }`}
        >
          전체
        </button>
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => onChange(team.id)}
            className={`h-10 shrink-0 rounded-lg px-4 text-sm font-bold ${
              selectedTeamId === team.id ? "bg-[#16140f] text-white" : "border border-[#ddd9cc] bg-white text-[#4a4a40]"
            }`}
          >
            {team.name}
          </button>
        ))}
      </div>
    </aside>
  );
}

function PageHeader({
  selectedTeam,
  totalPosts,
  activeTab,
  onTabChange,
}: {
  selectedTeam: TeamSummary | null;
  totalPosts: number;
  activeTab: TeamDetailTab;
  onTabChange: (tab: TeamDetailTab) => void;
}) {
  return (
    <section className="mb-6">
      <h1 className="font-[system-ui] text-[clamp(2.25rem,7vw,4rem)] font-black leading-none text-[#1A1A1A]">
        {selectedTeam ? selectedTeam.name : "전체"}
      </h1>
      {selectedTeam ? (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {[
              { id: "home" as const, label: "Home" },
              { id: "feeds" as const, label: "Feeds" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  activeTab === tab.id ? "bg-[#16140f] text-white" : "bg-[#f0efe6] text-[#4a4a40] hover:bg-[#e8e6dc]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-[#6b6b5e]">
            {activeTab === "home" ? "Team Space 요약을 바탕으로 팀 현황을 확인합니다." : `${totalPosts} feed posts shared by this team`}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-[#6b6b5e]">각 팀의 전체 KPI 진행 현황을 한눈에 확인합니다.</p>
      )}
    </section>
  );
}

function DashboardView({ teams, totalPosts }: { teams: TeamSummary[]; totalPosts: number }) {
  const activeTeams = teams.filter((team) => team.totalKpis > 0).length;
  const atRisk = teams.reduce((sum, team) => sum + team.atRiskKpis, 0);
  const average = teams.length > 0 ? Math.round(teams.reduce((sum, team) => sum + team.averageAchievement, 0) / teams.length) : 0;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="text-xs font-bold text-[#6b6b5e]">Teams</p>
          <p className="mt-2 text-3xl font-black">{teams.length}</p>
        </div>
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="text-xs font-bold text-[#6b6b5e]">Teams posting</p>
          <p className="mt-2 text-3xl font-black">{activeTeams}</p>
        </div>
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="text-xs font-bold text-[#6b6b5e]">Average progress</p>
          <p className="mt-2 text-3xl font-black">{average}%</p>
        </div>
      </section>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5 text-center sm:p-6">
          <Users className="mx-auto mb-3 h-7 w-7 text-[#FF6C0F]" strokeWidth={2} />
          <p className="font-bold">No teams found.</p>
          <p className="mt-2 text-sm text-[#6b6b5e]">Teams created in Team Space will appear here.</p>
        </div>
      ) : (
        <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#1A1A1A]">Team KPI Progress</h2>
              <p className="mt-1 text-sm text-[#6b6b5e]">측정된 KPI 평균 달성률 기준입니다. 미측정 KPI는 평균에서 제외됩니다.</p>
            </div>
            <span className="rounded-full bg-[#FFF0E5] px-3 py-1 text-xs font-bold text-[#b45309]">At-risk {atRisk}</span>
          </div>
          <div className="space-y-4">
            {teams.map((team) => (
              <article key={team.id} className="grid gap-3 rounded-lg border border-[#ece8dc] bg-[#fbfaf4] p-4 sm:grid-cols-[170px_1fr_88px] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#1A1A1A]">{team.name}</p>
                  <p className="mt-1 truncate text-xs text-[#6b6b5e]">
                    {team.measuredKpis}/{team.totalKpis} measured · {team.latestTitle}
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#f0efe6]">
                  <div className="h-full rounded-full bg-[#FF6C0F]" style={{ width: `${Math.min(team.averageAchievement, 100)}%` }} />
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-black">{team.averageAchievement}%</p>
                  <p className="text-[11px] font-bold text-[#6b6b5e]">{team.atRiskKpis} at-risk</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {totalPosts === 0 && teams.length > 0 ? (
        <p className="rounded-lg border border-[#ddd9cc] bg-white px-5 py-4 text-sm text-[#6b6b5e]">
          Team Space teams are connected. KPI posts will appear after teams create KPIs.
        </p>
      ) : null}
    </div>
  );
}

function TeamHomeView({
  team,
  posts,
  kpis,
}: {
  team: TeamSummary;
  posts: FeedPost[];
  kpis: TeamKpiOption[];
}) {
  const measuredPosts = posts.filter((post) => post.isMeasured);
  const northStar = measuredPosts[0] ?? posts[0] ?? null;
  const actionPosts = posts.filter((post) => post.status === "in_progress" || post.status === "blocked" || post.status === "missed");
  const completedPosts = posts.filter((post) => post.status === "achieved");

  return (
    <section className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#6b6b5e]">
            <Target className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
            Representative KPI
          </div>
          {northStar ? (
            <>
              <p className="truncate text-sm font-bold text-[#16140f]">{northStar.title}</p>
              <p className="mt-3 text-3xl font-black">{northStar.isMeasured ? `${northStar.achievementRate}%` : "Not measured"}</p>
              <p className="mt-2 line-clamp-2 text-sm text-[#6b6b5e]">{northStar.paragraphs[0]}</p>
            </>
          ) : (
            <p className="text-sm text-[#6b6b5e]">등록된 KPI가 없습니다.</p>
          )}
        </div>

        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="mb-3 text-xs font-semibold text-[#6b6b5e]">Goal Achievement</p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(#FF6C0F ${Math.min(team.averageAchievement, 100)}%, #f0efe6 0)` }}>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black">{team.averageAchievement}%</div>
            </div>
            <div className="text-sm text-[#6b6b5e]">
              <p><span className="font-bold text-[#16140f]">{team.totalKpis}</span> KPIs tracked</p>
              <p className="mt-1"><span className="font-bold text-[#16140f]">{team.measuredKpis}</span> measured</p>
              <p className="mt-1"><span className="font-bold text-[#16140f]">{completedPosts.length}</span> achieved</p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg border p-5 ${team.atRiskKpis > 0 ? "border-[#f2b8b5] bg-[#fff5f5]" : "border-[#ddd9cc] bg-white"}`}>
          <p className="mb-3 text-xs font-semibold text-[#6b6b5e]">Needs Review</p>
          <p className="text-3xl font-black">{team.atRiskKpis}</p>
          <p className="mt-2 text-sm text-[#6b6b5e]">{team.atRiskKpis > 0 ? "확인 필요한 KPI가 있습니다." : "현재 확인 필요 항목이 없습니다."}</p>
          {team.atRiskKpis > 0 ? (
            <span className="mt-3 inline-flex rounded-full bg-[#FEE2E2] px-2.5 py-1 text-xs font-bold text-[#b42318]">확인 필요</span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
            <h2 className="text-sm font-black">KPI Progress</h2>
          </div>
          {posts.length === 0 ? (
            <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">KPI가 등록되면 진행 현황이 표시됩니다.</p>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 6).map((post) => (
                <article key={post.id} className="rounded-lg border border-[#ece8dc] bg-[#fbfaf4] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#1A1A1A]">{post.title}</p>
                      <p className="mt-1 truncate text-xs text-[#6b6b5e]">{post.date}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#FFF0E5] px-2.5 py-1 text-xs font-bold text-[#b45309]">
                      {post.isMeasured ? `${post.achievementRate}%` : "Not measured"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0efe6]">
                    <div className="h-full rounded-full bg-[#FF6C0F]" style={{ width: `${post.isMeasured ? Math.min(post.achievementRate, 100) : 0}%` }} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
              <h2 className="text-sm font-black">Execution Status</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-bold text-[#6b6b5e]">진행/막힘</p>
                {actionPosts.length === 0 ? (
                  <p className="text-sm text-[#6b6b5e]">진행 중이거나 막힌 KPI가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {actionPosts.slice(0, 3).map((post) => (
                      <p key={post.id} className="rounded-lg bg-[#f5f5ee] p-3 text-sm font-semibold text-[#4a4a40]">{post.title}</p>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-[#6b6b5e]">완료한 일</p>
                <p className="text-sm text-[#6b6b5e]">{completedPosts.length > 0 ? completedPosts.map((post) => post.title).join(", ") : "이번 기간 달성 KPI가 없습니다."}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
              <h2 className="text-sm font-black">Team Meta</h2>
            </div>
            <div className="space-y-2 text-sm text-[#6b6b5e]">
              <p><span className="font-bold text-[#16140f]">Batch</span> {team.batch}</p>
              <p><span className="font-bold text-[#16140f]">Available KPIs</span> {kpis.length}</p>
              <p><span className="font-bold text-[#16140f]">Latest</span> {team.latestTitle}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function ReviewComposer({
  team,
  kpis,
}: {
  team: TeamSummary;
  kpis: TeamKpiOption[];
}) {
  const router = useRouter();
  const editor = useCreateBlockNote({
    uploadFile: async (file) => uploadTeamBuildingImage(team.id, file),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const slashMenuItems = useMemo(() => {
    const kpiText = kpis.length > 0
      ? `KPI 업데이트: ${kpis.map((kpi) => `${kpi.title} ${kpi.isMeasured ? `${kpi.achievementRate}%` : "미측정"}`).join(" / ")}`
      : "KPI 업데이트: 아직 등록된 KPI가 없습니다.";

    return async (query: string) => filterSuggestionItems(
      [
        {
          title: "KPI",
          subtext: "현재 팀 KPI 요약을 본문에 삽입합니다.",
          aliases: ["kpi", "KPI", "케이피아이", "지표"],
          group: "Team Building",
          icon: <Target className="h-4 w-4" strokeWidth={2} />,
          onItemClick: () => {
            insertOrUpdateBlockForSlashMenu(editor, {
              type: "paragraph",
              content: kpiText,
            });
          },
          key: "paragraph" as const,
        },
        ...getDefaultReactSlashMenuItems(editor),
      ],
      query,
    );
  }, [editor, kpis]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const markdown = editor.blocksToMarkdownLossy(editor.document);
    const contentBlocks = [{ type: "blocknote", blocks: editor.document, markdown }];

    formData.set("team_id", team.id);
    formData.set("content_blocks", JSON.stringify(contentBlocks));
    if (!formData.get("content")) formData.set("content", markdown);
    setMessage(null);

    startTransition(async () => {
      const result = await createTeamReviewPost(formData);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      form.reset();
      editor.replaceBlocks(editor.document, [{ type: "paragraph" }]);
      setMessage("리뷰 글이 등록되었습니다.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mb-5 rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-black text-[#1A1A1A]">KPI 리뷰 작성</h2>
        <p className="mt-1 text-sm text-[#6b6b5e]">KPI 설정 배경, 달성 과정, 배운 점을 팀 피드에 공유합니다.</p>
      </div>

      {message ? <p className="mb-3 rounded-lg bg-[#f5f5ee] px-3 py-2 text-sm font-semibold text-[#4a4a40]">{message}</p> : null}

      <div className="space-y-3">
        <label className="block text-xs font-bold text-[#6b6b5e]">
          제목
          <input name="title" required className="mt-1 h-10 w-full rounded-lg border border-[#ddd9cc] px-3 text-sm outline-none focus:border-[#FF6C0F]" />
        </label>
        <input type="hidden" name="content" />
        <div className="space-y-2 rounded-lg border border-[#ddd9cc] bg-[#fbfaf4] p-3">
          <p className="text-xs font-bold text-[#6b6b5e]">본문</p>
          <div className="team-review-editor min-h-52 rounded-xl border border-[#ddd9cc] bg-white p-3">
            <BlockNoteView editor={editor} theme="light" slashMenu={false}>
              <SuggestionMenuController triggerCharacter="/" getItems={slashMenuItems} />
            </BlockNoteView>
          </div>
          <p className="text-xs font-semibold text-[#8a877c]"># 입력 후 Space를 누르면 제목 블록으로 전환됩니다. 이미지도 에디터 안에 붙여넣거나 드래그할 수 있습니다.</p>
        </div>

        <button disabled={isPending} className="h-10 rounded-md bg-[#16140f] px-4 text-xs font-semibold text-white disabled:opacity-50">
          리뷰 등록
        </button>
      </div>
    </form>
  );
}

function FeedView({ posts, teamName }: { posts: FeedPost[]; teamName: string }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-[#ddd9cc] bg-white p-5 text-center sm:p-6">
        <ListFilter className="mx-auto mb-3 h-7 w-7 text-[#FF6C0F]" strokeWidth={2} />
        <p className="font-bold">No feed posts yet.</p>
        <p className="mt-2 text-sm text-[#6b6b5e]">{teamName}에서 KPI 리뷰 글을 작성하면 이곳에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
    </section>
  );
}

export default function TeamBuildingCommunity({
  teams,
  posts,
  kpiOptions,
  writableTeamIds,
  setupError,
}: {
  teams: TeamSummary[];
  posts: FeedPost[];
  kpiOptions: TeamKpiOption[];
  writableTeamIds: string[];
  setupError?: string;
}) {
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name, "ko")), [teams]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TeamDetailTab>("home");
  const selectedTeam = useMemo(() => sortedTeams.find((team) => team.id === selectedTeamId) ?? null, [selectedTeamId, sortedTeams]);
  const visiblePosts = useMemo(
    () => (selectedTeam ? posts.filter((post) => post.teamId === selectedTeam.id) : posts),
    [posts, selectedTeam],
  );
  const visibleFeedPosts = useMemo(() => visiblePosts.filter((post) => post.kind === "review"), [visiblePosts]);
  const selectedTeamKpis = useMemo(
    () => (selectedTeam ? kpiOptions.filter((kpi) => kpi.teamId === selectedTeam.id) : []),
    [kpiOptions, selectedTeam],
  );
  const canWriteSelectedTeam = selectedTeam ? writableTeamIds.includes(selectedTeam.id) : false;
  const changeSelectedTeam = (teamId: string | null) => {
    setSelectedTeamId(teamId);
    setActiveTab("home");
  };

  return (
    <main className="min-h-screen bg-[#f5f5ee] font-[system-ui] text-[#1A1A1A]">
      <Header />
      <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Sidebar teams={sortedTeams} selectedTeamId={selectedTeamId} onChange={changeSelectedTeam} />

        <div className="min-w-0">
          <PageHeader selectedTeam={selectedTeam} totalPosts={visibleFeedPosts.length} activeTab={activeTab} onTabChange={setActiveTab} />

          {setupError ? (
            <div className="mb-5 rounded-lg border border-[#f2b8b5] bg-[#fff5f5] px-5 py-4 text-sm text-[#b42318]">
              <div className="flex gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
                <div>
                  <p className="font-bold">{setupError}</p>
                  <p className="mt-1 text-[#7a271a]">Run the team-space SQL migration in Supabase to load teams and KPIs.</p>
                </div>
              </div>
            </div>
          ) : null}

          {selectedTeam === null ? (
            <DashboardView teams={sortedTeams} totalPosts={posts.length} />
          ) : activeTab === "home" ? (
            <TeamHomeView team={selectedTeam} posts={visiblePosts} kpis={selectedTeamKpis} />
          ) : (
            <>
              {canWriteSelectedTeam ? <ReviewComposer team={selectedTeam} kpis={selectedTeamKpis} /> : null}
              <FeedView posts={visibleFeedPosts} teamName={selectedTeam.name} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
