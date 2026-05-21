import type { Metadata } from "next";
import { getIdeas } from "@/lib/actions/ideas";
import { requireAdmin } from "@/lib/auth";
import { IdeasClient } from "./IdeasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "아이디어 관리 | SPEC Admin",
};

export default async function AdminIdeasPage() {
  const [ideasResult, authResult] = await Promise.all([
    getIdeas(),
    requireAdmin(),
  ]);

  if (!ideasResult.success) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-[#ddd9cc] bg-white text-sm text-[#b42318] font-['Pretendard',sans-serif]">
        {ideasResult.error}
      </div>
    );
  }

  const ideas = ideasResult.data || [];

  return (
    <section className="space-y-8 pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <IdeasClient ideas={ideas} />
      </div>
    </section>
  );
}
