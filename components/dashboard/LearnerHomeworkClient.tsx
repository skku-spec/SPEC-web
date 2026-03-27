"use client"

import { useState } from "react";
import { CheckCircle2, Circle, ExternalLink, Loader2, BookOpen, X } from "lucide-react";
import { toggleHomeworkSubmission } from "@/lib/actions/tracker";

type Homework = {
  id: string;
  title: string;
  is_individual: boolean;
  is_team: boolean;
  padlet_board_id?: string | null;
  submission_link?: string | null;
  individual_content?: any;
  team_content?: any;
}

type Submission = {
  homework_id: string;
  user_id: string;
  status: string;
}

type Props = {
  homeworks: Homework[];
  submissions: Submission[];
  currentUserName: string;
  currentUserUsername: string;
}

export function LearnerHomeworkClient({
  homeworks,
  submissions,
  currentUserName,
  currentUserUsername,
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const normalize = (val: string) => val.replace(/\s+/g, "").toLowerCase();

  const handleSyncPadlet = async (hw: Homework) => {
    // 1. Open Padlet in a new tab if submission link exists
    if (hw.padlet_board_id || hw.submission_link) {
      const url = hw.padlet_board_id 
        ? `https://padlet.com/boards/${hw.padlet_board_id}` 
        : hw.submission_link!;
      window.open(url, '_blank');
    }

    // 2. Start Sync Loading
    setLoadingId(hw.id);
    try {
      if (!hw.padlet_board_id) {
        // Fallback to manual toggle if no Padlet is configured
        const isCompleted = submissions.some(s => s.homework_id === hw.id && s.status === 'completed');
        await toggleHomeworkSubmission(hw.id, !isCompleted);
        return;
      }

      // 3. Fetch Padlet data from API
      const res = await fetch(`/api/padlet/board?board_id=${hw.padlet_board_id}`);
      if (!res.ok) return; // Silent fail on API error
      
      const { posts } = await res.json() as { posts: any[] };
      const normalizedCurrentName = normalize(currentUserName);
      const normalizedCurrentUsername = normalize(currentUserUsername).replace(/^@/, '');

      const matchFound = posts.some(p => {
        const authorName = normalize(p.author?.name || "");
        const authorUsername = normalize(p.author?.username || "").replace(/^@/, '');
        
        return (authorName.includes(normalizedCurrentName) || normalizedCurrentName.includes(authorName)) || 
               (authorUsername && authorUsername === normalizedCurrentUsername && authorUsername !== "");
      });

      if (matchFound) {
        const result = await toggleHomeworkSubmission(hw.id, true);
        if (!result.success) {
          // You might still want to see DB errors, but user said "do nothing" if not submitted.
          // Since "matchFound" is true, it *should* proceed.
        }
      }
    } catch (err: unknown) {
      // Silent catch
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleOff = async (hwId: string) => {
    setLoadingId(hwId);
    try {
      await toggleHomeworkSubmission(hwId, false);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
          과제 제출
        </h1>
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
          이번 주차 과제를 확인하고 Padlet에 과제를 올린 뒤 '제출 확인' 버튼을 눌러주세요.
        </p>
      </div>

      <div className="grid gap-4">
        {homeworks.map((hw) => {
          const isCompleted = submissions.some(s => s.homework_id === hw.id && s.status === 'completed');
          const isLoading = loadingId === hw.id;

          return (
            <div 
              key={hw.id}
              className={`group relative overflow-hidden rounded-lg border transition-all ${
                isCompleted 
                  ? "border-[#E6F9E6] bg-[#fcfdfc]" 
                  : "border-[#ddd9cc] bg-white hover:border-[#FF6C0F]/30"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {hw.is_individual && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#4a4a40]">
                        개인 과제
                      </span>
                    )}
                    {hw.is_team && (
                      <span className="rounded-full bg-[#E8F0FE] px-2 py-0.5 font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#2563EB]">
                        팀 과제
                      </span>
                    )}
                  </div>
                  <h3 className={`truncate font-['Pretendard',sans-serif] text-base font-semibold ${
                    isCompleted ? "text-[#2f9e44]" : "text-[#16140f]"
                  }`}>
                    {hw.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Detailed View Button */}
                  <button
                    onClick={() => setSelectedHomework(hw)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#ddd9cc] bg-white px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-gray-50"
                  >
                    <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                    열람하기
                  </button>

                  {/* Submission Status Check */}
                  {isCompleted ? (
                    <button
                      onClick={() => handleToggleOff(hw.id)}
                      disabled={isLoading}
                      className="flex h-9 min-w-[100px] items-center justify-center gap-2 rounded-md bg-[#2f9e44] px-4 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-all hover:bg-[#2f9e44]/90 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                          제출 완료
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSyncPadlet(hw)}
                      disabled={isLoading}
                      className="flex h-9 min-w-[100px] items-center justify-center gap-2 rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-all hover:bg-[#16140f]/90 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5" strokeWidth={2.5} />
                          제출하기
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Success background effect */}
              {isCompleted && (
                <div className="absolute right-0 top-0 h-full w-1.5 bg-[#2f9e44]" />
              )}
            </div>
          );
        })}

        {homeworks.length === 0 && (
          <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-[#ddd9cc] bg-gray-50/50">
            <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">현재 등록된 과제가 없습니다.</p>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white border border-[#ddd9cc] p-6 space-y-4">
        <h4 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">제출 시 유의사항</h4>
        <ul className="list-disc pl-5 space-y-1.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] leading-relaxed">
          <li>'제출하기' 버튼을 누르면 과제 제출 페이지(Padlet 등)가 열리며, 동시에 제출 여부를 자동으로 확인합니다.</li>
          <li>Padlet의 작성자 이름 또는 프로필 이름이 회원님의 성함(LastNameFirstName)과 일치해야 자동으로 '제출 완료' 처리됩니다.</li>
          <li>게시물을 올린 직후에는 확인이 되지 않을 수 있으니, 잠시 후 다시 '제출하기'를 눌러주세요.</li>
          <li>잘못 제출했거나 상태를 초기화하고 싶은 경우 '제출 완료' 버튼을 다시 눌러 취소할 수 있습니다.</li>
        </ul>
      </div>

      {/* Detail Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#f0efe6] bg-[#fcfcf8] px-6 py-4">
              <h2 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f]">과제 상세 정보</h2>
              <button 
                onClick={() => setSelectedHomework(null)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-[#6b6b5e]" />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">과제 제목</h3>
                <p className="font-['Pretendard',sans-serif] text-base text-[#4a4a40]">{selectedHomework.title}</p>
              </div>

              {selectedHomework.is_individual && selectedHomework.individual_content && (
                <div>
                  <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">개인 과제 내용</h3>
                  <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-4">
                    <ul className="space-y-2">
                      {(selectedHomework.individual_content as string[]).map((task, idx) => (
                        <li key={idx} className="flex gap-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                          <span className="text-[#FF6C0F]">•</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedHomework.is_team && selectedHomework.team_content && (
                <div>
                  <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">팀 과제 내용</h3>
                  <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-4">
                    <ul className="space-y-2">
                      {(selectedHomework.team_content as string[]).map((task, idx) => (
                        <li key={idx} className="flex gap-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                          <span className="text-[#2563EB]">•</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {(selectedHomework.padlet_board_id || selectedHomework.submission_link) && (
                <div className="pt-2">
                  <h3 className="mb-2 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">제출 링크</h3>
                  <a
                    href={selectedHomework.padlet_board_id ? `https://padlet.com/boards/${selectedHomework.padlet_board_id}` : selectedHomework.submission_link!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#ddd9cc] bg-white py-2.5 font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f] hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    과제 페이지 열기
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-[#f0efe6] p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedHomework(null)}
                className="h-9 rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
