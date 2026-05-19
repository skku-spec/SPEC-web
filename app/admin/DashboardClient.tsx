"use client"

import { useState, useCallback, useMemo } from "react";
import { Download, Phone, PhoneOff, CalendarDays, Printer } from "lucide-react";
import { exportMembersCSV } from "@/lib/actions/members";
import { exportApplicationsCSV, exportAttendanceCSV } from "@/lib/actions/export";
import { computeLearnerHomeworkStats, SectionSubmission } from "@/lib/homework-utils";

type Profile = {
  id: string;
  name: string;
  role: string | null;
}

type Session = {
  id: string;
  title: string;
  date: string;
}

type AttendanceLog = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
}

type SectionConfig = { type: "individual" } | { type: "team"; task_index: number };

type Homework = {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  is_individual: boolean;
  is_team: boolean;
  individual_content: unknown;
  team_content: unknown;
  section_type_config?: unknown;
}

type Submission = {
  homework_id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
}

type ApplicationStats = Record<
  string,
  { total: number; pending: number; accepted: number; rejected: number; under_review: number }
>;

type Props = {
  learners: Profile[];
  sessions: Session[];
  logs: AttendanceLog[];
  homeworks: Homework[];
  submissions: Submission[];
  sectionSubmissions: SectionSubmission[];
  applicationStats: ApplicationStats;
}

