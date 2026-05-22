"use client";

import { useState, useTransition } from "react";
import { Lightbulb, BookOpen, Trash2, X, Loader2, Paperclip } from "lucide-react";
import { deleteIdea } from "@/lib/actions/ideas";

type Profile = {
  name: string;
  first_name: string | null;
  last_name: string | null;
};

type Idea = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  pdf_url?: string | null;
  target_customer: string | null;
  competitors: string | null;
  market_size: string | null;
  team_members: string | null;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
};

type Props = {
  ideas: Idea[];
};

export function IdeasClient({ ideas }: Props) {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (ideaId: string) => {
    if (!window.confirm("정말로 이 아이디어를 삭제하시겠습니까?")) {
      return;
    }

    setDeleteError(null);
    setDeletingId(ideaId);

    startTransition(async () => {
      const result = await deleteIdea(ideaId);
      if (result.error) {
        setDeleteError(result.error);
        setDeletingId(null);
      } else {
        setSelectedIdea(null);
        setDeletingId(null);
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const getAuthorName = (idea: Idea) => {
    if (!idea.profiles) return "알 수 없음";
    const { first_name, last_name, name } = idea.profiles;
    if (first_name && last_name) {
      return `${last_name}${first_name}`;
    }
    return name;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f] font-['Pretendard',sans-serif]">
          아이디어 관리
        </h1>
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
          학회원들이 제출한 다양한 비즈니스 아이디어를 열람하고 관리합니다.
        </p>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-[#b42318]/20 bg-[#fdecec] p-4 text-sm text-[#b42318] font-['Pretendard',sans-serif]">
          {deleteError}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#f0efe6]">
            <tr>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-32">제출일</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-32">제출자</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">아이디어명</th>
              <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] w-48 text-right">상세 및 관리</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => {
              const isDeleting = deletingId === idea.id && isPending;

              return (
                <tr key={idea.id} className="border-t border-[#ece8db] hover:bg-[#fcfcf8] transition-colors">
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    {formatDate(idea.created_at)}
                  </td>
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40] font-medium">
                    {getAuthorName(idea)}
                  </td>
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#16140f] font-semibold truncate max-w-[200px] sm:max-w-xs">
                    {idea.title}
                  </td>
                  <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-right space-x-2 shrink-0">
                    <button
                      onClick={() => setSelectedIdea(idea)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] bg-white px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f] transition-colors hover:bg-gray-50"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      열람
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      disabled={isDeleting}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#ddd9cc] bg-white px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fdecec]/50 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
            {ideas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#6b6b5e] font-['Pretendard',sans-serif]">
                  등록된 아이디어가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#f0efe6] bg-[#fcfcf8] px-6 py-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[#FF6C0F]" />
                <h2 className="font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f]">아이디어 상세 정보</h2>
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-[#6b6b5e]" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="mb-1 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">아이디어명</h3>
                <p className="font-['Pretendard',sans-serif] text-base font-bold text-[#16140f]">{selectedIdea.title}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">제출자</h3>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{getAuthorName(selectedIdea)}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">제출일시</h3>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                    {new Date(selectedIdea.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#f0efe6] pt-4">
                <h3 className="mb-1.5 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">해결하려는 문제 및 솔루션 설명</h3>
                <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-4 whitespace-pre-wrap font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">
                  {selectedIdea.description}
                </div>
              </div>

              {selectedIdea.target_customer && (
                <div className="border-t border-[#f0efe6] pt-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">타깃 고객</h3>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">{selectedIdea.target_customer}</p>
                </div>
              )}

              {selectedIdea.competitors && (
                <div className="border-t border-[#f0efe6] pt-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">경쟁사 분석 및 차별점</h3>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">{selectedIdea.competitors}</p>
                </div>
              )}

              {selectedIdea.market_size && (
                <div className="border-t border-[#f0efe6] pt-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">예상 시장 규모</h3>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">{selectedIdea.market_size}</p>
                </div>
              )}

              {selectedIdea.team_members && (
                <div className="border-t border-[#f0efe6] pt-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">참여 팀원 및 구하는 파트너 정보</h3>
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40] leading-relaxed">{selectedIdea.team_members}</p>
                </div>
              )}

              {selectedIdea.pdf_url && (
                <div className="border-t border-[#f0efe6] pt-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-[#6b6b5e] font-['Pretendard',sans-serif] uppercase tracking-wide">첨부 파일 (PDF)</h3>
                  <div>
                    <a
                      href={selectedIdea.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#ddd9cc] bg-white px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-[#FF6C0F]" />
                      첨부파일 다운로드 / 보기
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#f0efe6] p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <button
                  onClick={() => handleDelete(selectedIdea.id)}
                  disabled={isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#ddd9cc] bg-white px-4 font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] hover:bg-[#fdecec]/50 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  아이디어 삭제
                </button>
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="h-9 rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:opacity-90"
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
