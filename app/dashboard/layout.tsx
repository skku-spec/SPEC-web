import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireRole("runner");

  return (
    <div className="min-h-screen bg-[#f5f5ee] text-[#16140f] [font-family:Pretendard,system-ui,sans-serif]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-[240px] shrink-0 self-start py-10 pl-8 lg:block lg:pl-10">
          <div className="sticky top-[100px] overflow-y-auto rounded-lg border border-[#d9d9cc] bg-white p-5" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="mb-5 px-1">
  <div className="flex items-center gap-2">
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#16140f]">
      <span className="text-xs font-bold text-white">S</span>
    </div>
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6b5e]">SPEC</p>
      <h1 className="text-sm font-semibold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">Dashboard</h1>
    </div>
  </div>
  <div className="mt-4 border-b border-[#f0efe6]" />
</div>
            <nav className="flex flex-col gap-1">
<Link
  href="/dashboard/applications"
  className="flex items-center gap-2.5 rounded-lg bg-[#FFF0E5] px-3 py-2.5 text-sm font-medium text-[#FF6C0F] transition-colors"
>
  <span className="text-base">📋</span>
  <span>모집 지원서</span>
</Link>
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
<div className="flex items-center gap-3 border-b border-[#d9d9cc] bg-white px-5 py-3 lg:hidden">
  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#16140f]">
    <span className="text-[10px] font-bold text-white">S</span>
  </div>
  <div className="flex items-center gap-2">
    <h1 className="text-sm font-semibold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">Dashboard</h1>
    <span className="text-[#d9d9cc]">·</span>
    <Link href="/dashboard/applications" className="text-sm font-medium text-[#FF6C0F]">
      모집 지원서
    </Link>
  </div>
</div>

          <main className="flex-1 px-5 py-6 sm:px-8 sm:py-10 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
