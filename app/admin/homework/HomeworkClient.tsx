"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncHomeworkSubmissions } from "@/lib/actions/tracker";

type Homework = {
  id: string;
  title: string;
  individual_content: string[];
  team_content: string[];
  submission_link?: string;
  padlet_board_id?: string;
  is_individual: boolean;
  is_team: boolean;
  created_at: string;
};

type PadletSection = {
  id: string;
  title: string;
};

type PadletPost = {
  id: string;
  author?: { name?: string; email?: string; username?: string };
  section_id?: string;
  title?: string;
  body?: string;
};

type SubmissionRow = {
  label: string;         // runner name
  isTeam: boolean;
  memberNames: string[];
  sectionStatus: Record<string, boolean>; // sectionId -> submitted
  teamLabel?: string;    // e.g. "(Team A)" if in a team
};

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  slug: string | null;
  role: string | null;
  photo?: string | null;
};

type TeamAssignment = {
  teamName: string;
  memberIds: string[];
};

const supabase = createClient();

export function HomeworkClient() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [availableRunners, setAvailableRunners] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form States
  const [newTitle, setNewTitle] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [padletBoardId, setPadletBoardId] = useState("");
  const [individualTasks, setIndividualTasks] = useState<string[]>([""]);
  const [teamTasks, setTeamTasks] = useState<string[]>([""]);
  const [isIndividual, setIsIndividual] = useState(true);
  const [isTeam, setIsTeam] = useState(false);
  const [teams, setTeams] = useState<TeamAssignment[]>([]);
  const [teamSearchQueries, setTeamSearchQueries] = useState<string[]>([]);

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingTeams, setViewingTeams] = useState<{
    team_name: string;
    user_id: string;
  }[]>([]);
  const [activeTab, setActiveTab] = useState<Record<string, 'content' | 'status'>>({});
  const [padletData, setPadletData] = useState<Record<string, { sections: PadletSection[]; posts: PadletPost[]; loading: boolean; error: string | null }>>({});

  const fetchHomeworks = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("homeworks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHomeworks(data as unknown as Homework[]);
    }
    setIsLoading(false);
  }, []);

  const fetchRunners = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,username,slug,role") // Added slug
      .eq("role", "runner");
    if (!error && data) {
      setAvailableRunners(data as Profile[]);
    }
  }, []);

  useEffect(() => {
    fetchHomeworks();
    fetchRunners();
  }, [fetchHomeworks, fetchRunners]);

  const [isSyncing, setIsSyncing] = useState(false);

  const buildSubmissionRows = useCallback((hw: Homework): SubmissionRow[] => {
    const pData = padletData[hw.id];
    if (!pData) return [];
    const { sections, posts } = pData;

    // Build a map: runnerId -> { teamName, allTeamMemberNames }
    // so we can check if any team member submitted for team sections
    const runnerTeamMap = new Map<string, { teamName: string; memberNames: string[]; memberUsernames: string[] }>();
    if (hw.is_team && viewingTeams.length > 0) {
      // Create a map of user_id to profile for quick lookup
      const runnerLookup = new Map(availableRunners.map(r => [r.id, r]));

      viewingTeams.forEach(vt => {
        const teamMembers = viewingTeams
          .filter(m => m.team_name === vt.team_name);
        
        const memberNames = teamMembers.map(m => runnerLookup.get(m.user_id)?.name || 'Unknown');
        const memberUsernames = teamMembers.map(m => runnerLookup.get(m.user_id)?.username || '');
        
        runnerTeamMap.set(vt.user_id, { teamName: vt.team_name, memberNames, memberUsernames });
      });
    }

    // Helper: did any of 'names' post in this section?
    const anyPostedInSection = (targetNames: string[], targetUsernames: string[], sectionId: string | undefined) =>
      posts.some(p => {
        const sMatch = sectionId ? p.section_id === sectionId : !p.section_id;
        if (!sMatch) return false;

        const authorName = (p.author?.name || '').toLowerCase();
        const authorUsername = (p.author?.username || '').toLowerCase().replace(/^@/, ''); // Remove leading @ if present
        
        const matchesName = targetNames.some(n => {
          const nl = n.toLowerCase();
          return nl && (authorName.includes(nl) || nl.includes(authorName));
        });

        const matchesUsername = targetUsernames.some(u => {
          const ul = u.toLowerCase().replace(/^@/, '');
          return ul && (authorUsername === ul); // Exact match for username is safer
        });

        return matchesName || matchesUsername;
      });

    const rows: SubmissionRow[] = [];

    // Show every available runner as a row
    availableRunners.forEach(runner => {
      const sectionStatus: Record<string, boolean> = {};
      const teamInfo = runnerTeamMap.get(runner.id);

      // Collect all names and usernames to search for (including team members)
      const targetNames: string[] = runner.name ? [runner.name] : [];
      const targetUsernames: string[] = runner.username ? [runner.username] : [];

      if (teamInfo) {
        teamInfo.memberNames.forEach(name => {
          if (!targetNames.includes(name)) targetNames.push(name);
        });
        teamInfo.memberUsernames.forEach(username => {
          if (!targetUsernames.includes(username)) targetUsernames.push(username);
        });
      }

      sections.forEach(s => {
        sectionStatus[s.id] = anyPostedInSection(targetNames, targetUsernames, s.id);
      });

      if (sections.length === 0) {
        sectionStatus['__none__'] = anyPostedInSection(targetNames, targetUsernames, undefined);
      }

      const teamLabel = teamInfo ? `(${teamInfo.teamName})` : '';
      rows.push({
        label: runner.name || 'Unknown',
        isTeam: !!teamInfo,
        memberNames: teamInfo?.memberNames ?? (runner.name ? [runner.name] : []),
        sectionStatus,
        teamLabel,
      });
    });

    return rows;
  }, [padletData, viewingTeams, availableRunners]);

  // Sync Padlet data with Database when loaded
  useEffect(() => {
    const syncAll = async () => {
      setIsSyncing(true);
      try {
        for (const hwId of Object.keys(padletData)) {
          const pData = padletData[hwId];
          if (pData && !pData.loading && !pData.error && availableRunners.length > 0) {
            const hw = homeworks.find(h => h.id === hwId);
            if (hw) {
              const rows = buildSubmissionRows(hw);
              const syncData = availableRunners.map(runner => {
                const row = rows.find(r => r.label === (runner.name ?? 'Unknown'));
                const isCompleted = row ? Object.values(row.sectionStatus).some(v => v === true) : false;
                return {
                  user_id: runner.id,
                  status: isCompleted ? "completed" : "pending"
                };
              });
              await syncHomeworkSubmissions(hwId, syncData);
            }
          }
        }
      } catch (err) {
        console.error("Sync failed:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    if (Object.keys(padletData).length > 0) {
      syncAll();
    }
  }, [padletData, availableRunners, homeworks, buildSubmissionRows]);

  const handleFetchTeams = useCallback(async (homeworkId: string) => {
    let shouldFetch = false;
    setViewingId(prev => {
      if (prev === homeworkId) {
        return null; // toggle off
      }
      shouldFetch = true;
      return homeworkId;
    });

    if (!shouldFetch) return;

    const { data, error } = await supabase
      .from("homework_team_assignments")
      .select("team_name,user_id")
      .eq("homework_id", homeworkId);

    if (!error && data) {
      setViewingTeams(data as { team_name: string; user_id: string }[]);
    } else {
      setViewingTeams([]);
    }
  }, []);

  // Silently fetch team data for a homework without toggling viewingId (used by status tab)
  const fetchTeamData = useCallback(async (homeworkId: string) => {
    const { data, error } = await supabase
      .from("homework_team_assignments")
      .select("team_name,user_id")
      .eq("homework_id", homeworkId);

    if (!error && data) {
      setViewingTeams(data as { team_name: string; user_id: string }[]);
    }
  }, []);

  const resetForm = useCallback(() => {
    setNewTitle("");
    setSubmissionLink("");
    setPadletBoardId("");
    setIndividualTasks([""]);
    setTeamTasks([""]);
    setIsIndividual(true);
    setIsTeam(false);
    setTeams([]);
    setTeamSearchQueries([]);
  }, []);

  const handleAddHomework = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!isIndividual && !isTeam) {
      alert("개인 또는 팀 중 적어도 하나는 선택해야 합니다.");
      return;
    }

    const { data: hwData, error: hwError } = await supabase
      .from("homeworks")
      .insert([
        {
          title: newTitle,
          submission_link: submissionLink.trim() || null,
          padlet_board_id: padletBoardId.trim() || null,
          individual_content: isIndividual ? individualTasks.filter(t => t.trim() !== "") : [],
          team_content: isTeam ? teamTasks.filter(t => t.trim() !== "") : [],
          is_individual: isIndividual,
          is_team: isTeam,
        },
      ])
      .select()
      .single();

    if (hwError || !hwData) {
      alert("과제 생성 중 에러가 발생했습니다.");
      return;
    }

    // Handle Team Assignments if Team is selected
    if (isTeam && teams.length > 0) {
      const assignments = teams.flatMap(t => 
        t.memberIds.map(mId => ({
          homework_id: hwData.id,
          user_id: mId,
          team_name: t.teamName
        }))
      );

      const { error: teamError } = await supabase
        .from("homework_team_assignments")
        .insert(assignments);

      if (teamError) {
        alert("팀 배정 중 일부 에러가 발생했습니다.");
      }
    }

    setHomeworks(prev => [hwData as unknown as Homework, ...prev]);
    resetForm();
    setIsAdding(false);
  }, [newTitle, submissionLink, padletBoardId, isIndividual, isTeam, individualTasks, teamTasks, teams, resetForm]);

  const addTeam = useCallback(() => {
    setTeams(prev => [...prev, { teamName: `Team ${prev.length + 1}`, memberIds: [] }]);
    setTeamSearchQueries(prev => [...prev, ""]);
  }, []);

  const removeTeam = useCallback((index: number) => {
    setTeams(prev => prev.filter((_, i) => i !== index));
    setTeamSearchQueries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleMemberInTeam = useCallback((teamIndex: number, userId: string) => {
    setTeams(prevTeams => {
      const newTeams = [...prevTeams];
      const memberIds = newTeams[teamIndex].memberIds;
      if (memberIds.includes(userId)) {
        newTeams[teamIndex] = { 
          ...newTeams[teamIndex], 
          memberIds: memberIds.filter(id => id !== userId) 
        };
      } else {
        newTeams[teamIndex] = { 
          ...newTeams[teamIndex], 
          memberIds: [...memberIds, userId] 
        };
      }
      return newTeams;
    });
    
    // Clear search after adding
    setTeamSearchQueries(prevQueries => {
      const newQueries = [...prevQueries];
      newQueries[teamIndex] = "";
      return newQueries;
    });
  }, []);

  const handleDeleteHomework = useCallback(async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("homeworks").delete().eq("id", id);
    if (!error) {
      setHomeworks(prev => prev.filter((hw) => hw.id !== id));
    }
  }, []);

  const loadPadletData = useCallback(async (hwId: string, boardId: string) => {
    if (!boardId) return;

    setPadletData(prev => ({ ...prev, [hwId]: { sections: [], posts: [], loading: true, error: null } }));

    try {
      const res = await fetch(`/api/padlet/board?board_id=${boardId}`);
      const json = await res.json();

      if (!res.ok) {
        setPadletData(prev => ({ ...prev, [hwId]: { sections: [], posts: [], loading: false, error: json.error || '불러오기 실패' } }));
        return;
      }

      const sections: PadletSection[] = json.sections || [];
      const posts: PadletPost[] = json.posts || [];

      setPadletData(prev => ({ ...prev, [hwId]: { sections, posts, loading: false, error: null } }));
    } catch (e: unknown) {
      setPadletData(prev => ({ ...prev, [hwId]: { sections: [], posts: [], loading: false, error: (e as Error).message } }));
    }
  }, []);


  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#16140f]">
            전체 과제 관리 {isSyncing && <span className="ml-2 inline-flex items-center text-[10px] font-black text-amber-500 animate-pulse uppercase tracking-[2px]">● Synchronizing...</span>}
          </h1>
          <p className="text-sm font-medium text-[#a1a196]">과제를 생성하고 유형별 내용을 작성하세요.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95 ${
            isAdding ? "bg-[#6b6b5e] rotate-45" : "bg-[#FF6C0F] shadow-orange-200"
          }`}
          aria-label={isAdding ? "과제 추가 취소" : "새 과제 추가"}
        >
          <span className="text-2xl font-light leading-none">+</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleAddHomework}
          className="animate-in fade-in slide-in-from-top-4 rounded-xl border border-[#d9d9cc] bg-white p-6 shadow-sm space-y-8"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Left Column: Basic Info & Mode Selection */}
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a196] border-b border-[#f0efe6] pb-2">Step 1. Basic Info</h3>
                <div>
                  <label htmlFor="hw-title" className="block text-sm font-bold text-[#16140f] mb-2">과제 제목 (Main Title)</label>
                  <input
                    id="hw-title"
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="예: 3월 2주차 기획 및 개발 과제"
                    className="w-full rounded-xl border border-[#d9d9cc] bg-[#fcfcfb] px-4 py-3 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="padlet-id" className="block text-sm font-bold text-[#16140f] mb-1 mt-4">Padlet Board ID</label>
                  <p className="text-[11px] text-[#a1a196] mb-2">Padlet URL에서 숫자 ID를 입력하세요. (예: padlet.com/user/<strong>12345678</strong>)</p>
                  <input
                    id="padlet-id"
                    type="text"
                    value={padletBoardId}
                    onChange={(e) => setPadletBoardId(e.target.value)}
                    placeholder="예: 123456789"
                    className="w-full rounded-xl border border-[#d9d9cc] bg-[#fcfcfb] px-4 py-3 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="submit-link" className="block text-sm font-bold text-[#16140f] mb-2 mt-4">과제 제출 링크 (Submission Link, 러너에게 표시)</label>
                  <input
                    id="submit-link"
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://padlet.com/..."
                    className="w-full rounded-xl border border-[#d9d9cc] bg-[#fcfcfb] px-4 py-3 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a196] border-b border-[#f0efe6] pb-2">Step 2. Select Homework Modes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsIndividual(!isIndividual)}
                    className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 transition-all ${
                      isIndividual 
                        ? "border-[#FF6C0F] bg-[#FFF0E5] text-[#FF6C0F] shadow-inner" 
                        : "border-[#f0efe6] bg-white text-[#a1a196] hover:border-[#d9d9cc]"
                    }`}
                  >
                    <span role="img" aria-label="개인" className={`text-4xl transition-transform group-hover:scale-110 ${isIndividual ? "filter-none" : "grayscale opacity-50"}`}>👤</span>
                    <div className="text-center">
                      <p className="text-sm font-black">개인 과제 활성화</p>
                      <p className="text-[10px] font-medium mt-0.5">개별 가이드라인 작성</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTeam(!isTeam)}
                    className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 transition-all ${
                      isTeam 
                        ? "border-[#FF6C0F] bg-[#FFF0E5] text-[#FF6C0F] shadow-inner" 
                        : "border-[#f0efe6] bg-white text-[#a1a196] hover:border-[#d9d9cc]"
                    }`}
                  >
                    <span role="img" aria-label="팀" className={`text-4xl transition-transform group-hover:scale-110 ${isTeam ? "filter-none" : "grayscale opacity-50"}`}>👥</span>
                    <div className="text-center">
                      <p className="text-sm font-black">팀 과제 활성화</p>
                      <p className="text-[10px] font-medium mt-0.5">협동 가이드라인 작성</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* Mode-specific Content Sections */}
              {(isIndividual || isTeam) && (
                <section className="space-y-6 animate-in slide-in-from-left-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a196] border-b border-[#f0efe6] pb-2">Step 3. Detailed Instructions</h3>
                  
                  {isIndividual && (
                    <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="flex items-center gap-2 text-sm font-bold text-blue-600">
                          <span role="img" aria-label="개인">👤</span> 개인 과제 목록
                        </label>
                        <button
                          type="button"
                          onClick={() => setIndividualTasks([...individualTasks, ""])}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-sm hover:scale-110 active:scale-95 transition-all shadow-sm shadow-blue-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="space-y-3">
                        {individualTasks.map((task, idx) => (
                          <div key={`indiv-task-${idx}`} className="group relative">
                            <textarea
                              value={task}
                              onChange={(e) => {
                                const newTasks = [...individualTasks];
                                newTasks[idx] = e.target.value;
                                setIndividualTasks(newTasks);
                              }}
                              placeholder={`개인별 수행 과제 #${idx + 1}`}
                              rows={3}
                              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none transition-all placeholder:text-blue-200 bg-white shadow-sm"
                            />
                            {individualTasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setIndividualTasks(individualTasks.filter((_, i) => i !== idx))}
                                className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-400 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isTeam && (
                    <div className="space-y-4 rounded-2xl border border-purple-100 bg-purple-50/30 p-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="flex items-center gap-2 text-sm font-bold text-purple-600">
                          <span role="img" aria-label="팀">👥</span> 팀 과제 목록
                        </label>
                        <button
                          type="button"
                          onClick={() => setTeamTasks([...teamTasks, ""])}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-sm hover:scale-110 active:scale-95 transition-all shadow-sm shadow-purple-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="space-y-3">
                        {teamTasks.map((task, idx) => (
                          <div key={`team-task-${idx}`} className="group relative">
                            <textarea
                              value={task}
                              onChange={(e) => {
                                const newTasks = [...teamTasks];
                                newTasks[idx] = e.target.value;
                                setTeamTasks(newTasks);
                              }}
                              placeholder={`팀 단위 협동 과제 #${idx + 1}`}
                              rows={3}
                              className="w-full rounded-xl border border-purple-100 px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-all placeholder:text-purple-200 bg-white shadow-sm"
                            />
                            {teamTasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTeamTasks(teamTasks.filter((_, i) => i !== idx))}
                                className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-400 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Right Column: Team Builder */}
            <div className={`flex flex-col rounded-3xl p-8 border-2 transition-all ${isTeam ? "bg-[#fcfcfb] border-[#d9d9cc]" : "bg-[#f5f5ee] border-transparent opacity-50 grayscale pointer-events-none"}`}>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-black text-[#16140f] flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16140f] text-white text-sm">4</span>
                    Team Assignment
                  </h4>
                  <button
                    type="button"
                    onClick={addTeam}
                    className="flex items-center gap-1.5 rounded-xl bg-[#FF6C0F] px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-100 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>+</span> 새 팀 생성
                  </button>
                </div>
                <p className="text-xs font-medium text-[#6b6b5e]">생성된 팀에 멤버를 배정하거나 이름을 수정할 수 있습니다.</p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-visible">
                {teams.map((t, idx) => (
                  <div key={`team-builder-${idx}`} className="group relative rounded-2xl border-2 border-[#f0efe6] bg-white p-5 shadow-sm transition-all hover:border-[#FF6C0F]">
                    <div className="flex items-center justify-between mb-4">
                      <input
                        type="text"
                        value={t.teamName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTeams(prev => {
                            const newTs = [...prev];
                            newTs[idx] = { ...newTs[idx], teamName: val };
                            return newTs;
                          });
                        }}
                        className="text-sm font-black text-[#FF6C0F] bg-transparent border-none p-0 focus:ring-0 w-2/3"
                        placeholder="팀 이름"
                      />
                      <button
                        type="button"
                        onClick={() => removeTeam(idx)}
                        className="rounded-lg bg-red-50 p-1.5 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-400 hover:text-white"
                      >
                        <span className="text-[10px] font-bold">삭제</span>
                      </button>
                    </div>

                    {/* Member Chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {t.memberIds.map(mId => {
                        const runner = availableRunners.find(r => r.id === mId);
                        return (
                          <div key={`team-${idx}-member-${mId}`} className="flex items-center gap-2 rounded-xl bg-[#f5f5ee] px-3 py-1.5 text-[11px] font-bold text-[#16140f] border border-[#d9d9cc]">
                            {runner?.name || "Unknown"}
                            <button 
                              type="button" 
                              onClick={() => toggleMemberInTeam(idx, mId)}
                              className="text-[#a1a196] hover:text-red-500 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      {t.memberIds.length === 0 && (
                        <p className="text-[11px] font-medium text-[#a1a196] italic bg-[#fcfcfb] border border-dashed border-[#d9d9cc] rounded-xl px-4 py-2 w-full text-center">배정된 팀원이 없습니다.</p>
                      )}
                    </div>

                    {/* Member Search */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-tighter text-[#a1a196]">Add Member</label>
                       <div className="flex items-center gap-2">
                         <input
                          type="text"
                          placeholder="이름 검색..."
                          value={teamSearchQueries[idx] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeamSearchQueries(prev => {
                              const newQs = [...prev];
                              newQs[idx] = val;
                              return newQs;
                            });
                          }}
                          className="flex-1 rounded-xl border border-[#f0efe6] bg-[#fcfcfb] px-3 py-2 text-xs focus:border-[#FF6C0F] focus:outline-none transition-all"
                        />
                       </div>
                       
                       {/* Result List */}
                       {teamSearchQueries[idx] && (
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto rounded-xl border border-dashed border-[#d9d9cc] bg-[#fcfcfb] p-2 animate-in fade-in duration-200">
                          {availableRunners
                            .filter(r => 
                              (r.name?.toLowerCase() || "").includes(teamSearchQueries[idx]?.toLowerCase() || "") &&
                              !teams.some(team => team.memberIds.includes(r.id))
                            )
                            .map(runner => (
                              <button
                                key={`search-result-${runner.id}`}
                                type="button"
                                onClick={() => toggleMemberInTeam(idx, runner.id)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-bold hover:bg-[#FF6C0F] hover:text-white transition-all shadow-sm"
                              >
                                <span>{runner.name || "Unknown"}</span>
                                <span className="text-[9px] opacity-70">{runner.role}</span>
                              </button>
                            ))}
                          {availableRunners.filter(r => 
                            (r.name?.toLowerCase() || "").includes(teamSearchQueries[idx]?.toLowerCase() || "") &&
                            !teams.some(team => team.memberIds.includes(r.id))
                          ).length === 0 && (
                            <p className="py-2 text-center text-[10px] text-[#a1a196]">검색 결과가 없습니다.</p>
                          )}
                        </div>
                       )}
                    </div>
                  </div>
                ))}
                {teams.length === 0 && isTeam && (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#d9d9cc]">
                    <span role="img" aria-label="빈 폴더" className="text-4xl mb-4">📂</span>
                    <p className="text-sm font-bold text-[#6b6b5e]">배정할 팀을 만들어주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-8 border-t-2 border-[#f0efe6]">
            <button
              type="button"
              onClick={() => { setIsAdding(false); resetForm(); }}
              className="rounded-2xl px-8 py-3.5 text-sm font-bold text-[#6b6b5e] hover:bg-[#f5f5ee] transition-all"
            >
              취소 (Cancel)
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-[#16140f] px-12 py-3.5 text-sm font-black text-white shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              과제 생성 및 배포
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-6 mt-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6C0F] border-t-transparent" />
            <p className="text-sm font-black text-[#a1a196] uppercase tracking-[2px]">Synchronizing...</p>
          </div>
        ) : homeworks.length === 0 ? (
          <div className="rounded-[40px] border-4 border-dashed border-[#d9d9cc] bg-white p-32 text-center">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#f5f5ee]">
              <span role="img" aria-label="빈 박스" className="text-5xl">📦</span>
            </div>
            <h3 className="text-2xl font-black text-[#16140f]">No Homework Found</h3>
            <p className="mt-2 text-[#6b6b5e] font-medium">관리 중인 과제가 없습니다. 새로운 과제를 생성해보세요.</p>
          </div>
        ) : (
          homeworks.map((hw: Homework) => (
            <div key={hw.id} className="group overflow-hidden rounded-[32px] border-2 border-[#d9d9cc] bg-white transition-all hover:border-[#FF6C0F] hover:shadow-2xl hover:-translate-y-1">
              <div className="flex flex-wrap items-center justify-between px-10 py-7 gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#f5f5ee] text-3xl group-hover:bg-[#FFF0E5] group-hover:rotate-3 transition-all duration-300">
                    <span role="img" aria-label="책">📚</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#16140f]">{hw.title}</h3>
                    <div className="flex gap-2 mt-2">
                      {hw.is_individual && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600 ring-2 ring-blue-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> 개인과제
                        </span>
                      )}
                      {hw.is_team && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-black text-purple-600 ring-2 ring-purple-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-600" /> 팀과제
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-[#a1a196] uppercase tracking-tighter">Distributed On</p>
                    <p className="text-sm font-black text-[#6b6b5e]">
                      {new Date(hw.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleFetchTeams(hw.id)}
                      className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${
                        viewingId === hw.id 
                        ? "bg-[#16140f] text-white shadow-lg" 
                        : "bg-[#f5f5ee] text-[#16140f] hover:bg-[#16140f] hover:text-white"
                      }`}
                    >
                      {viewingId === hw.id ? "닫기" : "열람하기"}
                    </button>
                    <button
                      onClick={() => handleDeleteHomework(hw.id)}
                      className="rounded-2xl border-2 border-red-50 px-4 py-3 text-xs font-black text-red-300 transition-all hover:bg-red-500 hover:text-white hover:border-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Detail Area */}
              {viewingId === hw.id && (
                <div className="border-t-2 border-[#f0efe6] bg-[#fcfcfb] animate-in slide-in-from-top-6 duration-500">
                  {/* Tabs */}
                  <div className="flex items-center gap-1 px-10 pt-8 border-b border-[#f0efe6]">
                    <button
                      onClick={() => setActiveTab(prev => ({ ...prev, [hw.id]: 'content' }))}
                      className={`px-5 py-2.5 text-xs font-black rounded-t-xl transition-all ${
                        (activeTab[hw.id] ?? 'content') === 'content'
                          ? 'bg-white border-2 border-b-white border-[#f0efe6] text-[#16140f] -mb-[2px]'
                          : 'text-[#a1a196] hover:text-[#16140f]'
                      }`}
                    >
                      📋 과제 내용
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab(prev => ({ ...prev, [hw.id]: 'status' }));
                        loadPadletData(hw.id, hw.padlet_board_id!);
                        // Auto-load team assignments if not loaded yet (without toggling the details panel)
                        if (hw.is_team && viewingTeams.length === 0) {
                          fetchTeamData(hw.id);
                        }
                      }}
                      className={`px-5 py-2.5 text-xs font-black rounded-t-xl transition-all ${
                        activeTab[hw.id] === 'status'
                          ? 'bg-white border-2 border-b-white border-[#f0efe6] text-[#FF6C0F] -mb-[2px]'
                          : 'text-[#a1a196] hover:text-[#FF6C0F]'
                      }`}
                    >
                      📊 제출 현황
                      {!hw.padlet_board_id && <span className="ml-1 text-[9px] text-red-400">(Board ID 없음)</span>}
                    </button>
                  </div>

                  <div className="p-10">
                    {/* Tab: 과제 내용 */}
                    {(activeTab[hw.id] ?? 'content') === 'content' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
                          {hw.is_individual && hw.individual_content && (
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2.5 text-sm font-black text-blue-600 uppercase tracking-widest">
                                <span className="h-2 w-2 rounded-full bg-blue-600" /> 개인 과제 목록
                              </h4>
                              <div className="space-y-4">
                                {hw.individual_content.map((task: string, tIdx: number) => (
                                  <div key={`indiv-content-${hw.id}-${tIdx}`} className="rounded-[28px] bg-white p-8 shadow-sm border border-[#f0efe6] whitespace-pre-wrap text-[#4a4a40] leading-[1.8] font-medium transition-all hover:shadow-md">
                                    <span className="text-blue-500 font-bold mr-2">#{tIdx + 1}</span> {task}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {hw.is_team && hw.team_content && (
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2.5 text-sm font-black text-purple-600 uppercase tracking-widest">
                                <span className="h-2 w-2 rounded-full bg-purple-600" /> 팀 협동 과제 목록
                              </h4>
                              <div className="space-y-4">
                                {hw.team_content.map((task: string, tIdx: number) => (
                                  <div key={`team-content-${hw.id}-${tIdx}`} className="rounded-[28px] bg-white p-8 shadow-sm border border-[#f0efe6] whitespace-pre-wrap text-[#4a4a40] leading-[1.8] font-medium transition-all hover:shadow-md">
                                    <span className="text-purple-500 font-bold mr-2">#{tIdx + 1}</span> {task}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {hw.is_team && viewingTeams.length > 0 && (
                          <div className="lg:col-span-12 xl:col-span-4 mt-4 xl:mt-0">
                            <div className="sticky top-10 space-y-6">
                              <h4 className="flex items-center gap-2.5 text-sm font-black text-[#FF6C0F] uppercase tracking-widest">
                                <span className="h-2 w-2 rounded-full bg-[#FF6C0F]" /> 팀 빌딩 현황
                              </h4>
                              <div className="space-y-5 rounded-[32px] bg-white p-8 shadow-lg border-2 border-[#f0efe6]">
                                {[...new Set(viewingTeams.map(vt => vt.team_name))].map(teamName => (
                                  <div key={`team-view-${hw.id}-${teamName}`} className="group/item">
                                    <p className="text-sm font-black text-[#FF6C0F] mb-3 flex items-center justify-between">
                                      {teamName}
                                      <span className="text-[10px] font-bold text-[#a1a196] bg-[#f5f5ee] px-2 py-0.5 rounded-lg">
                                        {viewingTeams.filter(vt => vt.team_name === teamName).length} 명
                                      </span>
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {viewingTeams.filter(vt => vt.team_name === teamName).map((member) => {
                                        const runner = availableRunners.find(r => r.id === member.user_id);
                                        return (
                                          <span key={`member-tag-${hw.id}-${member.user_id}`} className="inline-flex items-center rounded-xl bg-[#f5f5ee] px-3 py-1.5 text-[11px] font-bold text-[#16140f] border border-transparent transition-all group-hover/item:border-[#FF6C0F] group-hover/item:bg-white">
                                            {runner?.name || 'Unknown'}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <div className="mt-4 border-b border-[#f0efe6] last:border-0" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: 제출 현황 */}
                    {activeTab[hw.id] === 'status' && (() => {
                      const pData = padletData[hw.id];
                      if (!hw.padlet_board_id) {
                        return (
                          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#d9d9cc]">
                            <span role="img" aria-label="금지" className="text-4xl mb-4">🚫</span>
                            <p className="text-sm font-bold text-[#a1a196]">Padlet Board ID가 설정되지 않았습니다.</p>
                          </div>
                        );
                      }
                      if (pData?.loading) return <div className="text-center py-20 text-xs font-black text-[#a1a196] animate-pulse">PADLET 부르는 중...</div>;
                      if (pData?.error) return <div className="text-center py-20 text-red-400 text-xs font-bold">{pData.error}</div>;
                      if (!pData) return (
                        <div className="text-center py-20">
                          <button 
                            onClick={() => loadPadletData(hw.id, hw.padlet_board_id!)}
                            className="text-xs font-black text-[#FF6C0F] hover:underline"
                          >
                            제출 결과 부르기 (Load status)
                          </button>
                        </div>
                      );

                      const rows = buildSubmissionRows(hw);

                      // Team homework but no team data loaded
                      if (hw.is_team && viewingTeams.length === 0 && rows.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#d9d9cc]">
                            <span role="img" aria-label="팀원" className="text-4xl mb-4">👥</span>
                            <p className="text-sm font-bold text-[#6b6b5e]">팀 배정 정보가 없습니다.</p>
                            <p className="text-xs text-[#a1a196] mt-1">과제를 생성할 때 팀을 배정했는지 확인하세요.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                              <tr className="border-b-2 border-[#f0efe6]">
                                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-[#a1a196] w-1/4">대상 (Type)</th>
                                {pData.sections && pData.sections.length > 0 ? pData.sections.map(s => (
                                  <th key={`head-${hw.id}-${s.id}`} className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-[#a1a196] text-center">
                                    {s.title}
                                  </th>
                                )) : (
                                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-[#a1a196] text-center">전체 (No Section)</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0efe6]">
                              {rows.map((row, rIdx) => (
                                <tr key={`row-${hw.id}-${rIdx}`} className="hover:bg-white transition-colors">
                                  <td className="py-5 px-4">
                                    <p className="text-sm font-black text-[#16140f]">{row.label}</p>
                                    {row.teamLabel && (
                                      <span className="inline-block mt-0.5 text-[10px] font-bold text-[#FF6C0F] bg-orange-50 px-2 py-0.5 rounded-lg">
                                        {row.teamLabel}
                                      </span>
                                    )}
                                  </td>
                                  {Object.keys(row.sectionStatus).map(sId => (
                                    <td key={`cell-${hw.id}-${rIdx}-${sId}`} className="py-5 px-4 text-center">
                                      {row.sectionStatus[sId] ? (
                                        <span role="img" aria-label="제출 완료" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 ring-2 ring-green-100">✅</span>
                                      ) : (
                                        <span role="img" aria-label="미제출" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-200 ring-1 ring-red-50 opacity-40">❌</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
