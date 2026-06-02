import { CheckCircle2 } from "lucide-react";

type IdeathonSubmissionFeedbackProps = {
  mode: "create" | "update";
  title: string;
  onReset: () => void;
};

export default function IdeathonSubmissionFeedback({
  mode,
  title,
  onReset,
}: IdeathonSubmissionFeedbackProps) {
  if (mode === "update") {
    return (
      <div className="flex flex-col items-center text-center py-6 space-y-6">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#E6F9E6] text-[#2f9e44]">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h3 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f]">수정 완료</h3>
          <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">{title}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#ddd9cc] bg-white px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
        >
          새 아이디어로 제출
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-6 space-y-6">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#E6F9E6] text-[#2f9e44]">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h3 className="font-['Pretendard',sans-serif] text-xl font-semibold text-[#16140f]">
          아이디어가 성공적으로 등록되었습니다!
        </h3>
        <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">제목: {title}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-10 items-center justify-center rounded-md border border-[#ddd9cc] bg-white px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
      >
        추가 제출하기
      </button>
    </div>
  );
}
