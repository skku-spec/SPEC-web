"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertHomework, replaceHomeworkTeams, getHomeworkSectionSubmissions, upsertHomeworkSectionSubmission, bulkUpsertHomeworkSectionSubmissions } from "@/lib/actions/tracker";
import { uploadHomeworkFile, uploadHomeworkImage } from "@/lib/storage";
import { formatKoreanDate } from "@/lib/utils/koreanDate";
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
  Paperclip,
  ExternalLink,
} from "lucide-react";

type SectionConfig = { type: "individual" } | { type: "team"; task_index: number };

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
  section_type_config?: Record<string, SectionConfig>;
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
  userId: string;
  isTeam: boolean;
  memberNames: string[];
  sectionStatus: Record<string, boolean>; // sectionId -> submitted
  relevantSectionIds: string[]; // sections that count toward this learner's completion
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
  taskIndex: number;
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
  // key: `${taskIndex}-${teamArrayIndex}` → search query
  const [teamSearchQueries, setTeamSearchQueries] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [uploadingTaskIndex, setUploadingTaskIndex] = useState<{ type: 'individual' | 'team'; idx: number } | null>(null);

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [teamsByHomework, setTeamsByHomework] = useState<Record<string, { team_name: string; user_id: string; task_index: number }[]>>({});
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
    // Only include profiles that still have an active entry in the members table
    const { data: activeMembers } = await supabase
      .from("members")
      .select("public_profile_id")
      .not("public_profile_id", "is", null);

    const activeProfileIds = (activeMembers ?? [])
      .map((m) => m.public_profile_id as string)
      .filter(Boolean);

    if (activeProfileIds.length === 0) {
      setAvailableLearners([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,username,slug,role")
      .eq("role", "learner")
      .in("id", activeProfileIds);

    if (!error && data) {
      setAvailableLearners((data as Profile[]).sort((a, b) => a.name.localeCompare(b.name, "ko")));
    }
  }, []);

  useEffect(() => {
    fetchHomeworks();
    fetchLearners();
  }, [fetchHomeworks, fetchLearners]);

  const [isSyncing, setIsSyncing] = useState(false);
  // key: `${hwId}:${userId}:${sectionId}` → manual override value
  const [cellOverrides, setCellOverrides] = useState<Record<string, boolean>>({});
  const [togglingCell, setTogglingCell] = useState<string | null>(null);

  // Padlet 로드 완료 시 항목별 제출 현황을 homework_section_submissions에 저장
  useEffect(() => {
    const syncPadletToItems = async () => {
      setIsSyncing(true);
      try {
        for (const hwId of Object.keys(padletData)) {
          const pData = padletData[hwId];
          if (!pData || pData.loading || pData.error) continue;

          const hw = homeworks.find(h => h.id === hwId);
          if (!hw || !hw.padlet_board_id) continue;

          const hwTeams = teamsByHomework[hwId] ?? [];
          const rows = buildSubmissionRows(hw, hwTeams);

          type SectionRecord = { homework_id: string; user_id: string; section_id: string; is_completed: boolean };
          const records: SectionRecord[] = [];

          for (const row of rows) {
            for (const sId of row.relevantSectionIds) {
              if (sId === '__none__') continue;
              const cellKey = `${hwId}:${row.userId}:${sId}`;
              if (cellOverrides[cellKey] !== undefined) continue; // 수동 override 있으면 건너뜀
              records.push({
                homework_id: hwId,
                user_id: row.userId,
                section_id: sId,
                is_completed: row.sectionStatus[sId] ?? false,
              });
            }
          }

          if (records.length > 0) {
            await bulkUpsertHomeworkSectionSubmissions(records);
          }
        }
      } finally {
        setIsSyncing(false);
      }
    };

    if (Object.keys(padletData).length > 0) {
      syncPadletToItems();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [padletData, homeworks, teamsByHomework, cellOverrides]);

  const loadTeamData = async (homeworkId: string) => {
    const { data, error } = await supabase
      .from("homework_team_assignments")
      .select("team_name,user_id,task_index")
      .eq("homework_id", homeworkId);
    setTeamsByHomework(prev => ({
      ...prev,
      [homeworkId]: (!error && data) ? data as { team_name: string; user_id: string; task_index: number }[] : [],
    }));
  };

  const handleFetchTeams = async (homeworkId: string) => {
    if (viewingId === homeworkId) {
      setViewingId(null);
      return;
    }
    setViewingId(homeworkId);
    await loadTeamData(homeworkId);
  };

  // Silently fetch team data for a homework without toggling viewingId (used by status tab)
  const fetchTeamData = async (homeworkId: string) => {
    if (teamsByHomework[homeworkId] !== undefined) return;
    await loadTeamData(homeworkId);
  };

  const getSectionConfig = (hw: Homework, sectionId: string): SectionConfig => {
    const config = hw.section_type_config ?? {};
    if (config[sectionId]) return config[sectionId];
    if (hw.is_team) return { type: "team", task_index: 0 };
    return { type: "individual" };
  };

  const getSectionType = (hw: Homework, sectionId: string): "individual" | "team" => {
    return getSectionConfig(hw, sectionId).type;
  };

  const handleSectionTypeToggle = async (hw: Homework, sectionId: string) => {
    const current = getSectionConfig(hw, sectionId);
    let next: SectionConfig;
    if (current.type === "individual") {
      next = { type: "team", task_index: 0 };
    } else {
      const nextIdx = current.task_index + 1;
      next = nextIdx < hw.team_content.length
        ? { type: "team", task_index: nextIdx }
        : { type: "individual" };
    }
    const newConfig: Record<string, SectionConfig> = { ...(hw.section_type_config ?? {}), [sectionId]: next };
    setHomeworks(prev => prev.map(h => h.id === hw.id ? { ...h, section_type_config: newConfig } : h));
    await upsertHomework({
      id: hw.id,
      title: hw.title,
      submission_link: hw.submission_link ?? null,
      padlet_board_id: hw.padlet_board_id ?? null,
      individual_content: hw.individual_content,
      team_content: hw.team_content,
      is_individual: hw.is_individual,
      is_team: hw.is_team,
      due_date: hw.due_date ?? null,
      section_type_config: newConfig,
    });
  };

  const copyTeamsFromPrevTask = (taskIndex: number) => {
    if (taskIndex === 0) return;
    const prevTeams = teams.filter(t => t.taskIndex === taskIndex - 1);
    const alreadyHasTeams = teams.some(t => t.taskIndex === taskIndex);
    if (alreadyHasTeams) {
      if (!confirm(`과제 #${taskIndex + 1}의 기존 팀 배정을 삭제하고 이전 과제의 팀을 복사할까요?`)) return;
      setTeams([...teams.filter(t => t.taskIndex !== taskIndex), ...prevTeams.map(t => ({ ...t, taskIndex }))]);
    } else {
      setTeams([...teams, ...prevTeams.map(t => ({ ...t, taskIndex }))]);
    }
  };

  const handleSubmitHomework = async (e: { preventDefault: () => void }) => {
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
      } else {
        const freshTeams = teams.flatMap(t =>
          t.memberIds.map(uid => ({ team_name: t.teamName, user_id: uid, task_index: t.taskIndex }))
        );
        setTeamsByHomework(prev => ({ ...prev, [hwId]: freshTeams }));
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
    setTeamSearchQueries({});
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
        .select("team_name,user_id,task_index")
        .eq("homework_id", hw.id);

      if (data && data.length > 0) {
        // Group by (task_index, team_name)
        const teamMap = new Map<string, { taskIndex: number; memberIds: string[] }>();
        (data as { team_name: string; user_id: string; task_index: number }[]).forEach(row => {
          const key = `${row.task_index}::${row.team_name}`;
          if (!teamMap.has(key)) teamMap.set(key, { taskIndex: row.task_index, memberIds: [] });
          teamMap.get(key)!.memberIds.push(row.user_id);
        });
        const rebuilt = Array.from(teamMap.entries()).map(([key, val]) => ({
          teamName: key.split("::").slice(1).join("::"),
          memberIds: val.memberIds,
          taskIndex: val.taskIndex,
        }));
        setTeams(rebuilt);
        setTeamSearchQueries({});
      } else {
        setTeams([]);
        setTeamSearchQueries({});
      }
    } else {
      setTeams([]);
      setTeamSearchQueries({});
    }

    setIsAdding(true);
    setIsFormLoading(false);
  };

  const addTeam = (taskIndex: number) => {
    const teamsForTask = teams.filter(t => t.taskIndex === taskIndex);
    setTeams([...teams, { teamName: `Team ${teamsForTask.length + 1}`, memberIds: [], taskIndex }]);
  };

  const removeTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index));
  };

  const toggleMemberInTeam = (teamArrayIndex: number, userId: string) => {
    const newTeams = [...teams];
    const memberIds = newTeams[teamArrayIndex].memberIds;
    if (memberIds.includes(userId)) {
      newTeams[teamArrayIndex].memberIds = memberIds.filter(id => id !== userId);
    } else {
      newTeams[teamArrayIndex].memberIds = [...memberIds, userId];
    }
    setTeams(newTeams);
    const key = `${newTeams[teamArrayIndex].taskIndex}-${teamArrayIndex}`;
    setTeamSearchQueries(prev => ({ ...prev, [key]: "" }));
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("homeworks").delete().eq("id", id);
    if (!error) {
      setHomeworks(homeworks.filter((hw) => hw.id !== id));
    }
  };

  const loadSectionSubmissions = async (hwId: string) => {
    const result = await getHomeworkSectionSubmissions(hwId);
    if (!result.success || result.data.length === 0) return;

    const overrides: Record<string, boolean> = {};
    result.data.forEach(row => {
      if (row.is_override) {
        overrides[`${hwId}:${row.user_id}:${row.section_id}`] = row.is_completed;
      }
    });
    setCellOverrides(prev => ({ ...prev, ...overrides }));
  };

  const fetchPadletSubmissions = async (hw: Homework) => {
    const hwId = hw.id;
    await loadSectionSubmissions(hwId);

    if (!hw.padlet_board_id) return;

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


  const getEffectiveStatus = (hwId: string, userId: string, sectionId: string, padletStatus: boolean): boolean => {
    const key = `${hwId}:${userId}:${sectionId}`;
    return cellOverrides[key] !== undefined ? cellOverrides[key] : padletStatus;
  };

  const handleCellToggle = async (
    hwId: string,
    userId: string,
    sectionId: string,
    padletStatus: boolean = false,
  ) => {
    const key = `${hwId}:${userId}:${sectionId}`;
    const current = cellOverrides[key] !== undefined ? cellOverrides[key] : padletStatus;
    const next = !current;

    setCellOverrides(prev => ({ ...prev, [key]: next }));
    setTogglingCell(key);

    await upsertHomeworkSectionSubmission(hwId, userId, sectionId, next);

    setTogglingCell(null);
  };

  const buildSubmissionRows = (hw: Homework, hwTeams: { team_name: string; user_id: string; task_index: number }[]): SubmissionRow[] => {
    const pData = padletData[hw.id];
    if (!pData) return [];
    const { sections, posts } = pData;

    // Build a map: `${userId}:${taskIndex}` -> { teamName, memberNames, memberUsernames }
    // so we can check team membership per section (each section may map to a different task_index)
    const learnerTeamMap = new Map<string, { teamName: string; memberNames: string[]; memberUsernames: string[] }>();
    if (hw.is_team && hwTeams.length > 0) {
      const learnerLookup = new Map(availableLearners.map(r => [r.id, r]));
      hwTeams.forEach(vt => {
        const teamMembers = hwTeams.filter(m => m.team_name === vt.team_name && m.task_index === vt.task_index);
        const memberNames = teamMembers.map(m => learnerLookup.get(m.user_id)?.name || 'Unknown');
        const memberUsernames = teamMembers.map(m => learnerLookup.get(m.user_id)?.username || '');
        learnerTeamMap.set(`${vt.user_id}:${vt.task_index}`, { teamName: vt.team_name, memberNames, memberUsernames });
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
      const relevantSectionIds: string[] = [];

      sections.forEach(s => {
        const sConfig = getSectionConfig(hw, s.id);
        if (sConfig.type === "team") {
          // For team sections, look up team by (userId, task_index)
          const teamInfo = learnerTeamMap.get(`${learner.id}:${sConfig.task_index}`);
          if (teamInfo) {
            // Learner is assigned to this team slot — relevant
            relevantSectionIds.push(s.id);
            sectionStatus[s.id] = anyPostedInSection(teamInfo.memberNames, teamInfo.memberUsernames, s.id);
          } else {
            // Learner has no team assignment for this slot — not their responsibility
            sectionStatus[s.id] = anyPostedInSection([learner.name], [learner.username], s.id);
          }
        } else {
          relevantSectionIds.push(s.id);
          sectionStatus[s.id] = anyPostedInSection([learner.name], [learner.username], s.id);
        }
      });

      if (sections.length === 0) {
        sectionStatus['__none__'] = anyPostedInSection([learner.name], [learner.username], undefined);
        relevantSectionIds.push('__none__');
      }

      // For the teamLabel, use task_index 0 by default (first team task)
      const defaultTeamInfo = learnerTeamMap.get(`${learner.id}:0`);
      const teamLabel = defaultTeamInfo ? `(${defaultTeamInfo.teamName})` : '';
      rows.push({
        label: learner.name,
        userId: learner.id,
        isTeam: !!defaultTeamInfo,
        memberNames: defaultTeamInfo?.memberNames ?? [learner.name],
        sectionStatus,
        relevantSectionIds,
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

    if (task.startsWith("[file]")) {
      const payload = task.slice(6);
      const separatorIndex = payload.indexOf("|");
      const encodedName = separatorIndex >= 0 ? payload.slice(0, separatorIndex) : "";
      const url = separatorIndex >= 0 ? payload.slice(separatorIndex + 1) : "";
      const fileName = encodedName
        ? (() => {
            try {
              return decodeURIComponent(encodedName);
            } catch {
              return encodedName;
            }
          })()
        : "첨부파일";

      return (
        <div key={tIdx} className="rounded-lg border border-[#ece8db] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`font-semibold ${accentColor}`}>#{tIdx + 1}</span>
              <Paperclip className="h-4 w-4 shrink-0 text-[#6b6b5e]" strokeWidth={2} />
              <span className="truncate font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{fileName}</span>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
              열기
            </a>
          </div>
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
          <div className="space-y-6 sm:space-y-8">
            {/* Basic Info & Mode Selection */}
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
                            ) : task.startsWith("[file]") ? (
                              <div className="rounded-lg border border-[#ddd9cc] bg-white p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Paperclip className="h-4 w-4 shrink-0 text-[#6b6b5e]" strokeWidth={2} />
                                    <span className="truncate font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                                      {(() => {
                                        const payload = task.slice(6);
                                        const separatorIndex = payload.indexOf("|");
                                        const encodedName = separatorIndex >= 0 ? payload.slice(0, separatorIndex) : payload;
                                        try {
                                          return decodeURIComponent(encodedName);
                                        } catch {
                                          return encodedName;
                                        }
                                      })()}
                                    </span>
                                  </div>
                                  <a
                                    href={(() => {
                                      const payload = task.slice(6);
                                      const separatorIndex = payload.indexOf("|");
                                      return separatorIndex >= 0 ? payload.slice(separatorIndex + 1) : "#";
                                    })()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-[#ddd9cc] px-2.5 font-['Pretendard',sans-serif] text-[11px] font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
                                  >
                                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                                    열기
                                  </a>
                                </div>
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
                            <label
                              className={`absolute -right-2 top-16 cursor-pointer rounded-full border border-[#ddd9cc] bg-white p-1 transition-colors hover:border-[#FF6C0F] ${
                                uploadingTaskIndex?.type === 'individual' && uploadingTaskIndex?.idx === idx
                                  ? 'pointer-events-none opacity-50'
                                  : ''
                              }`}
                            >
                              <Paperclip className="h-3.5 w-3.5 text-[#6b6b5e]" strokeWidth={2} />
                              <input
                                type="file"
                                accept=".pdf,.zip,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,application/pdf,application/zip,application/x-zip-compressed,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/x-hwp,application/haansofthwp"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingTaskIndex({ type: 'individual', idx });
                                  try {
                                    const uploaded = await uploadHomeworkFile(file);
                                    const marker = `[file]${encodeURIComponent(uploaded.name)}|${uploaded.url}`;
                                    const newTasks = [...individualTasks];
                                    newTasks.splice(idx + 1, 0, marker);
                                    setIndividualTasks(newTasks);
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : "파일 업로드에 실패했습니다.");
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
                      <div className="space-y-6">
                        {teamTasks.map((task, idx) => (
                          <div key={idx} className="space-y-3">
                          <div className="group relative">
                            {task.startsWith("[img]") ? (
                              <div className="overflow-hidden rounded-lg border border-[#ddd9cc] bg-white">
                                <img src={task.slice(5)} alt="첨부 이미지" className="max-h-48 w-full object-contain" />
                              </div>
                            ) : task.startsWith("[file]") ? (
                              <div className="rounded-lg border border-[#ddd9cc] bg-white p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Paperclip className="h-4 w-4 shrink-0 text-[#6b6b5e]" strokeWidth={2} />
                                    <span className="truncate font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                                      {(() => {
                                        const payload = task.slice(6);
                                        const separatorIndex = payload.indexOf("|");
                                        const encodedName = separatorIndex >= 0 ? payload.slice(0, separatorIndex) : payload;
                                        try {
                                          return decodeURIComponent(encodedName);
                                        } catch {
                                          return encodedName;
                                        }
                                      })()}
                                    </span>
                                  </div>
                                  <a
                                    href={(() => {
                                      const payload = task.slice(6);
                                      const separatorIndex = payload.indexOf("|");
                                      return separatorIndex >= 0 ? payload.slice(separatorIndex + 1) : "#";
                                    })()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-[#ddd9cc] px-2.5 font-['Pretendard',sans-serif] text-[11px] font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
                                  >
                                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                                    열기
                                  </a>
                                </div>
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
                            <label
                              className={`absolute -right-2 top-16 cursor-pointer rounded-full border border-[#ddd9cc] bg-white p-1 transition-colors hover:border-[#FF6C0F] ${
                                uploadingTaskIndex?.type === 'team' && uploadingTaskIndex?.idx === idx
                                  ? 'pointer-events-none opacity-50'
                                  : ''
                              }`}
                            >
                              <Paperclip className="h-3.5 w-3.5 text-[#6b6b5e]" strokeWidth={2} />
                              <input
                                type="file"
                                accept=".pdf,.zip,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,application/pdf,application/zip,application/x-zip-compressed,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/x-hwp,application/haansofthwp"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingTaskIndex({ type: 'team', idx });
                                  try {
                                    const uploaded = await uploadHomeworkFile(file);
                                    const marker = `[file]${encodeURIComponent(uploaded.name)}|${uploaded.url}`;
                                    const newTasks = [...teamTasks];
                                    newTasks.splice(idx + 1, 0, marker);
                                    setTeamTasks(newTasks);
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : "파일 업로드에 실패했습니다.");
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
                          {/* Inline Team Builder for this task */}
                          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold text-[#FF6C0F]">과제 #{idx + 1} 팀 배정</p>
                              <div className="flex gap-2">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => copyTeamsFromPrevTask(idx)}
                                    className="text-[10px] font-semibold text-[#6b6b5e] border border-[#ddd9cc] rounded-md px-2 py-1 hover:bg-[#f5f5ee] transition-colors"
                                  >
                                    이전 과제에서 복사 ↓
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => addTeam(idx)}
                                  className="text-[10px] font-semibold text-white bg-[#FF6C0F] rounded-md px-2 py-1 hover:bg-[#FF6C0F]/90 transition-colors"
                                >
                                  + 새 팀
                                </button>
                              </div>
                            </div>
                            {teams.filter(t => t.taskIndex === idx).length === 0 ? (
                              <p className="text-[11px] text-[#6b6b5e] italic text-center py-3 border border-dashed border-[#ddd9cc] rounded-lg">팀이 없습니다. &quot;+ 새 팀&quot;을 눌러 추가하세요.</p>
                            ) : (
                              <div className="space-y-3">
                                {teams.map((t, teamArrayIdx) => {
                                  if (t.taskIndex !== idx) return null;
                                  const searchKey = `${idx}-${teamArrayIdx}`;
                                  return (
                                    <div key={teamArrayIdx} className="group/team rounded-lg border border-[#ece8db] bg-[#fcfcfb] p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <input
                                          type="text"
                                          value={t.teamName}
                                          onChange={(e) => {
                                            const newTeams = [...teams];
                                            newTeams[teamArrayIdx].teamName = e.target.value;
                                            setTeams(newTeams);
                                          }}
                                          className="text-xs font-semibold text-[#FF6C0F] bg-transparent border-none p-0 focus:ring-0 w-2/3"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeTeam(teamArrayIdx)}
                                          className="text-[10px] font-semibold text-[#b42318] opacity-0 group-hover/team:opacity-100 transition-opacity"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {t.memberIds.map(mId => {
                                          const learner = availableLearners.find(r => r.id === mId);
                                          return (
                                            <div key={mId} className="flex items-center gap-1 rounded-md bg-[#f5f5ee] px-2 py-1 text-[10px] font-semibold text-[#16140f] border border-[#ddd9cc]">
                                              {learner?.name}
                                              <button type="button" onClick={() => toggleMemberInTeam(teamArrayIdx, mId)} className="text-[#6b6b5e] hover:text-[#b42318]">×</button>
                                            </div>
                                          );
                                        })}
                                        {t.memberIds.length === 0 && (
                                          <p className="text-[10px] text-[#6b6b5e] italic">팀원 없음</p>
                                        )}
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="이름 검색..."
                                        value={teamSearchQueries[searchKey] || ""}
                                        onChange={(e) => setTeamSearchQueries(prev => ({ ...prev, [searchKey]: e.target.value }))}
                                        className="w-full rounded-md border border-[#f0efe6] bg-white px-2 py-1.5 text-xs focus:border-[#FF6C0F] focus:outline-none transition-all"
                                      />
                                      {teamSearchQueries[searchKey] && (
                                        <div className="space-y-1 max-h-28 overflow-y-auto rounded-md border border-dashed border-[#ddd9cc] bg-white p-1.5">
                                          {availableLearners
                                            .filter(r =>
                                              r.name.toLowerCase().includes((teamSearchQueries[searchKey] || "").toLowerCase()) &&
                                              !teams.filter(tt => tt.taskIndex === idx).some(tt => tt.memberIds.includes(r.id))
                                            )
                                            .map(learner => (
                                              <button
                                                key={learner.id}
                                                type="button"
                                                onClick={() => toggleMemberInTeam(teamArrayIdx, learner.id)}
                                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[10px] font-semibold hover:bg-[#FF6C0F] hover:text-white transition-all"
                                              >
                                                <span>{learner.name}</span>
                                                <span className="text-[9px] opacity-70">{learner.role}</span>
                                              </button>
                                            ))}
                                          {availableLearners.filter(r =>
                                            r.name.toLowerCase().includes((teamSearchQueries[searchKey] || "").toLowerCase()) &&
                                            !teams.filter(tt => tt.taskIndex === idx).some(tt => tt.memberIds.includes(r.id))
                                          ).length === 0 && (
                                            <p className="py-1 text-center text-[10px] text-[#6b6b5e]">검색 결과가 없습니다.</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
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
                      {formatKoreanDate(hw.created_at, { year: "2-digit", month: "2-digit", day: "2-digit" })}
                    </p>
                    <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">
                      {"마감: "}
                      {hw.due_date
                        ? formatKoreanDate(hw.due_date, { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
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
                        if (hw.is_team) {
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
                        {hw.is_team && (teamsByHomework[hw.id] ?? []).length > 0 && (
                          <div className="lg:col-span-12 xl:col-span-4 mt-4 xl:mt-0">
                            <div className="sticky top-10 space-y-6">
                              <h4 className="flex items-center gap-2.5 text-sm font-semibold text-[#FF6C0F]">
                                <span className="h-2 w-2 rounded-full bg-[#FF6C0F]" /> 팀 빌딩 현황
                              </h4>
                              {Array.from(new Set((teamsByHomework[hw.id] ?? []).map(vt => vt.task_index))).sort().map(taskIdx => (
                                <div key={taskIdx} className="space-y-3">
                                  {hw.team_content.length > 1 && (
                                    <p className="text-[11px] font-semibold text-[#6b6b5e] uppercase tracking-wide">팀 과제 #{taskIdx + 1}</p>
                                  )}
                                  <div className="space-y-4 rounded-lg bg-white p-5 border border-[#ddd9cc]">
                                    {Array.from(new Set((teamsByHomework[hw.id] ?? []).filter(vt => vt.task_index === taskIdx).map(vt => vt.team_name))).map(teamName => {
                                      const hwTeamsForTask = (teamsByHomework[hw.id] ?? []).filter(vt => vt.task_index === taskIdx && vt.team_name === teamName);
                                      return (
                                        <div key={teamName} className="group/item">
                                          <p className="text-sm font-semibold text-[#FF6C0F] mb-3 flex items-center justify-between">
                                            {teamName}
                                            <span className="text-[10px] font-semibold text-[#6b6b5e] bg-[#f5f5ee] px-2 py-0.5 rounded-lg">
                                              {hwTeamsForTask.length} 명
                                            </span>
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {hwTeamsForTask.map((member) => {
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
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: 제출 현황 */}
                    {activeTab[hw.id] === 'status' && (() => {
                      const pData = padletData[hw.id];
                      const hasPadlet = !!hw.padlet_board_id;

                      // Manual-only mode (no Padlet board ID)
                      if (!hasPadlet) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 rounded-lg border border-[#ddd9cc] bg-[#fff8f0] px-4 py-3">
                              <AlertCircle className="h-4 w-4 shrink-0 text-[#FF6C0F]" strokeWidth={2} />
                              <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                                Padlet Board ID 없음 — 버튼을 클릭해 수동으로 완료 여부를 체크하세요.
                              </p>
                            </div>
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-[#f0efe6]">
                                  <tr>
                                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">대상</th>
                                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-center">완료 여부</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {availableLearners.map(learner => {
                                    const cellKey = `${hw.id}:${learner.id}:__none__`;
                                    const isCompleted = cellOverrides[cellKey] ?? false;
                                    const isToggling = togglingCell === cellKey;
                                    return (
                                      <tr key={learner.id} className="border-t border-[#ece8db] hover:bg-[#fcfcf8] transition-colors">
                                        <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            onClick={() => handleCellToggle(hw.id, learner.id, '__none__')}
                                            disabled={isToggling}
                                            title={isCompleted ? "완료 취소" : "완료로 표시"}
                                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-50 ${
                                              isCompleted
                                                ? "bg-[#E6F9E6] text-[#2f9e44] ring-2 ring-[#2f9e44]/20 hover:bg-[#FEE2E2] hover:text-[#b42318] hover:ring-[#b42318]/20"
                                                : "bg-[#FEE2E2] text-[#b42318]/40 ring-1 ring-[#b42318]/10 hover:bg-[#E6F9E6] hover:text-[#2f9e44] hover:ring-2 hover:ring-[#2f9e44]/20 opacity-50 hover:opacity-100"
                                            }`}
                                          >
                                            {isToggling
                                              ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                              : isCompleted
                                                ? <Check className="h-4 w-4" strokeWidth={3} />
                                                : <X className="h-4 w-4" strokeWidth={3} />
                                            }
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="md:hidden space-y-3">
                              {availableLearners.map(learner => {
                                const cellKey = `${hw.id}:${learner.id}:__none__`;
                                const isCompleted = cellOverrides[cellKey] ?? false;
                                const isToggling = togglingCell === cellKey;
                                return (
                                  <div key={learner.id} className="flex items-center justify-between rounded-lg border border-[#ddd9cc] bg-white px-4 py-3">
                                    <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</p>
                                    <button
                                      onClick={() => handleCellToggle(hw.id, learner.id, '__none__')}
                                      disabled={isToggling}
                                      title={isCompleted ? "완료 취소" : "완료로 표시"}
                                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-50 ${
                                        isCompleted
                                          ? "bg-[#E6F9E6] text-[#2f9e44] ring-2 ring-[#2f9e44]/20 hover:bg-[#FEE2E2] hover:text-[#b42318] hover:ring-[#b42318]/20"
                                          : "bg-[#FEE2E2] text-[#b42318]/40 ring-1 ring-[#b42318]/10 hover:bg-[#E6F9E6] hover:text-[#2f9e44] hover:ring-2 hover:ring-[#2f9e44]/20 opacity-50 hover:opacity-100"
                                      }`}
                                    >
                                      {isToggling
                                        ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        : isCompleted
                                          ? <Check className="h-4 w-4" strokeWidth={3} />
                                          : <X className="h-4 w-4" strokeWidth={3} />
                                      }
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (!pData || pData.loading) return <div className="text-center py-20 text-xs font-semibold text-[#6b6b5e] animate-pulse">PADLET 부르는 중...</div>;
                      if (pData.error) return <div className="text-center py-20 text-[#b42318] text-xs font-semibold">{pData.error}</div>;

                      const hwTeams = teamsByHomework[hw.id] ?? [];
                      const rows = buildSubmissionRows(hw, hwTeams);

                      // Team homework but no team data loaded
                      if (hw.is_team && hwTeams.length === 0 && rows.length === 0) {
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
                                  {pData.sections.length > 0 ? pData.sections.map(s => {
                                    const sConfig = getSectionConfig(hw, s.id);
                                    const badgeLabel = sConfig.type === "individual"
                                      ? "👤 개인"
                                      : `👥 팀 #${sConfig.task_index + 1}`;
                                    return (
                                      <th key={s.id} className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-center">
                                        <div className="flex flex-col items-center gap-1">
                                          <span>{s.title}</span>
                                          {((hw.is_individual && hw.is_team) || (hw.is_team && hw.team_content.length > 1)) && (
                                            <button
                                              type="button"
                                              onClick={() => handleSectionTypeToggle(hw, s.id)}
                                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer bg-[#e8e6dc] hover:bg-[#FF6C0F] hover:text-white"
                                              title="클릭하여 개인/팀 과제 전환"
                                            >
                                              {badgeLabel}
                                            </button>
                                          )}
                                        </div>
                                      </th>
                                    );
                                  }) : (
                                    <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-center">전체</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, rIdx) => {
                                  return (
                                    <tr key={rIdx} className="border-t border-[#ece8db] hover:bg-[#fcfcf8] transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{row.label}</p>
                                        {row.teamLabel && (
                                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#FF6C0F] bg-[#FFF0E5] px-2 py-0.5 rounded-lg">
                                            {row.teamLabel}
                                          </span>
                                        )}
                                      </td>
                                      {Object.keys(row.sectionStatus).map(sId => {
                                        const effective = getEffectiveStatus(hw.id, row.userId, sId, row.sectionStatus[sId]);
                                        const cellKey = `${hw.id}:${row.userId}:${sId}`;
                                        const isToggling = togglingCell === cellKey;
                                        return (
                                          <td key={sId} className="px-4 py-3 text-center">
                                            <button
                                              onClick={() => handleCellToggle(hw.id, row.userId, sId, row.sectionStatus[sId])}
                                              disabled={isToggling}
                                              title={effective ? "완료 취소" : "완료로 표시"}
                                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-50 ${
                                                effective
                                                  ? "bg-[#E6F9E6] text-[#2f9e44] ring-2 ring-[#2f9e44]/20 hover:bg-[#FEE2E2] hover:text-[#b42318] hover:ring-[#b42318]/20"
                                                  : "bg-[#FEE2E2] text-[#b42318]/40 ring-1 ring-[#b42318]/10 opacity-40 hover:opacity-100 hover:bg-[#E6F9E6] hover:text-[#2f9e44] hover:ring-2 hover:ring-[#2f9e44]/20"
                                              }`}
                                            >
                                              {isToggling
                                                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                : effective
                                                  ? <Check className="h-4 w-4" strokeWidth={3} />
                                                  : <X className="h-4 w-4" strokeWidth={3} />
                                              }
                                            </button>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="md:hidden space-y-3">
                            {rows.map((row, rIdx) => {
                              const sectionIds = pData.sections.length > 0 ? pData.sections.map(s => s.id) : ['__none__'];
                              return (
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
                                      const effective = getEffectiveStatus(hw.id, row.userId, s.id, row.sectionStatus[s.id] ?? false);
                                      const cellKey = `${hw.id}:${row.userId}:${s.id}`;
                                      const isToggling = togglingCell === cellKey;
                                      return (
                                        <div key={s.id} className="flex items-center justify-between rounded-lg bg-[#f5f5ee] px-3 py-2">
                                          <span className="font-['Pretendard',sans-serif] text-xs text-[#4a4a40]">{s.title}</span>
                                          <button
                                            onClick={() => handleCellToggle(hw.id, row.userId, s.id, row.sectionStatus[s.id] ?? false)}
                                            disabled={isToggling}
                                            title={effective ? "완료 취소" : "완료로 표시"}
                                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-all disabled:opacity-50 ${
                                              effective
                                                ? "bg-[#E6F9E6] text-[#2f9e44] hover:bg-[#FEE2E2] hover:text-[#b42318]"
                                                : "bg-[#FEE2E2] text-[#b42318]/40 opacity-40 hover:opacity-100 hover:bg-[#E6F9E6] hover:text-[#2f9e44]"
                                            }`}
                                          >
                                            {isToggling
                                              ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                              : effective
                                                ? <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                                : <X className="h-3.5 w-3.5" strokeWidth={3} />
                                            }
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
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
