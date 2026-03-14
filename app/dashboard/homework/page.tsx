import { requireRole } from "@/lib/auth";

export default async function HomeworkPage() {
  await requireRole("runner");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#16140f]">Homework</h1>
        <p className="text-[#6b6b5e]">과제 관리 대시보드입니다.</p>
      </div>
      
      <div className="rounded-xl border border-[#d9d9cc] bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5ee]">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="text-lg font-semibold text-[#16140f]">준비 중입니다</h3>
        <p className="mt-1 text-sm text-[#6b6b5e]">과제 제출 및 검토 기능이 곧 업데이트될 예정입니다.</p>
      </div>
    </div>
  );
}
