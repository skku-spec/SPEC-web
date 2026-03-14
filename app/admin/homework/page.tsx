import { requireRole } from "@/lib/auth";

export default async function AdminHomeworkPage() {
  await requireRole("admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#16140f]">Homework Management</h1>
          <p className="text-[#6b6b5e]">사용자들의 과제 제출 현황을 관리하고 검토합니다.</p>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6C0F] text-white shadow-lg shadow-orange-200 transition-all hover:scale-110 hover:bg-[#e55d00] active:scale-95">
          <span className="text-2xl font-light leading-none">+</span>
        </button>
      </div>
      
      <div className="rounded-xl border border-[#d9d9cc] bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5ee]">
          <span className="text-3xl">📖</span>
        </div>
        <h3 className="text-lg font-semibold text-[#16140f]">데이터가 없습니다</h3>
        <p className="mt-1 text-sm text-[#6b6b5e]">과제 관리 시스템 기능이 곧 구현될 예정입니다.</p>
      </div>
    </div>
  );
}
