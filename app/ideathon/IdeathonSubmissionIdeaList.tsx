import { PenLine, PlusCircle } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type IdeathonIdea = Database["public"]["Tables"]["ideathon_ideas"]["Row"];

type IdeathonSubmissionIdeaListProps = {
  ideas: readonly IdeathonIdea[];
  isLoadingIdeas: boolean;
  onSelectIdea: (idea: IdeathonIdea) => void;
  onNewIdea: () => void;
};

export default function IdeathonSubmissionIdeaList({
  ideas,
  isLoadingIdeas,
  onSelectIdea,
  onNewIdea,
}: IdeathonSubmissionIdeaListProps) {
  return (
    <div className="rounded-lg border border-[#ddd9cc] bg-[#fcfcf8] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">내 아이디어</h3>
        <button
          type="button"
          onClick={onNewIdea}
          className="inline-flex items-center gap-1 rounded-md border border-[#ddd9cc] px-3 h-8 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f] hover:bg-[#fcfcf8]"
        >
          <PlusCircle className="h-4 w-4 text-[#FF6C0F]" />
          새 아이디어로 새로 제출
        </button>
      </div>

      {isLoadingIdeas ? (
        <p className="mt-3 text-xs font-['Pretendard',sans-serif] text-[#6b6b5e]">아이디어 조회 중...</p>
      ) : ideas.length === 0 ? (
        <p className="mt-3 text-xs font-['Pretendard',sans-serif] text-[#6b6b5e]">아직 제출한 아이디어가 없습니다.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-lg border border-[#ddd9cc] bg-white px-4 py-3">
              <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                {idea.title}
              </p>
              <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{idea.description}</p>
              <button
                type="button"
                onClick={() => onSelectIdea(idea)}
                className="mt-3 inline-flex items-center gap-1 rounded-md border border-[#ddd9cc] bg-white px-3 h-8 font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
              >
                <PenLine className="h-4 w-4 text-[#FF6C0F]" />
                {idea.title} 수정
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