export function DashboardClient({
  learners,
  sessions,
  logs,
  homeworks,
  submissions,
  sectionSubmissions,
  applicationStats
}: Props) {
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"현황" | "보고서">("현황");
  const [contactNeeded, setContactNeeded] = useState<Record<string, boolean>>({});
  const [startWeek, setStartWeek] = useState<number>(0);
  const [endWeek, setEndWeek] = useState<number>(0);

  const downloadCSV = useCallback((csv: string, filename: string) => {
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(async (type: "members" | "applications" | "attendance") => {
    setExportLoading(type);
    try {
      let result: { success?: boolean; error?: string; data?: string };
      let filename: string;
      if (type === "members") {
        result = await exportMembersCSV();
        filename = `members_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (type === "applications") {
        result = await exportApplicationsCSV();
        filename = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        result = await exportAttendanceCSV();
        filename = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
      }
      if (result.success && result.data) {
        downloadCSV(result.data, filename);
      }
    } finally {
      setExportLoading(null);
    }
  }, [downloadCSV]);

  const safeLearners = learners || [];
  const safeSessions = sessions || [];
  const safeLogs = logs || [];
  const safeHomeworks = homeworks || [];
  const safeSubmissions = submissions || [];
  const safeSectionSubmissions = sectionSubmissions || [];

  const totalLearners = safeLearners.length;
  const totalAttendancePointsPossible = safeLearners.length * safeSessions.length;
  const actualPresentCount = safeLogs.filter(l => l.status === "present").length;
  const attendanceRate = totalAttendancePointsPossible > 0 
    ? Math.round((actualPresentCount / totalAttendancePointsPossible) * 100) 
    : 0;

  const totalHomeworkPossible = safeLearners.length * safeHomeworks.length;
  const completedHomeworkCount = safeSubmissions.filter(s => s.status === "completed").length;
  const homeworkRate = totalHomeworkPossible > 0 
    ? Math.round((completedHomeworkCount / totalHomeworkPossible) * 100) 
    : 0;

  const learnerStats = safeLearners.map(learner => {
    const userLogs = safeLogs.filter(l => l.user_id === learner.id);
    const totalPresent = userLogs.filter(l => l.status === "present" || l.status === "late").length;
    const attLateCount = userLogs.filter(l => l.status === "late").length;
    const attRate = safeSessions.length > 0
      ? Math.round((totalPresent / safeSessions.length) * 100)
      : 0;
    const hwStats = computeLearnerHomeworkStats(learner.id, safeHomeworks, safeSubmissions, sectionSubmissions);
    return {
      ...learner,
      attRate,
      totalPresent,
      attLateCount,
      ...hwStats,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const missingTwoPlus = learnerStats
    .filter(l => l.notSubmittedCount >= 2)
    .sort((a, b) => b.notSubmittedCount - a.notSubmittedCount);

  const missingGroups = missingTwoPlus.reduce<Record<number, typeof missingTwoPlus>>((acc, learner) => {
    const key = learner.notSubmittedCount;
    if (!acc[key]) acc[key] = [];
    acc[key].push(learner);
    return acc;
  }, {});

  const toggleContact = (id: string) => {
    setContactNeeded(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  // ── Shared report helpers ──────────────────────────────────────────────────
  type HwRow = typeof safeHomeworks[0];

  const sortedSessionsAll = useMemo(
    () => [...safeSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [safeSessions]
  );

  const getAssignedSession = useCallback((hw: HwRow, sessionList: typeof sortedSessionsAll) => {
    if (sessionList.length === 0) return null;

    // Primary: parse "N주차" from the homework title (e.g. "1주차 과제" → session index 0)
    const weekMatch = hw.title.match(/(\d+)주차/);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1], 10);
      if (weekNum >= 1 && weekNum <= sessionList.length) return sessionList[weekNum - 1];
    }

    if (sessionList.length === 1) return sessionList[0];

    // Fallback: use due_date with a 50%-interval extended boundary
    const avgIntervalMs = sessionList.slice(0, -1).reduce((sum, s, i) =>
      sum + (new Date(sessionList[i + 1].date).getTime() - new Date(s.date).getTime()), 0
    ) / (sessionList.length - 1);

    if (hw.due_date) {
      const dueDateMs = new Date(hw.due_date).getTime();
      for (let i = 0; i < sessionList.length; i++) {
        const nextMs = i + 1 < sessionList.length
          ? new Date(sessionList[i + 1].date).getTime()
          : Infinity;
        const boundaryMs = nextMs === Infinity ? Infinity : nextMs + avgIntervalMs * 0.5;
        if (dueDateMs < boundaryMs) return sessionList[i];
      }
      return sessionList[sessionList.length - 1];
    }

    return sessionList[0];
  }, []);

  const getNonSubmitters = useCallback((hwId: string) =>
    safeLearners
      .filter(l => !safeSubmissions.some(s => s.homework_id === hwId && s.user_id === l.id && s.status === 'completed'))
      .map(l => l.name)
      .sort((a, b) => a.localeCompare(b, 'ko')),
  [safeLearners, safeSubmissions]);

  const stripPrefix = (s: string) => s.trim().replace(/^\[(개인|팀)\]\s*/g, '');

  const hwLines = useCallback((hw: HwRow): { prefix: string; name: string }[] => {
    const indItems = (hw.individual_content as string[] | null | undefined) ?? [];
    const teamItems = (hw.team_content as string[] | null | undefined) ?? [];
    const lines: { prefix: string; name: string }[] = [];
    indItems.filter(s => s?.trim()).forEach(s => lines.push({ prefix: '[개인]', name: stripPrefix(s) }));
    teamItems.filter(s => s?.trim()).forEach(s => lines.push({ prefix: '[팀]', name: stripPrefix(s) }));
    if (lines.length === 0) {
      const prefix = hw.is_team && !hw.is_individual ? '[팀]' : hw.is_team ? '[개인+팀]' : '[개인]';
      lines.push({ prefix, name: hw.title });
    }
    return lines;
  }, []);

  // ── Preview data (reactive) ────────────────────────────────────────────────
  const previewData = useMemo(() => {
    const effStart = startWeek > 0 ? startWeek : 1;
    const effEnd = endWeek > 0 ? endWeek : sortedSessionsAll.length;
    const sessionsInPeriod = sortedSessionsAll.slice(effStart - 1, effEnd);
    const sessionIdSet = new Set(sessionsInPeriod.map(s => s.id));

    const homeworksInPeriod = safeHomeworks.filter(hw => {
      const a = getAssignedSession(hw, sortedSessionsAll);
      return a ? sessionIdSet.has(a.id) : false;
    });

    const sessionHwMap = new Map<string, typeof homeworksInPeriod>();
    sessionsInPeriod.forEach(s => sessionHwMap.set(s.id, []));
    homeworksInPeriod.forEach(hw => {
      const s = getAssignedSession(hw, sortedSessionsAll);
      if (s && sessionHwMap.has(s.id)) sessionHwMap.get(s.id)!.push(hw);
    });

    const getUnsubmittedLines = (hw: HwRow, learnerId: string): { prefix: string; name: string }[] => {
      const hwSecs = safeSectionSubmissions.filter(s => s.homework_id === hw.id && s.user_id === learnerId);
      const allLines = hwLines(hw);
      if (hwSecs.length === 0) return allLines;
      const unsubmittedSecs = hwSecs.filter(s => !s.is_completed);
      if (unsubmittedSecs.length === 0) return [];
      const config = (hw.section_type_config as Record<string, SectionConfig> | null | undefined) ?? {};
      const indItems = (hw.individual_content as string[] | null | undefined) ?? [];
      const teamItems = (hw.team_content as string[] | null | undefined) ?? [];
      let showIndividual = false;
      const unsubmittedTeamIndices = new Set<number>();
      for (const sec of unsubmittedSecs) {
        const sConf = config[sec.section_id];
        if (!sConf || sConf.type === 'individual') {
          showIndividual = true;
        } else if (sConf.type === 'team') {
          unsubmittedTeamIndices.add(sConf.task_index);
        }
      }
      const result: { prefix: string; name: string }[] = [];
      if (showIndividual) {
        indItems.filter(s => s?.trim()).forEach(s => result.push({ prefix: '[개인]', name: stripPrefix(s) }));
      }
      teamItems.forEach((s, i) => {
        if (s?.trim() && unsubmittedTeamIndices.has(i)) result.push({ prefix: '[팀]', name: stripPrefix(s) });
      });
      return result.length > 0 ? result : allLines;
    };

    const cumStats = safeLearners.map(learner => {
      // Build missed list with only the unsubmitted lines per homework
      const missed = homeworksInPeriod
        .filter(hw => {
          const hwSecs = safeSectionSubmissions.filter(s => s.homework_id === hw.id && s.user_id === learner.id);
          if (hwSecs.length > 0) return hwSecs.some(s => !s.is_completed);
          return !safeSubmissions.some(s => s.homework_id === hw.id && s.user_id === learner.id && s.status === 'completed');
        })
        .map(hw => ({ hw, lines: getUnsubmittedLines(hw, learner.id) }))
        .filter(({ lines }) => lines.length > 0);
      const { notSubmittedCount: missedCount } = computeLearnerHomeworkStats(
        learner.id, homeworksInPeriod, safeSubmissions, safeSectionSubmissions
      );
      return { ...learner, missed, missedCount };
    }).filter(l => l.missed.length > 0)
      .sort((a, b) => b.missedCount - a.missedCount || a.name.localeCompare(b.name, 'ko'));

    const cumGroups = cumStats.reduce<Record<number, typeof cumStats>>((acc, l) => {
      const k = l.missedCount; if (!acc[k]) acc[k] = []; acc[k].push(l); return acc;
    }, {});

    return { effStart, effEnd, sessionsInPeriod, sessionHwMap, cumGroups, cumStats };
  }, [startWeek, endWeek, sortedSessionsAll, safeHomeworks, safeLearners, safeSubmissions, safeSectionSubmissions, getAssignedSession, hwLines]);

  const generateReportHTML = useCallback(() => {
    const fmtDate = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const { effStart, effEnd, sessionsInPeriod, sessionHwMap, cumGroups, cumStats } = previewData;

    const contactList = cumStats.filter(l => l.missedCount >= 2 && contactNeeded[l.id] !== false);
    const periodText = sortedSessionsAll.length > 0 ? `${effStart}주차 ~ ${effEnd}주차` : '전체 기간';

    // Build HTML sections
    let weekSections = '';
    sessionsInPeriod.forEach((session, i) => {
      const sessionIdx = sortedSessionsAll.indexOf(session) + 1;
      const hws = sessionHwMap.get(session.id) ?? [];
      weekSections += `<h2>${sessionIdx}주차 현황</h2>`;
      if (hws.length === 0) {
        weekSections += `<p class="no-hw">이 주차에 해당하는 과제가 없습니다.</p>`;
      } else {
        hws.forEach(hw => {
          const nonSubs = getNonSubmitters(hw.id);
          const lines = hwLines(hw);
          lines.forEach(({ prefix, name }) => {
            weekSections += `<h3>${prefix} ${name}</h3>`;
            weekSections += nonSubs.length > 0
              ? `<p class="names">${nonSubs.join(', ')}</p>`
              : `<p class="names ok">전원 제출 완료</p>`;
          });
        });
      }
      if (i < sessionsInPeriod.length - 1) weekSections += '<hr class="divider">';
    });

    const totalHwCount = [...sessionHwMap.values()].reduce((s, a) => s + a.length, 0);
    let cumulativeSection = '';
    if (totalHwCount > 0 && effEnd > 0) {
      cumulativeSection += `<h2>${effEnd}회차 세션까지 현황 (${sessionsInPeriod.length}주차 과제, 미완료자)</h2>`;
      const maxCount = Math.max(...Object.keys(cumGroups).map(Number));
      Object.entries(cumGroups)
        .sort(([a], [b]) => Number(b) - Number(a))
        .forEach(([count, members]) => {
          cumulativeSection += `<div class="cum-group"><p class="cum-title"><strong>${count}회 미제출${Number(count) === maxCount ? ' (최다 미제출)' : ''}</strong></p>`;
          members.forEach(m => {
            cumulativeSection += `<div class="person">- <strong>${m.name}</strong>: ${m.missed.flatMap(({ lines }) => lines).map(l => `${l.prefix} ${l.name}`).join(', ')}</div>`;
          });
          cumulativeSection += `</div>`;
        });
    } else if (sessionsInPeriod.length === 0) {
      cumulativeSection = `<p class="no-hw">선택한 기간 내 세션이 없습니다.</p>`;
    }

    let contactSection = `<h2>연락 명단</h2>`;
    if (contactList.length === 0) {
      contactSection += `<p class="names">연락 필요한 러너가 없습니다.</p>`;
    } else {
      const cGroups = contactList.reduce<Record<number, typeof contactList>>((acc, l) => {
        const k = l.missedCount;
        if (!acc[k]) acc[k] = [];
        acc[k].push(l);
        return acc;
      }, {});
      Object.entries(cGroups)
        .sort(([a], [b]) => Number(b) - Number(a))
        .forEach(([count, members]) => {
          contactSection += `<div class="cum-group"><p class="cum-title"><strong>미제출 ${count}회</strong></p>`;
          members.forEach(m => {
            contactSection += `<div class="person">- <strong>${m.name}</strong></div>`;
          });
          contactSection += `</div>`;
        });
    }

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>SPEC 활동 보고서</title>
<style>
  @page { size: A4; margin: 20mm 25mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif; font-size: 10pt; line-height: 1.75; color: #1a1a1a; }
  .hd { border-bottom: 2.5px solid #1a1a1a; padding-bottom: 14px; margin-bottom: 28px; }
  .hd-title { font-size: 20pt; font-weight: 900; margin-bottom: 4px; }
  .hd-sub { font-size: 11pt; font-weight: 600; color: #444; margin-bottom: 4px; }
  .hd-meta { font-size: 9pt; color: #888; }
  h2 { font-size: 13pt; font-weight: 700; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1.5px solid #e0e0e0; }
  h3 { font-size: 10.5pt; font-weight: 700; margin: 12px 0 3px; color: #1d4ed8; }
  .names { font-size: 10pt; color: #333; margin-bottom: 6px; padding-left: 4px; }
  .ok { color: #2f9e44; }
  .no-hw { color: #888; font-size: 9.5pt; font-style: italic; margin: 6px 0; }
  .cum-group { margin: 8px 0 16px; }
  .cum-title { margin-bottom: 5px; font-size: 10pt; }
  .person { font-size: 9.5pt; margin-bottom: 3px; padding-left: 6px; line-height: 1.65; }
  .divider { border: none; border-top: 1px solid #eee; margin: 18px 0; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="hd">
  <div class="hd-title">SPEC 활동 보고서</div>
  <div class="hd-sub">기간: ${periodText}</div>
  <div class="hd-meta">생성일: ${fmtDate(new Date().toISOString())} &nbsp;·&nbsp; 총 러너 ${safeLearners.length}명</div>
</div>
${weekSections}
<hr class="divider" style="margin:28px 0;">
${cumulativeSection}
${contactSection}
</body>
</html>`;
  }, [previewData, sortedSessionsAll, safeLearners, contactNeeded, getNonSubmitters, hwLines]);

  const handlePrintReport = useCallback(() => {
    const html = generateReportHTML();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }, [generateReportHTML]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Dashboard</h1>
        <div className="flex gap-1 rounded-lg border border-[#ddd9cc] bg-[#f0efe6] p-1">
          {(["현황", "보고서"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-1.5 font-['Pretendard',sans-serif] text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-white text-[#16140f] shadow-sm"
                  : "text-[#6b6b5e] hover:text-[#16140f]"
              }`}
            >
              {tab}
              {tab === "보고서" && missingTwoPlus.length > 0 && (
                <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-['Pretendard',sans-serif] text-[10px] font-bold ${
                  activeTab === "보고서" ? "bg-[#FEE2E2] text-[#b42318]" : "bg-[#b42318] text-white"
                }`}>
                  {missingTwoPlus.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "현황" && (<>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">Total Learners</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Pretendard',sans-serif] text-3xl font-black text-[#16140f]">{totalLearners}</span>
            <span className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] mb-0.5">명</span>
          </div>
        </div>
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">Attendance Rate</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Pretendard',sans-serif] text-3xl font-black text-[#2f9e44]">{attendanceRate}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
             <div className="h-full bg-[#2f9e44] transition-all duration-1000" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">Homework Rate</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Pretendard',sans-serif] text-3xl font-black text-[#2563EB]">{homeworkRate}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
             <div className="h-full bg-[#2563EB] transition-all duration-1000" style={{ width: `${homeworkRate}%` }} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece8db] bg-[#f0efe6] px-4 py-3">
          <div>
            <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">러너별 주차별 통합 현황</h2>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">출석(S)과 과제(H) 이행 여부를 주차별로 확인하세요.</p>
          </div>
          <div className="flex gap-3 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#2f9e44]"></div> Present</div>
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#2563EB]"></div> Completed</div>
             <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-200"></div> Incomplete</div>
          </div>
        </div>
        
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-[#f0efe6] text-left">
            <tr>
              <th className="sticky left-0 z-10 bg-[#f0efe6] px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold min-w-[180px]">이름</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#2f9e44]">출석 합계</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#2563EB]">과제 합계</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">출석 (Sessions)</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">과제 (Homeworks)</th>
            </tr>
          </thead>
          <tbody>
              {learnerStats.map(learner => {
                const hwRatio = learner.totalCount > 0 ? learner.completedCount / learner.totalCount : 0;

                return (
                  <tr key={learner.id} className="border-t border-[#ece8db] transition-colors hover:bg-[#fcfcf8] group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#fcfcf8] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                          {learner.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</span>
                          {(learner.notSubmittedCount > 0 || learner.lateCount > 0) && (
                            <span className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">
                              ({[
                                learner.notSubmittedCount > 0 ? `미제출 ${learner.notSubmittedCount}개` : null,
                                learner.lateCount > 0 ? `지각제출 ${learner.lateCount}개` : null,
                              ].filter(Boolean).join(" · ")})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                        safeSessions.length === 0 ? "bg-gray-100 text-[#6b6b5e]" :
                        learner.totalPresent / safeSessions.length >= 0.8 ? "bg-[#E6F9E6] text-[#2f9e44]" :
                        learner.totalPresent / safeSessions.length >= 0.5 ? "bg-[#FFF0E5] text-[#FF6C0F]" :
                        "bg-[#FEE2E2] text-[#b42318]"
                      }`}>
                        {learner.totalPresent}/{safeSessions.length}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                        learner.totalCount === 0 ? "bg-gray-100 text-[#6b6b5e]" :
                        hwRatio >= 0.8 ? "bg-[#E6F9E6] text-[#2f9e44]" :
                        hwRatio >= 0.5 ? "bg-[#FFF0E5] text-[#FF6C0F]" :
                        "bg-[#FEE2E2] text-[#b42318]"
                      }`}>
                        {learner.completedCount}/{learner.totalCount}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {safeSessions.map(s => {
                          const status = safeLogs.find(l => l.session_id === s.id && l.user_id === learner.id)?.status;
                          const isPresent = status === 'present' || status === 'late';
                          return (
                            <div key={s.id} className="group/dot relative cursor-help">
                              <div className={`h-6 w-6 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[9px] font-semibold ${
                                isPresent ? "bg-green-100 text-[#2f9e44]" : "bg-gray-100 text-gray-400"
                              }`}>
                                S
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50 whitespace-nowrap bg-[#16140f] text-white text-[10px] px-2 py-1 rounded-md">
                                {s.title}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {safeHomeworks.map(hw => {
                          const isDone = safeSubmissions.some(s => s.homework_id === hw.id && s.user_id === learner.id && s.status === 'completed');
                          return (
                            <div key={hw.id} className="group/dot relative cursor-help">
                              <div className={`h-6 w-6 rounded-md flex items-center justify-center font-['Pretendard',sans-serif] text-[9px] font-semibold ${
                                isDone ? "bg-blue-100 text-[#2563EB]" : "bg-gray-100 text-gray-400"
                              }`}>
                                H
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50 whitespace-nowrap bg-[#16140f] text-white text-[10px] px-2 py-1 rounded-md">
                                {hw.title}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <div className="md:hidden space-y-3 p-4">
          {learnerStats.map(learner => {
            const hwRatio = learner.totalCount > 0 ? learner.completedCount / learner.totalCount : 0;
            return (
              <div key={learner.id} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                      {learner.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</span>
                      {(learner.attLateCount > 0 || learner.notSubmittedCount > 0 || learner.lateCount > 0) && (
                        <span className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">
                          ({[
                            learner.attLateCount > 0 ? `지각 ${learner.attLateCount}회` : null,
                            learner.notSubmittedCount > 0 ? `미제출 ${learner.notSubmittedCount}개` : null,
                            learner.lateCount > 0 ? `지각제출 ${learner.lateCount}개` : null,
                          ].filter(Boolean).join(" · ")})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                      safeSessions.length === 0 ? "bg-gray-100 text-[#6b6b5e]" :
                      learner.totalPresent / safeSessions.length >= 0.8 ? "bg-[#E6F9E6] text-[#2f9e44]" :
                      learner.totalPresent / safeSessions.length >= 0.5 ? "bg-[#FFF0E5] text-[#FF6C0F]" :
                      "bg-[#FEE2E2] text-[#b42318]"
                    }`}>
                      S {learner.totalPresent}/{safeSessions.length}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${
                      learner.totalCount === 0 ? "bg-gray-100 text-[#6b6b5e]" :
                      hwRatio >= 0.8 ? "bg-[#E6F9E6] text-[#2f9e44]" :
                      hwRatio >= 0.5 ? "bg-[#FFF0E5] text-[#FF6C0F]" :
                      "bg-[#FEE2E2] text-[#b42318]"
                    }`}>
                      H {learner.completedCount}/{learner.totalCount}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  <span>출석 {learner.totalPresent}/{safeSessions.length}</span>
                  <span>과제 {learner.completedCount}/{learner.totalCount}</span>
                </div>
              </div>
            );
          })}
        </div>
        {!safeSessions.length && !safeHomeworks.length && (
          <div className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
             아직 생성된 출석 세션이나 과제가 없습니다.
          </div>
        )}
      </div>

      {/* 지원서 통계 */}
      {Object.keys(applicationStats).length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <div className="border-b border-[#ece8db] bg-[#f0efe6] px-4 py-3">
            <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">지원서 통계</h2>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">기수별 지원 현황을 확인하세요.</p>
          </div>
          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">기수</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">전체</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">대기</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">검토중</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">합격</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">불합격</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(applicationStats)
                .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
                .map(([batch, stats]) => (
                  <tr key={batch} className="border-t border-[#ece8db]">
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{batch}기</td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40] text-right">{stats.total}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FFF0E5] text-[#FF6C0F]">
                        {stats.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E8F0FE] text-[#2563EB]">
                        {stats.under_review}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E6F9E6] text-[#2f9e44]">
                        {stats.accepted}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FEE2E2] text-[#b42318]">
                        {stats.rejected}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="md:hidden space-y-3 p-4">
            {Object.entries(applicationStats)
              .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
              .map(([batch, stats]) => (
                <div key={batch} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{batch}기</span>
                    <span className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">{stats.total}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">대기</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FFF0E5] text-[#FF6C0F]">{stats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">검토중</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E8F0FE] text-[#2563EB]">{stats.under_review}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">합격</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#E6F9E6] text-[#2f9e44]">{stats.accepted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">불합격</span>
                      <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold bg-[#FEE2E2] text-[#b42318]">{stats.rejected}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 데이터 내보내기 */}
      <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
        <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">데이터 내보내기</h2>
        <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5 mb-4">각 데이터를 CSV 파일로 다운로드합니다.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={exportLoading !== null}
            onClick={() => handleExport("members")}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exportLoading === "members" ? "내보내는 중..." : "멤버 목록 CSV"}
          </button>
          <button
            type="button"
            disabled={exportLoading !== null}
            onClick={() => handleExport("applications")}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exportLoading === "applications" ? "내보내는 중..." : "지원서 목록 CSV"}
          </button>
          <button
            type="button"
            disabled={exportLoading !== null}
            onClick={() => handleExport("attendance")}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exportLoading === "attendance" ? "내보내는 중..." : "출석 데이터 CSV"}
          </button>
        </div>
      </div>
      </>)}

      {activeTab === "보고서" && (
        <div className="space-y-6">

          {/* 기간 설정 */}
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-[#6b6b5e]" strokeWidth={2} />
              <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">기간 설정</h2>
              <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">보고서에 포함할 주차 범위를 선택합니다.</span>
            </div>
            {safeSessions.length === 0 ? (
              <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">등록된 세션이 없습니다.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="font-['Pretendard',sans-serif] text-xs font-medium text-[#6b6b5e] whitespace-nowrap">시작</label>
                  <select
                    value={startWeek}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setStartWeek(v);
                      if (endWeek > 0 && v > endWeek) setEndWeek(v);
                    }}
                    className="h-8 rounded-md border border-[#ddd9cc] px-2 font-['Pretendard',sans-serif] text-xs text-[#16140f] focus:outline-none focus:ring-1 focus:ring-[#16140f] bg-white"
                  >
                    <option value={0}>1주차 (처음)</option>
                    {[...safeSessions]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((s, i) => (
                        <option key={s.id} value={i + 1}>{i + 1}주차</option>
                      ))}
                  </select>
                </div>
                <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">~</span>
                <div className="flex items-center gap-2">
                  <label className="font-['Pretendard',sans-serif] text-xs font-medium text-[#6b6b5e] whitespace-nowrap">종료</label>
                  <select
                    value={endWeek}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setEndWeek(v);
                      if (startWeek > 0 && v > 0 && v < startWeek) setStartWeek(v);
                    }}
                    className="h-8 rounded-md border border-[#ddd9cc] px-2 font-['Pretendard',sans-serif] text-xs text-[#16140f] focus:outline-none focus:ring-1 focus:ring-[#16140f] bg-white"
                  >
                    <option value={0}>{safeSessions.length}주차 (마지막)</option>
                    {[...safeSessions]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((s, i) => (
                        <option key={s.id} value={i + 1}>{i + 1}주차</option>
                      ))}
                  </select>
                </div>
                {(startWeek > 0 || endWeek > 0) && (
                  <button
                    type="button"
                    onClick={() => { setStartWeek(0); setEndWeek(0); }}
                    className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] hover:bg-[#f0efe6] transition-colors"
                  >
                    초기화
                  </button>
                )}
                <span className="font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]">
                  {(startWeek > 0 ? startWeek : 1)}주차 ~ {(endWeek > 0 ? endWeek : safeSessions.length)}주차
                </span>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-white">
            <div className="border-b border-[#ece8db] bg-[#f0efe6] px-4 py-3">
              <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">과제 미제출 2회 이상 명단</h2>
              <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">
                미제출 횟수 기준으로 분류됩니다. 연락 필요 여부를 토글로 관리하세요.
              </p>
            </div>

            {missingTwoPlus.length === 0 ? (
              <div className="px-4 py-10 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                과제 미제출 2회 이상인 러너가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-[#ece8db]">
                {Object.entries(missingGroups)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([count, members]) => (
                    <div key={count}>
                      <div className="flex items-center gap-2 bg-[#faf9f5] px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-[#FEE2E2] px-2.5 py-0.5 font-['Pretendard',sans-serif] text-xs font-bold text-[#b42318]">
                          미제출 {count}회
                        </span>
                        <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{members.length}명</span>
                      </div>
                      {members.map(learner => {
                        const isNeeded = contactNeeded[learner.id] !== false;
                        return (
                          <div key={learner.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#fcfcf8] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                                {learner.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{learner.name}</span>
                                <span className="font-['Pretendard',sans-serif] text-[11px] text-[#6b6b5e]">
                                  미제출 {learner.notSubmittedCount}개
                                  {learner.lateCount > 0 && ` · 지각제출 ${learner.lateCount}개`}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleContact(learner.id)}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-['Pretendard',sans-serif] text-xs font-semibold transition-all ${
                                isNeeded
                                  ? "bg-[#FEE2E2] text-[#b42318] hover:bg-[#fecaca]"
                                  : "bg-[#f0efe6] text-[#6b6b5e] hover:bg-[#e8e6dc]"
                              }`}
                            >
                              {isNeeded
                                ? <><Phone className="h-3 w-3" strokeWidth={2.5} /> 연락 필요</>
                                : <><PhoneOff className="h-3 w-3" strokeWidth={2.5} /> 연락 완료</>
                              }
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#ddd9cc] bg-[#faf9f5] px-4 py-3">
            <div className="flex items-center justify-between font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              <span>연락 필요 <span className="font-bold text-[#b42318]">{missingTwoPlus.filter(l => contactNeeded[l.id] !== false).length}명</span></span>
              <span>연락 완료 <span className="font-bold text-[#2f9e44]">{missingTwoPlus.filter(l => contactNeeded[l.id] === false).length}명</span></span>
              <span>전체 대상 <span className="font-bold text-[#16140f]">{missingTwoPlus.length}명</span></span>
            </div>
          </div>

          {/* 보고서 미리보기 */}
          <div className="rounded-lg border border-[#ddd9cc] bg-white overflow-hidden">
            <div className="border-b border-[#ece8db] bg-[#f0efe6] px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">보고서 미리보기</h2>
                <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] mt-0.5">
                  {previewData.effStart}주차 ~ {previewData.effEnd}주차 기준 · 인쇄 전 내용을 확인하세요
                </p>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[600px] px-6 py-5 font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#16140f]">
              {previewData.sessionsInPeriod.length === 0 ? (
                <p className="text-[#6b6b5e] text-xs italic">선택한 기간 내 세션이 없습니다.</p>
              ) : (
                <>
                  {/* 주차별 현황 */}
                  {previewData.sessionsInPeriod.map((session, i) => {
                    const sessionIdx = sortedSessionsAll.indexOf(session) + 1;
                    const hws = previewData.sessionHwMap.get(session.id) ?? [];
                    return (
                      <div key={session.id} className={i > 0 ? 'mt-6 pt-6 border-t border-[#ece8db]' : ''}>
                        <p className="text-base font-black text-[#16140f] mb-3">
                          <span className="text-[#aaa] mr-1">##</span>{sessionIdx}주차 현황
                        </p>
                        {hws.length === 0 ? (
                          <p className="text-xs text-[#aaa] italic ml-4">이 주차에 해당하는 과제가 없습니다.</p>
                        ) : (
                          hws.map(hw => {
                            const nonSubs = getNonSubmitters(hw.id);
                            return hwLines(hw).map(({ prefix, name }) => (
                              <div key={`${hw.id}-${name}`} className="mb-4 ml-2">
                                <p className="font-bold text-[#16140f] mb-1">
                                  <span className="text-[#aaa] mr-1">###</span>
                                  <span className={`mr-1 text-xs font-bold px-1.5 py-0.5 rounded ${prefix === '[팀]' ? 'bg-[#e8f0fe] text-[#2563EB]' : 'bg-[#f0efe6] text-[#6b6b5e]'}`}>{prefix}</span>
                                  {name}
                                </p>
                                <p className="ml-6 text-sm text-[#333]">
                                  {nonSubs.length > 0 ? nonSubs.join(', ') : <span className="text-[#2f9e44]">전원 제출 완료</span>}
                                </p>
                              </div>
                            ));
                          })
                        )}
                      </div>
                    );
                  })}

                  {/* 구분선 */}
                  <div className="my-6 border-t-2 border-dashed border-[#ddd9cc]" />

                  {/* 누적 현황 */}
                  <div>
                    <p className="text-base font-black text-[#16140f] mb-3">
                      <span className="text-[#aaa] mr-1">##</span>{previewData.effEnd}회차 세션까지 현황
                      <span className="ml-2 text-xs font-normal text-[#6b6b5e]">({previewData.sessionsInPeriod.length}주차 과제, 미완료자)</span>
                    </p>
                    {Object.keys(previewData.cumGroups).length === 0 ? (
                      <p className="text-[#2f9e44] text-sm ml-4">전원 제출 완료</p>
                    ) : (
                      Object.entries(previewData.cumGroups)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([count, members]) => {
                          const isMax = Number(count) === Math.max(...Object.keys(previewData.cumGroups).map(Number));
                          return (
                            <div key={count} className="mb-4 ml-2">
                              <p className="font-bold text-sm mb-1">
                                {count}회 미제출{isMax ? <span className="ml-1 text-xs text-[#b42318]">(최다 미제출)</span> : ''}
                              </p>
                              {members.map(m => (
                                <p key={m.id} className="ml-4 text-sm text-[#333] mb-0.5">
                                  - <strong>{m.name}</strong>: {m.missed.flatMap(({ lines }) => lines).map(l => `${l.prefix} ${l.name}`).join(', ')}
                                </p>
                              ))}
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* 연락 명단 */}
                  <div className="mt-6 pt-6 border-t border-[#ece8db]">
                    <p className="text-base font-black text-[#16140f] mb-3">
                      <span className="text-[#aaa] mr-1">##</span>연락 명단
                    </p>
                    {previewData.cumStats.filter(l => l.missedCount >= 2 && contactNeeded[l.id] !== false).length === 0 ? (
                      <p className="text-[#6b6b5e] text-sm ml-4">연락 필요한 러너가 없습니다.</p>
                    ) : (
                      Object.entries(
                        previewData.cumStats
                          .filter(l => l.missedCount >= 2 && contactNeeded[l.id] !== false)
                          .reduce<Record<number, (typeof previewData.cumStats)>>((acc, l) => {
                            const k = l.missedCount;
                            if (!acc[k]) acc[k] = [];
                            acc[k].push(l);
                            return acc;
                          }, {})
                      ).sort(([a], [b]) => Number(b) - Number(a))
                        .map(([count, members]) => (
                          <div key={count} className="mb-3 ml-2">
                            <p className="font-bold text-sm mb-1">미제출 {count}회</p>
                            {members.map(m => (
                              <p key={m.id} className="ml-4 text-sm text-[#333]">- <strong>{m.name}</strong></p>
                            ))}
                          </div>
                        ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 보고서 출력 */}
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] mb-0.5">보고서 출력</h2>
                <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  {(startWeek > 0 || endWeek > 0)
                    ? `${startWeek > 0 ? startWeek : 1}주차 ~ ${endWeek > 0 ? endWeek : safeSessions.length}주차 기간의 보고서를 PDF로 출력합니다.`
                    : '전체 기간 보고서를 PDF로 출력합니다. 기간 설정으로 범위를 좁힐 수 있습니다.'}
                </p>
                <p className="font-['Pretendard',sans-serif] text-[11px] text-[#aaa] mt-1">
                  주차별 현황 → 누적 현황 → 연락 명단 순으로 구성됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrintReport}
                className="inline-flex items-center gap-2 h-9 rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#2a2820] active:bg-[#0a0907]"
              >
                <Printer className="h-3.5 w-3.5" strokeWidth={2} />
                보고서 출력 (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
