import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileDashboardNav } from "./DashboardNav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = await requireRole("learner");

  if (profile?.role !== "learner") {
    redirect("/admin/attendance");
  }

  return (
    <div className="min-h-screen bg-[#f5f5ee] text-[#16140f] [font-family:Pretendard,system-ui,sans-serif]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Desktop Sidebar */}
        <aside className="hidden w-[240px] shrink-0 self-start py-10 pl-8 lg:block lg:pl-10">
          <div className="sticky top-[100px] overflow-y-auto rounded-lg border border-[#ddd9cc] bg-white p-5" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <DashboardSidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile Header/Nav */}
          <div className="flex flex-col lg:hidden">
            <div className="flex items-center justify-between border-b border-[#ddd9cc] bg-white px-5 py-3">
              <h1 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">대시보드</h1>
              <Link
                href="/"
                className="flex items-center gap-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] transition-colors hover:text-[#16140f]"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                사이트로
              </Link>
            </div>
            <MobileDashboardNav />
          </div>

          <main className="flex-1 px-5 py-6 pb-20 sm:px-8 sm:py-10 lg:px-10 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
