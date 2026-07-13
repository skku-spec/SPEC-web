"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Activity, BarChart3, CircleAlert, ListFilter, Target, Users } from "lucide-react";

import FeedCard from "@/app/team-building-2026/FeedCard";
import type { TeamKpiStatus } from "@/lib/supabase/types";

export type FeedPost = {
  id: string;
  kind: "kpi" | "review";
  reportType?: "cta" | "coffee_chat" | "free_review";
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
  description: string;
  tagline: string;
  heroImageUrl: string;
  stage: string;
  problem: string;
  solution: string;
  targetCustomer: string;
  coreValue: string;
  batch: string;
  leadPreneurName: string | null;
  members: Array<{ id: string; name: string; photo: string | null; role: string | null }>;
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
  selectedTeamId: string;
  onChange: (teamId: string) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="hidden w-[220px] rounded-lg border border-[#ddd9cc] bg-white p-3 lg:block">
        <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-wide text-[#6b6b5e]">Teams</p>
        <div className="space-y-1">
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
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
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
        {selectedTeam?.name ?? "Teams"}
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
      ) : null}
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
}: {
  team: TeamSummary;
  posts: FeedPost[];
}) {
  const reportPosts = posts.filter((post) => post.kind === "review");
  const timelinePosts = [...reportPosts].reverse().slice(0, 8);
  const mediaItems = reportPosts.flatMap((post) => [
    ...(post.imageUrls ?? []).map((url) => ({ type: "image" as const, url, title: post.title })),
    ...(post.contentBlocks ?? []).flatMap((block) => block.type === "image" ? [{ type: "image" as const, url: block.url, title: post.title }] : []),
  ]).slice(0, 6);
  const fileItems = reportPosts.flatMap((post) => [
    ...(post.fileAttachments ?? []).map((file) => ({ ...file, title: post.title })),
    ...(post.contentBlocks ?? []).flatMap((block) => block.type === "file" ? [{ name: block.name, url: block.url, title: post.title }] : []),
  ]).slice(0, 6);

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-[#ddd9cc] bg-white">
        <div className="grid min-h-[340px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center p-6 sm:p-8">
            {team.stage ? (
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f0efe6] px-3 py-1 text-xs font-bold text-[#4a4a40]">{team.stage}</span>
              </div>
            ) : null}
            <h2 className="text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-none text-[#1A1A1A]">{team.name}</h2>
            <p className="mt-4 max-w-2xl text-xl font-bold leading-8 text-[#FF6C0F]">{team.tagline || team.description || "팀 한 줄 소개를 준비 중입니다."}</p>
          </div>
          {team.heroImageUrl ? (
            <div className="relative min-h-[260px] bg-[#f0efe6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={team.heroImageUrl} alt={`${team.name} 대표 이미지`} className="h-full min-h-[340px] w-full object-cover" />
            </div>
          ) : (
            <div className="grid min-h-[260px] place-items-center bg-[#f0efe6] text-sm font-bold text-[#8a877c]">대표 이미지 준비 중</div>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {[
          ["Problem", team.problem],
          ["Solution", team.solution],
          ["Target Customer", team.targetCustomer],
          ["Core Value", team.coreValue],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#ddd9cc] bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#6b6b5e]">{label}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#4a4a40]">{value || "아직 입력되지 않았습니다."}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
        <div className="mb-5 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
          <h2 className="text-sm font-black">Team</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.length === 0 ? (
            <p className="text-sm text-[#6b6b5e]">팀원이 아직 연결되지 않았습니다.</p>
          ) : team.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-lg border border-[#ece8dc] bg-[#fbfaf4] p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8e6dc] text-sm font-black">
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                ) : member.name.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{member.name}</p>
                <p className="truncate text-xs text-[#6b6b5e]">{member.role === "preneur" ? "Preneur" : "Team member"}</p>
              </div>
            </div>
          ))}
        </div>
        {team.leadPreneurName ? <p className="mt-4 text-sm text-[#6b6b5e]">담당 프러너: <span className="font-bold text-[#16140f]">{team.leadPreneurName}</span></p> : null}
      </section>

      <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
        <div className="mb-5 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
          <h2 className="text-sm font-black">Timeline</h2>
        </div>
        {timelinePosts.length === 0 ? (
          <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">CTA와 커피챗 보고서를 제출하면 회차별 활동이 이곳에 쌓입니다.</p>
        ) : (
          <div className="space-y-3">
            {timelinePosts.map((post) => (
              <article key={post.id} className="rounded-lg border border-[#ece8dc] bg-[#fbfaf4] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black">{post.title}</p>
                    <p className="mt-1 text-xs text-[#6b6b5e]">{post.date}</p>
                  </div>
                  <span className="w-fit rounded-full bg-[#FFF0E5] px-2.5 py-1 text-xs font-bold text-[#b45309]">
                    {post.reportType === "coffee_chat" ? "커피챗" : post.reportType === "cta" ? "CTA" : "보고서"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6b6b5e]">{post.paragraphs[0]}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#ddd9cc] bg-white p-5">
        <div className="mb-5 flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-[#FF6C0F]" strokeWidth={2} />
          <h2 className="text-sm font-black">Media / Proof</h2>
        </div>
        {mediaItems.length === 0 && fileItems.length === 0 ? (
          <p className="rounded-lg bg-[#f5f5ee] p-4 text-sm text-[#6b6b5e]">보고서에 첨부한 이미지와 파일이 이곳에 모입니다.</p>
        ) : (
          <div className="space-y-4">
            {mediaItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mediaItems.map((item) => (
                  <div key={`${item.url}-${item.title}`} className="overflow-hidden rounded-lg border border-[#ece8dc] bg-[#fbfaf4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.title} className="h-40 w-full object-cover" />
                    <p className="truncate px-3 py-2 text-xs font-semibold text-[#4a4a40]">{item.title}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {fileItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fileItems.map((file) => (
                  <a key={`${file.url}-${file.title}`} href={file.url} target="_blank" rel="noreferrer" className="rounded-md border border-[#ddd9cc] px-3 py-2 text-xs font-bold text-[#4a4a40] hover:border-[#FF6C0F]">
                    {file.name}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </section>
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
  setupError,
}: {
  teams: TeamSummary[];
  posts: FeedPost[];
  kpiOptions: TeamKpiOption[];
  setupError?: string;
}) {
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name, "ko")), [teams]);
  const [selectedTeamId, setSelectedTeamId] = useState(() => sortedTeams[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<TeamDetailTab>("home");
  const selectedTeam = useMemo(() => sortedTeams.find((team) => team.id === selectedTeamId) ?? null, [selectedTeamId, sortedTeams]);
  const visiblePosts = useMemo(
    () => (selectedTeam ? posts.filter((post) => post.teamId === selectedTeam.id) : []),
    [posts, selectedTeam],
  );
  const visibleFeedPosts = useMemo(() => visiblePosts.filter((post) => post.kind === "review"), [visiblePosts]);
  const selectedTeamKpis = useMemo(
    () => (selectedTeam ? kpiOptions.filter((kpi) => kpi.teamId === selectedTeam.id) : []),
    [kpiOptions, selectedTeam],
  );
  const changeSelectedTeam = (teamId: string) => {
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
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-5 text-center sm:p-6">
              <Users className="mx-auto mb-3 h-7 w-7 text-[#FF6C0F]" strokeWidth={2} />
              <p className="font-bold">No teams found.</p>
              <p className="mt-2 text-sm text-[#6b6b5e]">Teams created in Team Space will appear here.</p>
            </div>
          ) : activeTab === "home" ? (
            <TeamHomeView team={selectedTeam} posts={visiblePosts} />
          ) : (
            <FeedView posts={visibleFeedPosts} teamName={selectedTeam.name} />
          )}
        </div>
      </div>
    </main>
  );
}
