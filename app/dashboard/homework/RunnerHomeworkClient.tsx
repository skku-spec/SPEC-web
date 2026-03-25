"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Homework = {
  id: string;
  title: string;
  individual_content: string[];
  team_content: string[];
  submission_link?: string;
  is_individual: boolean;
  is_team: boolean;
  due_date?: string | null;
  created_at: string;
};

const supabase = createClient();

export function RunnerHomeworkClient() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [myAssignments, setMyAssignments] = useState<Record<string, { teamName: string; teammates: string[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    // 2. Fetch all homeworks
    const { data: hwData } = await supabase
      .from("homeworks")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. Fetch my team assignments
    const { data: assignData } = await supabase
      .from("homework_team_assignments")
      .select("homework_id, team_name")
      .eq("user_id", user.id);

    // 4. If I have team assignments, fetch teammates for those teams
    const assignmentsMap: Record<string, { teamName: string; teammates: string[] }> = {};

    if (assignData && assignData.length > 0) {
      for (const assignment of assignData) {
        const { data: teammatesData } = await supabase
          .from("homework_team_assignments")
          .select("user_id, profiles(name)")
          .eq("homework_id", assignment.homework_id)
          .eq("team_name", assignment.team_name);

        if (teammatesData) {
          assignmentsMap[assignment.homework_id] = {
            teamName: assignment.team_name,
            teammates: (teammatesData as unknown as { user_id: string; profiles: { name: string } | null }[])
              .filter((t) => t.user_id !== user.id)
              .map((t) => t.profiles?.name || "Unknown"),
          };
        }
      }
    }

    setHomeworks((hwData || []) as unknown as Homework[]);
    setMyAssignments(assignmentsMap);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [fetchData]);


  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#16140f]">Homework</h1>
        <p className="text-[#6b6b5e]">관리자가 부여한 과제를 확인하고 수행하세요.</p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6C0F] border-t-transparent" />
          </div>
        ) : homeworks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-[#d9d9cc] bg-white p-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-[#f5f5ee]">
              <span role="img" aria-label="책" className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-bold text-[#16140f]">등록된 과제가 없습니다</h3>
            <p className="mt-2 text-sm text-[#6b6b5e]">새로운 과제가 등록되면 여기에 표시됩니다.</p>
          </div>
        ) : (
          homeworks.map((hw) => {
            const myTeam = myAssignments[hw.id];
            
            return (
              <div key={hw.id} className="group overflow-hidden rounded-lg border border-[#d9d9cc] bg-white transition-all hover:border-[#FF6C0F] hover:shadow-lg">
                <div className="flex flex-wrap items-center justify-between px-8 py-5 gap-4">
                  <div className="flex items-center gap-5">
                    <span role="img" aria-label="책" className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f5f5ee] text-2xl transition-transform group-hover:scale-110">📖</span>
                    <div>
                      <h3 className="text-lg font-black text-[#16140f]">{hw.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {hw.is_individual && (
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ring-1 ring-blue-100 italic">Individual</span>
                        )}
                        {hw.is_team && (
                          <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full ring-1 ring-purple-100 italic">Team</span>
                        )}
                        {hw.due_date && (() => {
                          const now = new Date();
                          const due = new Date(hw.due_date);
                          if (due.getTime() < now.getTime()) {
                            return (
                              <span className="rounded-full bg-[#FEE2E2] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318]">
                                마감
                              </span>
                            );
                          }
                          const diffMs = due.getTime() - now.getTime();
                          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                          return (
                            <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                              D-{diffDays}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-[#a1a196] uppercase tracking-tighter italic">Distributed On</p>
                      <p className="text-xs font-black text-[#6b6b5e]">
                        {new Date(hw.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingId(viewingId === hw.id ? null : hw.id)}
                      className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                        viewingId === hw.id 
                        ? "bg-[#16140f] text-white" 
                        : "bg-[#f5f5ee] text-[#16140f] hover:bg-[#16140f] hover:text-white"
                      }`}
                    >
                      {viewingId === hw.id ? "닫기 (Close)" : "열람하기 (Open)"}
                    </button>
                  </div>
                </div>
                
                {/* Detail Area */}
                {viewingId === hw.id && (
                  <div className="border-t border-[#f0efe6] bg-[#fcfcfb] p-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 space-y-8">
                        {/* Individual Tasks */}
                        {hw.is_individual && (
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest italic">
                              <span role="img" aria-label="개인">👤</span> 개인 과제 목록 (Individual Tasks)
                            </h4>
                            <div className="space-y-3">
                              {hw.individual_content && hw.individual_content.length > 0 ? (
                                hw.individual_content.map((task, idx) => (
                                  <div key={`indiv-task-${hw.id}-${idx}`} className="rounded-lg bg-white p-5 border border-blue-50 shadow-sm text-sm text-[#4a4a40] leading-relaxed relative overflow-hidden group/task">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-100 group-hover/task:bg-blue-400 transition-colors" />
                                    <span className="font-black text-blue-400 mr-2 italic">#{idx + 1}</span> {task}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-[#a1a196] italic p-4 bg-white rounded-lg border border-dashed">등록된 개인 과제가 없습니다.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Team Tasks */}
                        {hw.is_team && (
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase tracking-widest italic">
                              <span role="img" aria-label="팀">👥</span> 팀 협동 과제 목록 (Team Tasks)
                            </h4>
                            <div className="space-y-3">
                              {hw.team_content && hw.team_content.length > 0 ? (
                                hw.team_content.map((task, idx) => (
                                  <div key={`team-task-${hw.id}-${idx}`} className="rounded-lg bg-white p-5 border border-purple-50 shadow-sm text-sm text-[#4a4a40] leading-relaxed relative overflow-hidden group/task">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-100 group-hover/task:bg-purple-400 transition-colors" />
                                    <span className="font-black text-purple-400 mr-2 italic">#{idx + 1}</span> {task}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-[#a1a196] italic p-4 bg-white rounded-lg border border-dashed">등록된 팀 과제가 없습니다.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="lg:col-span-4 space-y-6">
                        {hw.is_team && (
                          <div className="rounded-lg border-2 border-[#f0efe6] bg-white p-6 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#a1a196] mb-4 flex items-center gap-2 italic">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6C0F]" /> My Team Info
                            </h4>
                            {myTeam ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-[#a1a196] uppercase italic">Team Name</label>
                                  <p className="text-lg font-black text-[#FF6C0F]">{myTeam.teamName}</p>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-[#a1a196] uppercase italic">Teammates</label>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {myTeam.teammates.length > 0 ? (
                                      myTeam.teammates.map((name, mIdx) => (
                                        <span key={`teammate-${hw.id}-${mIdx}`} className="text-[10px] font-bold bg-[#f5f5ee] text-[#16140f] px-3 py-1 rounded-lg border border-[#d9d9cc]">
                                          {name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-[#a1a196] italic">함께하는 팀원이 없습니다.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6 text-center">
                                <span role="img" aria-label="악수" className="text-2xl mb-2 grayscale opacity-30">🤝</span>
                                <p className="text-[11px] font-bold text-[#a1a196] italic">배정된 팀 정보가<br/>존재하지 않습니다.</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="rounded-lg border-2 border-dashed border-[#d9d9cc] p-6 flex flex-col items-center justify-center gap-4 text-center">
                          <div className="h-12 w-12 rounded-full bg-[#FF6C0F]/10 flex items-center justify-center">
                            <span role="img" aria-label="로켓" className="text-xl">🚀</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#16140f]">과제를 완료하셨나요?</p>
                            <p className="text-[11px] font-medium text-[#6b6b5e] mt-1">결과물을 정리하여 제출해 주세요.</p>
                          </div>
                          <button 
                            onClick={() => {
                              if (hw.submission_link) {
                                window.open(hw.submission_link, '_blank');
                              } else {
                                alert("관리자가 등록한 제출 링크가 없습니다.");
                              }
                            }}
                            className="w-full rounded-xl bg-[#16140f] py-3 text-xs font-black text-white shadow-xl shadow-gray-100 hover:scale-105 active:scale-95 transition-all"
                          >
                            과제 제출하기 (Submit)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
