"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Search, TableProperties, Users } from "lucide-react";

import IdeathonTeamProfileCard from "@/app/ideathon/IdeathonTeamProfileCard";
import IdeathonTeamProfileForm from "@/app/ideathon/IdeathonTeamProfileForm";
import IdeathonTeamProfileModal from "@/app/ideathon/IdeathonTeamProfileModal";
import IdeathonTeamProfileTable from "@/app/ideathon/IdeathonTeamProfileTable";
import { canViewBoard, includesSearch, roleLabel, type BoardView, type RoleFilter } from "@/app/ideathon/ideathon-team-board-utils";
import { useUser } from "@/hooks/useUser";
import { getIdeathonBoardData } from "@/lib/actions/ideathon-profiles";
import type { IdeathonBoardData, IdeathonBoardProfile } from "@/lib/actions/ideathon-profiles";

export default function IdeathonTeamBoardSection() {
  const { isAuthenticated, role, isLoading } = useUser();
  const [boardData, setBoardData] = useState<IdeathonBoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [view, setView] = useState<BoardView>("grid");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [abilityFilter, setAbilityFilter] = useState("all");
  const [interestFilter, setInterestFilter] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<IdeathonBoardProfile | null>(null);
  const allowed = isAuthenticated && canViewBoard(role);

  const loadBoard = useCallback(async () => {
    await Promise.resolve();

    if (!allowed) {
      setBoardData(null);
      return;
    }

    setIsFetching(true);
    setError(null);
    const result = await getIdeathonBoardData();
    if (result.success) {
      setBoardData(result.data);
    } else {
      setError(result.error);
      setBoardData(null);
    }
    setIsFetching(false);
  }, [allowed]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadBoard();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading, loadBoard]);

  const abilityOptions = useMemo(() => {
    const tags = boardData?.profiles.flatMap((profile) => profile.ability_tags) ?? [];
    return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b, "ko"));
  }, [boardData]);

  const interestOptions = useMemo(() => {
    const tags = boardData?.profiles.flatMap((profile) => profile.interest_tags) ?? [];
    return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b, "ko"));
  }, [boardData]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim();
    return (boardData?.profiles ?? []).filter((profile) => {
      const matchesRole = roleFilter === "all" || profile.role === roleFilter;
      const matchesAbility = abilityFilter === "all" || profile.ability_tags.includes(abilityFilter);
      const matchesInterest = interestFilter === "all" || profile.interest_tags.includes(interestFilter);
      const matchesSearch = !query || includesSearch(profile, query);
      return matchesRole && matchesAbility && matchesInterest && matchesSearch;
    });
  }, [abilityFilter, boardData, interestFilter, roleFilter, search]);

  if (isLoading) {
    return (
      <section id="team-board" className="w-full border-t border-[#ddd9cc]/60 bg-[#f5f5ee] py-16 md:py-24">
        <div className="mx-auto max-w-[1100px] px-6">
          <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">사용자 정보를 확인 중입니다...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="team-board" className="w-full border-t border-[#ddd9cc]/60 bg-[#f5f5ee] py-16 md:py-24">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#FFF0E5] px-3 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
              <Users className="h-4 w-4" strokeWidth={2} />
              팀빌딩 보드
            </div>
            <h2 className="font-['Pretendard',sans-serif] text-3xl font-semibold text-[#16140f]">
              러너 프러너 명단
            </h2>
            <p className="mt-3 max-w-[680px] font-['Pretendard',sans-serif] text-sm leading-6 text-[#4a4a40]">
              비즈니스에서 위대한 일은 절대 혼자서 이루어지지 않습니다. 팀에 의해 이루어집니다. - 스티브 잡스
            </p>
          </div>
          <p className="max-w-[340px] font-['Pretendard',sans-serif] text-sm leading-6 text-[#6b6b5e]">
            오늘은 12월 데모데이까지 같이 가게 될 팀을 형성하는 날입니다.
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-6 text-center">
            <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
              팀빌딩 보드를 열람하려면 SPEC 멤버 로그인이 필요합니다.
            </p>
            <Link
              href="/login?redirect=/ideathon#team-board"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#FF6C0F]"
            >
              SPEC 계정으로 로그인
            </Link>
          </div>
        ) : !canViewBoard(role) ? (
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-6 text-center">
            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318]">
              팀빌딩 보드는 러너와 프러너만 열람할 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {boardData ? <IdeathonTeamProfileForm data={boardData} onSaved={loadBoard} /> : null}

            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-[1fr_140px_150px_150px_auto]">
                <label className="relative">
                  <span className="sr-only">검색</span>
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b5e]" strokeWidth={2} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="이름, 학과, 태그 검색"
                    className="h-10 w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 pl-10 pr-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="sr-only">구분 필터</span>
                  <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)} className="h-10 rounded-lg border border-[#ddd9cc] bg-white px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f]">
                    <option value="all">전체</option>
                    <option value="learner">{roleLabel("learner")}</option>
                    <option value="preneur">{roleLabel("preneur")}</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="sr-only">능력 태그 필터</span>
                  <select aria-label="능력 태그 필터" value={abilityFilter} onChange={(event) => setAbilityFilter(event.target.value)} className="h-10 rounded-lg border border-[#ddd9cc] bg-white px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f]">
                    <option value="all">모든 태그</option>
                    {abilityOptions.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="sr-only">관심 태그 필터</span>
                  <select aria-label="관심 태그 필터" value={interestFilter} onChange={(event) => setInterestFilter(event.target.value)} className="h-10 rounded-lg border border-[#ddd9cc] bg-white px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f]">
                    <option value="all">모든 관심</option>
                    {interestOptions.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </label>
                <div className="flex rounded-lg border border-[#ddd9cc] bg-white p-1">
                  <button type="button" onClick={() => setView("grid")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-semibold ${view === "grid" ? "bg-[#16140f] text-white" : "text-[#16140f]"}`}>
                    <LayoutGrid className="h-4 w-4" strokeWidth={2} />
                    그리드 보기
                  </button>
                  <button type="button" onClick={() => setView("table")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-semibold ${view === "table" ? "bg-[#16140f] text-white" : "text-[#16140f]"}`}>
                    <TableProperties className="h-4 w-4" strokeWidth={2} />
                    표 보기
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-lg border border-[#ddd9cc] bg-white p-5 font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318]">
                  {error}
                </p>
              ) : isFetching && !boardData ? (
                <p className="rounded-lg border border-[#ddd9cc] bg-white p-5 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  명단을 불러오는 중입니다...
                </p>
              ) : view === "table" ? (
                <IdeathonTeamProfileTable profiles={filteredProfiles} onOpen={setSelectedProfile} />
              ) : (
                <div data-testid="ideathon-board-results" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProfiles.length === 0 ? (
                    <div className="rounded-lg border border-[#ddd9cc] bg-white p-6 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                      조건에 맞는 소개가 없습니다.
                    </div>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <IdeathonTeamProfileCard key={profile.id} profile={profile} onOpen={setSelectedProfile} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedProfile ? (
        <IdeathonTeamProfileModal
          profile={selectedProfile}
          isOwner={boardData?.currentUser.id === selectedProfile.user_id}
          onClose={() => setSelectedProfile(null)}
          onEdit={() => {
            setSelectedProfile(null);
            document.getElementById("ideathon-team-profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      ) : null}
    </section>
  );
}
