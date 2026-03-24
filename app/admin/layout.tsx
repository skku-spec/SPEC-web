import type { ReactNode } from "react";

import Link from "next/link";

import { requireRole } from "@/lib/auth";

import { AdminSidebar } from "./AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireRole("preneur");

  return (
    <div className="min-h-screen bg-[#f5f5ee] text-[#16140f] [font-family:Pretendard,system-ui,sans-serif]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden w-[240px] shrink-0 self-start py-10 pl-8 lg:block lg:pl-10">
          <div className="sticky top-[100px] overflow-y-auto rounded-lg border border-[#d9d9cc] bg-white p-5" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <AdminSidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header — shown on mobile only */}
          <div className="flex items-center gap-3 border-b border-[#ddd9cc] bg-white px-5 py-3 lg:hidden">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#16140f]">
              <span className="text-[10px] font-bold text-white">S</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">Admin</h1>
              <span className="text-[#ddd9cc]">·</span>
            </div>
            <nav className="flex items-center gap-1.5 overflow-x-auto">
              <Link href="/admin" className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40] hover:bg-[#f0efe6]">📊 Dashboard</Link>
              <Link href="/admin/users" className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40] hover:bg-[#f0efe6]">👥 Users</Link>
              <Link href="/admin/applications" className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40] hover:bg-[#f0efe6]">📋 Applications</Link>
              <Link href="/admin/posts" className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40] hover:bg-[#f0efe6]">📝 Posts</Link>
              <Link href="/admin/homework" className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40] hover:bg-[#f0efe6]">📖 Homework</Link>
            </nav>
          </div>

          <main className="flex-1 px-5 py-6 sm:px-8 sm:py-10 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
