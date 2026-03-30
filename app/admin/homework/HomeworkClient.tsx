"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncHomeworkSubmissions, upsertHomework, replaceHomeworkTeams } from "@/lib/actions/tracker";
import { uploadHomeworkImage } from "@/lib/storage";
import {
  User,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  FolderOpen,
  Package,
  AlertCircle,
  Check,
  X,
  Pencil,
  ImageIcon,
} from "lucide-react";

type Homework = {
  id: string;
  title: string;
  individual_content: string[];
  team_content: string[];
  submission_link?: string;
  padlet_board_id?: string;
  is_individual: boolean;
  is_team: boolean;
  due_date?: string | null;
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
  label: string;         // learner name
  isTeam: boolean;
  memberNames: string[];
  sectionStatus: Record<string, boolean>; // sectionId -> submitted
  teamLabel?: string;    // e.g. "(Team A)" if in a team
};

type Profile = {
  id: string;
  name: string;
  username: string;
  slug: string;
  role: string;
};

type TeamAssignment = {
  teamName: string;
  memberIds: string[];
};

const supabase = createClient();

export function HomeworkClient() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [availableLearners, setAvailableLearners] = useState<Profile[]>([]);
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
  const [dueDate, setDueDate] = useState("");
  const [teams, setTeams] = useState<TeamAssignment[]>([]);
  const [teamSearchQueries, setTeamSearchQueries] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [uploadingTaskIndex, setUploadingTaskIndex] = useState<{ type: 'individual' | 'team'; idx: number } | null>(null);

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

  const fetchLearners = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,username,slug,role") // Added slug
      .eq("role", "learner");
    if (!error && data) {
      setAvailableLearners(data as Profile[]);
    }
  }, []);

  useEffect(() => {
    fetchHomeworks();
    fetchLearners();
  }, [fetchHomeworks, fetchLearners]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Sync Padlet data with Database when loaded
  useEffect(() => {
    const syncAll = async () => {
      setIsSyncing(true);
      try {
        for (const hwId of Object.keys(padletData)) {
          const pData = padletData[hwId];
          if (pData && !pData.loading && !pData.error && availableLearners.length > 0) {
            const hw = homeworks.find(h => h.id === hwId);
            if (hw) {
              const rows = buildSubmissionRows(hw);
              const syncData = availableLearners.map(learner => {
                const row = rows.find(r => r.label === learner.name);
                const isCompleted = row ? Object.values(row.sectionStatus).some(v => v === true) : false;
                return {
                  user_id: learner.id,
                  status: isCompleted ? "completed" : "pending"
                };
              });
              await syncHomeworkSubmissions(hwId, syncData);
            }
          }
        }
      } finally {
        setIsSyncing(false);
      }
    };

    if (Object.keys(padletData).length > 0) {
      syncAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- buildSubmissionRows is a pure function whose deps (padletData) are already listed
  }, [padletData, availableLearners, homeworks]);

  const handleFetchTeams = async (homeworkId: string) => {
    if (viewingId === homeworkId) {
      setViewingId(null);
      return;
    }

    setViewingId(homeworkId);
    const { data, error } = await supabase
      .from("homework_team_assignments")
      .select("team_name,user_id")
      .eq("homework_id", homeworkId);

    if (!error && data) {
      setViewingTeams(data as { team_name: string; user_id: string }[]);
    } else {
      setViewingTeams([]);
    }
  };

  // Silently fetch team data for a homework without toggling viewingId (used by status tab)
  const fetchTeamData = async (homeworkId: string) => {
    const { data, error } = await supabase
      .from("homework_team_assignments")
      .select("team_name,user_id")
      .eq("homework_id", homeworkId);

    if (!error && data) {
      setViewingTeams(data as { team_name: string; user_id: string }[]);
    }
  };

  const handleSubmitHomework = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!isIndividual && !isTeam) {
      alert("개인 또는 팀 중 적어도 하나는 선택해야 합니다.");
      return;
    }

    const payload = {
      ...(isEditing && editingId ? { id: editingId } : {}),
      title: newTitle,
      submission_link: submissionLink.trim() || null,
      padlet_board_id: padletBoardId.trim() || null,
      individual_content: isIndividual ? individualTasks.filter(t => t.trim() !== "") : [],
      team_content: isTeam ? teamTasks.filter(t => t.trim() !== "") : [],
      is_individual: isIndividual,
      is_team: isTeam,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    };

    const result = await upsertHomework(payload);
    if (!result.success || !result.data) {
      alert(result.error ?? "과제 저장 중 에러가 발생했습니다.");
      return;
    }

    const hwId = (result.data as { id: string }).id;

    if (isTeam) {
      const teamResult = await replaceHomeworkTeams(hwId, teams);
      if (!teamResult.success) {
        alert(teamResult.error ?? "팀 배정 중 에러가 발생했습니다.");
      }
    }

    if (isEditing) {
      setHomeworks(homeworks.map(h => h.id === hwId ? result.data as unknown as Homework : h));
    } else {
      setHomeworks([result.data as unknown as Homework, ...homeworks]);
    }

    resetForm();
    setIsAdding(false);
  };

  const resetForm = () => {
    setNewTitle("");
    setSubmissionLink("");
    setPadletBoardId("");
    setDueDate("");
    setIndividualTasks([""]);
    setTeamTasks([""]);
    setIsIndividual(true);
    setIsTeam(false);
    setTeams([]);
    setTeamSearchQueries([]);
    setEditingId(null);
    setIsEditing(false);
  };

  const openEdit = async (hw: Homework) => {
    setIsFormLoading(true);
    setEditingId(hw.id);
    setIsEditing(true);
    setNewTitle(hw.title);
    setSubmissionLink(hw.submission_link ?? "");
    setPadletBoardId(hw.padlet_board_id ?? "");
    setDueDate(hw.due_date ? new Date(hw.due_date).toISOString().slice(0, 16) : "");
    setIndividualTasks(hw.individual_content.length ? hw.individual_content : [""]);
    setTeamTasks(hw.team_content.length ? hw.team_content : [""]);
    setIsIndividual(hw.is_individual);
    setIsTeam(hw.is_team);

    if (hw.is_team) {
      const { data } = await supabase
        .from("homework_team_assignments")
        .select("team_name,user_id")
        .eq("homework_id", hw.id);

      if (data && data.length > 0) {
        const teamMap = new Map<string, string[]>();
        data.forEach((row: { team_name: string; user_id: string }) => {
          if (!teamMap.has(row.team_name)) teamMap.set(row.team_name, []);
          teamMap.get(row.team_name)!.push(row.user_id);
        });
        const rebuilt = Array.from(teamMap.entries()).map(([teamName, memberIds]) => ({
          teamName,
          memberIds,
        }));
        setTeams(rebuilt);
        setTeamSearchQueries(rebuilt.map(() => ""));
      } else {
        setTeams([]);
        setTeamSearchQueries([]);
      }
    } else {
      setTeams([]);
      setTeamSearchQueries([]);
    }

    setIsAdding(true);
    setIsFormLoading(false);
  };

  const addTeam = () => {
    setTeams([...teams, { teamName: `Team ${teams.length + 1}`, memberIds: [] }]);
    setTeamSearchQueries([...teamSearchQueries, ""]);
  };

  const removeTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index));
    setTeamSearchQueries(teamSearchQueries.filter((_, i) => i !== index));
  };

  const toggleMemberInTeam = (teamIndex: number, userId: string) => {
    const newTeams = [...teams];
    const memberIds = newTeams[teamIndex].memberIds;
    if (memberIds.includes(userId)) {
      newTeams[teamIndex].memberIds = memberIds.filter(id => id !== userId);
    } else {
      newTeams[teamIndex].memberIds = [...memberIds, userId];
    }
    setTeams(newTeams);
    
    // Clear search after adding
    const newQueries = [...teamSearchQueries];
    newQueries[teamIndex] = "";
    setTeamSearchQueries(newQueries);
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("homeworks").delete().eq("id", id);
    if (!error) {
      setHomeworks(homeworks.filter((hw) => hw.id !== id));
    }
  };

  const fetchPadletSubmissions = async (hw: Homework) => {
    if (!hw.padlet_board_id) return;
    const hwId = hw.id;

    setPadletData(prev => ({ ...prev, [hwId]: { sections: [], posts: [], loading: true, error: null } }));

    try {
      const res = await fetch(`/api/padlet/board?board_id=${hw.padlet_board_id}`);
      const json = await res.json();

      if (!res.ok) {
        setPadletData(prev => ({ ...prev, [hwId]: { sections: [], posts: [], loading: false, error: json.error || '불러오기 실패' } }));
        return;
      }

      // API now returns pre-normalized { sections, posts } shape
      const sections: PadletSection[] = json.sections || [];
      const posts: PadletPost[] = json.posts || [];

      setPadletData(prev => ({ ...prev, [hwId]: { sections, posts, loading: false, error: null } }));
    } catch (e: unknown) {
      setPadletData(prev => ({ ...prev, [hwId]: { sections: [], posts: [], loading: false, error: (e as Error).message } }));
    }
  };


  const buildSubmissionRows = (hw: Homework): SubmissionRow[] => {
    const pData = padletData[hw.id];
    if (!pData) return [];
    const { sections, posts } = pData;

    // Build a map: learnerId -> { teamName, allTeamMemberNames }
    // so we can check if any team member submitted for team sections
    const learnerTeamMap = new Map<string, { teamName: string; memberNames: string[]; memberUsernames: string[] }>();
    if (hw.is_team && viewingTeams.length > 0) {
      // Create a map of user_id to profile for quick lookup
      const learnerLookup = new Map(availableLearners.map(r => [r.id, r]));

      viewingTeams.forEach(vt => {
        const teamMembers = viewingTeams
          .filter(m => m.team_name === vt.team_name);
        
        const memberNames = teamMembers.map(m => learnerLookup.get(m.user_id)?.name || 'Unknown');
        const memberUsernames = teamMembers.map(m => learnerLookup.get(m.user_id)?.username || '');
        
        learnerTeamMap.set(vt.user_id, { teamName: vt.team_name, memberNames, memberUsernames });
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

    // Show every available learner as a row
    availableLearners.forEach(learner => {
      const sectionStatus: Record<string, boolean> = {};
      const teamInfo = learnerTeamMap.get(learner.id);

      // Collect all names and usernames to search for (including team members)
      const targetNames = [learner.name];
      const targetUsernames = [learner.username];

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
        label: learner.name,
        isTeam: !!teamInfo,
        memberNames: teamInfo?.memberNames ?? [learner.name],
        sectionStatus,
        teamLabel,
      });
    });

    return rows;
  };

  const renderTaskItem = (task: string, tIdx: number, accentColor: string) => {
    if (task.startsWith("[img]")) {
      const url = task.slice(5);
      return (
        <div key={tIdx} className="overflow-hidden rounded-lg border border-[#ece8db] bg-white">
          <img src={url} alt="과제 첨부 이미지" className="max-h-96 w-full object-contain" />
        </div>
      );
    }
    return (
      <div
        key={tIdx}
        className="whitespace-pre-wrap rounded-lg border border-[#ece8db] bg-white p-4 font-['Pretendard',sans-serif] text-sm leading-[1.8] text-[#4a4a40]"
      >
        <span className={`${accentColor} mr-2 font-semibold`}>#{tIdx + 1}</span> {task}
      </div>
    );
  };


  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">
            Homework {isSyncing && <span className="ml-2 inline-flex items-center font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#FF6C0F] animate-pulse">● Syncing...</span>}
          </h1>
          <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] sm:text-sm">과제를 생성하고 유형별 내용을 작성하세요.</p>
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              setIsAdding(false);
              resetForm();
            } else {
              setIsAdding(!isAdding);
            }
          }}
          className={`inline-flex h-8 items-center rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors ${
            isAdding ? "bg-[#6b6b5e]" : "bg-[#16140f] hover:bg-[#16140f]/80"
          }`}
        >
          {isAdding ? "취소" : "새 과제"}
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmitHomework}
          className="animate-in fade-in slide-in-from-top-4 rounded-lg border border-[#ddd9cc] bg-white p-4 sm:p-6 space-y-6 sm:space-y-8"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Left Column: Basic Info & Mode Selection */}
            <div className="space-y-6 sm:space-y-8">
              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-[#6b6b5e] border-b border-[#f0efe6] pb-2">Step 1. Basic Info</h3>
                <div>
                  <label className="block text-sm font-semibold text-[#16140f] mb-2">과제 제목 (Main Title)</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="예: 3월 2주차 기획 및 개발 과제"
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#16140f] mb-1 mt-4">Padlet Board ID</label>
                  <p className="text-[11px] text-[#6b6b5e] mb-2">Padlet URL에서 숫자 ID를 입력하세요. (예: padlet.com/user/<strong>12345678</strong>)</p>
                  <input
                    type="text"
                    value={padletBoardId}
                    onChange={(e) => setPadletBoardId(e.target.value)}
                    placeholder="예: 123456789"
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-mono text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#16140f] mb-2 mt-4">과제 제출 링크 (Submission Link, 러너에게 표시)</label>
                  <input
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://padlet.com/..."
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#16140f] mb-2 mt-4">마감일</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e] border-b border-[#f0efe6] pb-2">Step 2. Select Homework Modes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsIndividual(!isIndividual)}
                    className={`group flex flex-col items-center justify-center gap-3 rounded-lg border p-6 transition-all ${
                      isIndividual 
                        ? "border-[#FF6C0F] bg-[#FFF0E5] text-[#FF6C0F]" 
                        : "border-[#ddd9cc] bg-white text-[#6b6b5e] hover:border-[#FF6C0F]/30"
                    }`}
                  >
                    <User className={`h-8 w-8 transition-colors ${isIndividual ? "opacity-100" : "opacity-30"}`} strokeWidth={1.5} />
                    <div className="text-center">
                      <p className="font-['Pretendard',sans-serif] text-sm font-semibold">개인 과제 활성화</p>
                      <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e] mt-0.5">개별 가이드라인 작성</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTeam(!isTeam)}
                    className={`group flex flex-col items-center justify-center gap-3 rounded-lg border p-6 transition-all ${
                      isTeam 
                        ? "border-[#FF6C0F] bg-[#FFF0E5] text-[#FF6C0F]" 
                        : "border-[#ddd9cc] bg-white text-[#6b6b5e] hover:border-[#FF6C0F]/30"
                    }`}
                  >
                    <Users className={`h-8 w-8 transition-colors ${isTeam ? "opacity-100" : "opacity-30"}`} strokeWidth={1.5} />
                    <div className="text-center">
                      <p className="font-['Pretendard',sans-serif] text-sm font-semibold">팀 과제 활성화</p>
                      <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e] mt-0.5">협동 가이드라인 작성</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* Mode-specific Content Sections */}
              {(isIndividual || isTeam) && (
                <section className="space-y-6 animate-in slide-in-from-left-4">
                  <h3 className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e] border-b border-[#f0efe6] pb-2">Step 3. Detailed Instructions</h3>
                  
                  {isIndividual && (
                    <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-[#f5f5ee] p-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#2563EB]">
                          <User className="h-4 w-4" strokeWidth={2} /> 개인 과제 목록
                        </label>
                        <button
                          type="button"
                          onClick={() => setIndividualTasks([...individualTasks, ""])}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16140f] text-white text-sm transition-colors hover:bg-[#16140f]/90"
                        >
                          +
                        </button>
                      </div>
                      <div className="space-y-3">
                        {individualTasks.map((task, idx) => (
                          <div key={idx} className="group relative">
                            {task.startsWith("[img]") ? (
                              <div className="overflow-hidden rounded-lg border border-[#ddd9cc] bg-white">
                                <img src={task.slice(5)} alt="첨부 이미지" className="max-h-48 w-full object-contain" />
                              </div>
                            ) : (
                              <textarea
                                value={task}
                                onChange={(e) => {
                                  const newTasks = [...individualTasks];
                                  newTasks[idx] = e.target.value;
                                  setIndividualTasks(newTasks);
                                }}
                                placeholder={`개인별 수행 과제 #${idx + 1}`}
                                rows={3}
                                className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-3 text-sm transition-all placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none"
                              />
                            )}
                            <label
                              className={`absolute -right-2 top-8 cursor-pointer rounded-full border border-[#ddd9cc] bg-white p-1 transition-colors hover:border-[#FF6C0F] ${
                                uploadingTaskIndex?.type === 'individual' && uploadingTaskIndex?.idx === idx
                                  ? 'pointer-events-none opacity-50'
                                  : ''
                              }`}
                            >
                              <ImageIcon className="h-3.5 w-3.5 text-[#6b6b5e]" strokeWidth={2} />
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingTaskIndex({ type: 'individual', idx });
                                  try {
                                    const url = await uploadHomeworkImage(file);
                                    const newTasks = [...individualTasks];
                                    newTasks.splice(idx + 1, 0, `[img]${url}`);
                                    setIndividualTasks(newTasks);
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
                                  } finally {
                                    setUploadingTaskIndex(null);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                            {individualTasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setIndividualTasks(individualTasks.filter((_, i) => i !== idx))}
                                className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[#b42318] text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-[#f5f5ee] p-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#FF6C0F]">
                          <Users className="h-4 w-4" strokeWidth={2} /> 팀 과제 목록
                        </label>
                        <button
                          type="button"
                          onClick={() => setTeamTasks([...teamTasks, ""])}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16140f] text-white text-sm transition-colors hover:bg-[#16140f]/90"
                        >
                          +
                        </button>
                      </div>
                      <div className="space-y-3">
                        {teamTasks.map((task, idx) => (
                          <div key={idx} className="group relative">
                            {task.startsWith("[img]") ? (
                              <div className="overflow-hidden rounded-lg border border-[#ddd9cc] bg-white">
                                <img src={task.slice(5)} alt="첨부 이미지" className="max-h-48 w-full object-contain" />
                              </div>
                            ) : (
                              <textarea
                                value={task}
                                onChange={(e) => {
                                  const newTasks = [...teamTasks];
                                  newTasks[idx] = e.target.value;
                                  setTeamTasks(newTasks);
                                }}
                                placeholder={`팀 단위 협동 과제 #${idx + 1}`}
                                rows={3}
                                className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-3 text-sm transition-all placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none"
                              />
                            )}
                            <label
                              className={`absolute -right-2 top-8 cursor-pointer rounded-full border border-[#ddd9cc] bg-white p-1 transition-colors hover:border-[#FF6C0F] ${
                                uploadingTaskIndex?.type === 'team' && uploadingTaskIndex?.idx === idx
                                  ? 'pointer-events-none opacity-50'
                                  : ''
                              }`}
                            >
                              <ImageIcon className="h-3.5 w-3.5 text-[#6b6b5e]" strokeWidth={2} />
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingTaskIndex({ type: 'team', idx });
                                  try {
                                    const url = await uploadHomeworkImage(file);
                                    const newTasks = [...teamTasks];
                                    newTasks.splice(idx + 1, 0, `[img]${url}`);
                                    setTeamTasks(newTasks);
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
                                  } finally {
                                    setUploadingTaskIndex(null);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                            {teamTasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTeamTasks(teamTasks.filter((_, i) => i !== idx))}
                                className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[#b42318] text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className={`flex flex-col rounded-lg p-4 sm:p-6 lg:p-8 border-2 transition-all ${isTeam ? "bg-[#fcfcfb] border-[#ddd9cc]" : "bg-[#f5f5ee] border-transparent opacity-50 grayscale pointer-events-none"}`}>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-[#16140f] flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16140f] text-white text-sm">4</span>
                    Team Assignment
                  </h4>
                  <button
                    type="button"
                    onClick={addTeam}
                    className="flex items-center gap-1.5 rounded-md bg-[#FF6C0F] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#FF6C0F]/90"
                  >
                    <span>+</span> 새 팀 생성
                  </button>
                </div>
                <p className="text-xs font-medium text-[#6b6b5e]">생성된 팀에 멤버를 배정하거나 이름을 수정할 수 있습니다.</p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-visible">
                {teams.map((t, idx) => (
                  <div key={idx} className="group relative rounded-lg border border-[#ddd9cc] bg-white p-5 transition-colors hover:border-[#FF6C0F]">
                    <div className="flex items-center justify-between mb-4">
                      <input
                        type="text"
                        value={t.teamName}
                        onChange={(e) => {
                          const newTeams = [...teams];
                          newTeams[idx].teamName = e.target.value;
                          setTeams(newTeams);
                        }}
                        className="text-sm font-semibold text-[#FF6C0F] bg-transparent border-none p-0 focus:ring-0 w-2/3"
                      />
                      <button
                        type="button"
                        onClick={() => removeTeam(idx)}
                        className="rounded-lg bg-[#FEE2E2] p-1.5 text-[#b42318] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#b42318] hover:text-white"
                      >
                        <span className="text-[10px] font-semibold">삭제</span>
                      </button>
                    </div>

                    {/* Member Chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {t.memberIds.map(mId => {
                        const learner = availableLearners.find(r => r.id === mId);
                        return (
                          <div key={mId} className="flex items-center gap-2 rounded-lg bg-[#f5f5ee] px-3 py-1.5 text-[11px] font-semibold text-[#16140f] border border-[#ddd9cc]">
                            {learner?.name}
                            <button 
                              type="button" 
                              onClick={() => toggleMemberInTeam(idx, mId)}
                              className="text-[#6b6b5e] hover:text-[#b42318] transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      {t.memberIds.length === 0 && (
                        <p className="text-[11px] font-medium text-[#6b6b5e] italic bg-[#fcfcfb] border border-dashed border-[#ddd9cc] rounded-lg px-4 py-2 w-full text-center">배정된 팀원이 없습니다.</p>
                      )}
                    </div>

                    {/* Member Search - REDESIGNED to prevent clipping */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-semibold text-[#6b6b5e]">Add Member</label>
                       <div className="flex items-center gap-2">
                         <input
                          type="text"
                          placeholder="이름 검색..."
                          value={teamSearchQueries[idx] || ""}
                          onChange={(e) => {
                            const newQueries = [...teamSearchQueries];
                            newQueries[idx] = e.target.value;
                            setTeamSearchQueries(newQueries);
                          }}
                          className="flex-1 rounded-lg border border-[#f0efe6] bg-[#fcfcfb] px-3 py-2 text-xs focus:border-[#FF6C0F] focus:outline-none transition-all"
                        />
                       </div>
                       
                       {/* Result List - INTEGRATED (not absolute) to prevent clipping */}
                       {teamSearchQueries[idx] && (
                         <div className="mt-2 space-y-1 max-h-32 overflow-y-auto rounded-lg border border-dashed border-[#ddd9cc] bg-[#fcfcfb] p-2 animate-in fade-in duration-200">
                          {availableLearners
                            .filter(r => 
                              r.name.toLowerCase().includes(teamSearchQueries[idx].toLowerCase()) &&
                              !teams.some(team => team.memberIds.includes(r.id))
                            )
                            .map(learner => (
                              <button
                                key={learner.id}
                                type="button"
                                onClick={() => toggleMemberInTeam(idx, learner.id)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold hover:bg-[#FF6C0F] hover:text-white transition-all"
                              >
                                <span>{learner.name}</span>
                                <span className="text-[9px] opacity-70">{learner.role}</span>
                              </button>
                            ))}
                          {availableLearners.filter(r => 
                            r.name.toLowerCase().includes(teamSearchQueries[idx].toLowerCase()) &&
                            !teams.some(team => team.memberIds.includes(r.id))
                          ).length === 0 && (
                            <p className="py-2 text-center text-[10px] text-[#6b6b5e]">검색 결과가 없습니다.</p>
                          )}
                        </div>
                       )}
                    </div>
                  </div>
                ))}
                {teams.length === 0 && isTeam && (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-[#ddd9cc]">
                    <FolderOpen className="h-10 w-10 mb-4 text-[#6b6b5e]" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-[#6b6b5e]">배정할 팀을 만들어주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-8 border-t border-[#ece8db]">
            <button
              type="button"
              onClick={() => { setIsAdding(false); resetForm(); }}
              className="w-full sm:w-auto rounded-md px-4 py-2.5 font-['Pretendard',sans-serif] text-sm font-semibold text-[#6b6b5e] hover:bg-[#f5f5ee] transition-colors"
            >
              취소 (Cancel)
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto rounded-md bg-[#16140f] px-6 py-2.5 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#16140f]/80"
            >
              {isEditing ? "변경사항 저장" : "과제 생성 및 배포"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-6 mt-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6C0F] border-t-transparent" />
            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#6b6b5e]">Synchronizing...</p>
          </div>
        ) : homeworks.length === 0 ? (
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-16 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#e8e6dc]">
              <Package className="h-8 w-8 text-[#6b6b5e]" strokeWidth={1.5} />
            </div>
            <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">No Homework Found</h3>
            <p className="mt-2 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">관리 중인 과제가 없습니다. 새로운 과제를 생성해보세요.</p>
          </div>
        ) : (
          homeworks.map((hw: Homework) => (
            <div key={hw.id} className="group overflow-hidden rounded-lg border border-[#ddd9cc] bg-white transition-colors hover:border-[#FF6C0F]/50">
              <div className="flex flex-wrap items-center justify-between px-4 py-4 sm:px-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e8e6dc]">
                    <BookOpen className="h-5 w-5 text-[#4a4a40]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{hw.title}</h3>
                    <div className="flex gap-2 mt-1.5">
                      {hw.is_individual && (
                        <span className="inline-flex rounded-full bg-[#E8F0FE] px-2.5 py-0.5 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">
                          개인과제
                        </span>
                      )}
                      {hw.is_team && (
                        <span className="inline-flex rounded-full bg-[#FFF0E5] px-2.5 py-0.5 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">
                          팀과제
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      {new Date(hw.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                    </p>
                    <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">
                      {"마감: "}
                      {hw.due_date
                        ? new Date(hw.due_date).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                        : "없음"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(hw)}
                      disabled={isFormLoading}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      수정
                    </button>
                    <button
                      onClick={() => handleFetchTeams(hw.id)}
                      className={`inline-flex h-8 items-center rounded-md px-3 font-['Pretendard',sans-serif] text-xs font-semibold transition-colors ${
                        viewingId === hw.id 
                        ? "bg-[#16140f] text-white" 
                        : "border border-[#ddd9cc] text-[#16140f] hover:bg-[#fcfcf8]"
                      }`}
                    >
                      {viewingId === hw.id ? "닫기" : "열람하기"}
                    </button>
                    <button
                      onClick={() => handleDeleteHomework(hw.id)}
                      className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] underline-offset-2 hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Detail Area */}
              {viewingId === hw.id && (
                <div className="border-t border-[#ece8db] bg-[#fcfcf8] animate-in slide-in-from-top-6 duration-500">
                  <div className="flex items-center gap-1 px-4 pt-4 sm:px-6 border-b border-[#ece8db]">
                    <button
                      onClick={() => setActiveTab(prev => ({ ...prev, [hw.id]: 'content' }))}
                      className={`px-4 py-2 font-['Pretendard',sans-serif] text-xs font-semibold rounded-t-lg transition-all ${
                        (activeTab[hw.id] ?? 'content') === 'content'
                          ? 'bg-white border border-b-white border-[#ece8db] text-[#16140f] -mb-[1px]'
                          : 'text-[#6b6b5e] hover:text-[#16140f]'
                      }`}
                    >
                      <ClipboardList className="mr-1 inline h-3.5 w-3.5" strokeWidth={2} /> 과제 내용
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab(prev => ({ ...prev, [hw.id]: 'status' }));
                        fetchPadletSubmissions(hw);
                        // Auto-load team assignments if not loaded yet (without toggling the details panel)
                        if (hw.is_team && viewingTeams.length === 0) {
                          fetchTeamData(hw.id);
                        }
                      }}
                      className={`px-4 py-2 font-['Pretendard',sans-serif] text-xs font-semibold rounded-t-lg transition-all ${
                        activeTab[hw.id] === 'status'
                          ? 'bg-white border border-b-white border-[#ece8db] text-[#FF6C0F] -mb-[1px]'
                          : 'text-[#6b6b5e] hover:text-[#FF6C0F]'
                      }`}
                    >
                      <BarChart3 className="mr-1 inline h-3.5 w-3.5" strokeWidth={2} /> 제출 현황
                      {!hw.padlet_board_id && <span className="ml-1 text-[9px] text-[#b42318]">(Board ID 없음)</span>}
                    </button>
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* Tab: 과제 내용 */}
                    {(activeTab[hw.id] ?? 'content') === 'content' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
                          {hw.is_individual && hw.individual_content && (
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2.5 text-sm font-semibold text-[#2563EB]">
                                <span className="h-2 w-2 rounded-full bg-[#16140f]" /> 개인 과제 목록
                              </h4>
                              <div className="space-y-4">
                                {(Array.isArray(hw.individual_content) ? hw.individual_content : [hw.individual_content]).map(
                                  (task: string, tIdx: number) => renderTaskItem(task, tIdx, "text-[#2563EB]"),
                                )}
                              </div>
                            </div>
                          )}
                          {hw.is_team && hw.team_content && (
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2.5 text-sm font-semibold text-[#FF6C0F]">
                                <span className="h-2 w-2 rounded-full bg-[#16140f]" /> 팀 협동 과제 목록
                              </h4>
                              <div className="space-y-4">
                                {(Array.isArray(hw.team_content) ? hw.team_content : [hw.team_content]).map(
                                  (task: string, tIdx: number) => renderTaskItem(task, tIdx, "text-[#FF6C0F]"),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {hw.is_team && viewingTeams.length > 0 && (
                          <div className="lg:col-span-12 xl:col-span-4 mt-4 xl:mt-0">
                            <div className="sticky top-10 space-y-6">
                              <h4 className="flex items-center gap-2.5 text-sm font-semibold text-[#FF6C0F]">
                                <span className="h-2 w-2 rounded-full bg-[#FF6C0F]" /> 팀 빌딩 현황
                              </h4>
                              <div className="space-y-5 rounded-lg bg-white p-5 border border-[#ddd9cc]">
                                {Array.from(new Set(viewingTeams.map(vt => vt.team_name))).map(teamName => (
                                  <div key={teamName} className="group/item">
                                    <p className="text-sm font-semibold text-[#FF6C0F] mb-3 flex items-center justify-between">
                                      {teamName}
                                      <span className="text-[10px] font-semibold text-[#6b6b5e] bg-[#f5f5ee] px-2 py-0.5 rounded-lg">
                                        {viewingTeams.filter(vt => vt.team_name === teamName).length} 명
                                      </span>
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {viewingTeams.filter(vt => vt.team_name === teamName).map((member) => {
                                        const learner = availableLearners.find(r => r.id === member.user_id);
                                        return (
                                          <span key={member.user_id} className="inline-flex items-center rounded-lg bg-[#f5f5ee] px-3 py-1.5 text-[11px] font-semibold text-[#16140f] border border-transparent transition-all group-hover/item:border-[#FF6C0F] group-hover/item:bg-white">
                                            {learner?.name || 'Unknown'}
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
                          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-[#ddd9cc]">
                            <AlertCircle className="h-10 w-10 mb-4 text-[#6b6b5e]" strokeWidth={1.5} />
                            <p className="text-sm font-semibold text-[#6b6b5e]">Padlet Board ID가 설정되지 않았습니다.</p>
                          </div>
                        );
                      }
                      if (pData?.loading) return <div className="text-center py-20 text-xs font-semibold text-[#6b6b5e] animate-pulse">PADLET 부르는 중...</div>;
                      if (pData?.error) return <div className="text-center py-20 text-[#b42318] text-xs font-semibold">{pData.error}</div>;

                      const rows = buildSubmissionRows(hw);

                      // Team homework but no team data loaded
                      if (hw.is_team && viewingTeams.length === 0 && rows.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-[#ddd9cc]">
                            <Users className="h-10 w-10 mb-4 text-[#6b6b5e]" strokeWidth={1.5} />
                            <p className="text-sm font-semibold text-[#6b6b5e]">팀 배정 정보가 없습니다.</p>
                            <p className="text-xs text-[#6b6b5e] mt-1">과제를 생성할 때 팀을 배정했는지 확인하세요.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[480px]">
                              <thead className="bg-[#f0efe6] text-left">
                                <tr>
                                  <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold w-1/4">대상</th>
                                  {pData.sections.length > 0 ? pData.sections.map(s => (
                                    <th key={s.id} className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-center">
                                      {s.title}
                                    </th>
                                  )) : (
                                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-center">전체</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="border-t border-[#ece8db] hover:bg-[#fcfcf8] transition-colors">
                                    <td className="px-4 py-3">
                                      <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{row.label}</p>
                                      {row.teamLabel && (
                                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#FF6C0F] bg-[#FFF0E5] px-2 py-0.5 rounded-lg">
                                          {row.teamLabel}
                                        </span>
                                      )}
                                    </td>
                                    {Object.keys(row.sectionStatus).map(sId => (
                                      <td key={sId} className="px-4 py-3 text-center">
                                        {row.sectionStatus[sId] ? (
                                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F9E6] text-[#2f9e44] ring-2 ring-[#2f9e44]/20"><Check className="h-4 w-4" strokeWidth={3} /></span>
                                        ) : (
                                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE2E2] text-[#b42318]/40 ring-1 ring-[#b42318]/10 opacity-40"><X className="h-4 w-4" strokeWidth={3} /></span>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="md:hidden space-y-3">
                            {rows.map((row, rIdx) => (
                              <div key={rIdx} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc]">
                                    <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                                      {row.label.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{row.label}</p>
                                    {row.teamLabel && (
                                      <span className="inline-block mt-0.5 rounded-full bg-[#FFF0E5] px-2 py-0.5 font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#FF6C0F]">
                                        {row.teamLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {(pData.sections.length > 0 ? pData.sections : [{ id: '__none__', title: '전체' }]).map(s => {
                                    const submitted = row.sectionStatus[s.id] ?? false;
                                    return (
                                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-[#f5f5ee] px-3 py-2">
                                        <span className="font-['Pretendard',sans-serif] text-xs text-[#4a4a40]">{s.title}</span>
                                        {submitted ? (
                                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E6F9E6] text-[#2f9e44]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                                        ) : (
                                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FEE2E2] text-[#b42318]/40 opacity-40"><X className="h-3.5 w-3.5" strokeWidth={3} /></span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
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
