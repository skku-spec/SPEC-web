"use client";

import { DesktopDashboardNav } from "./DashboardNav";
import { DASHBOARD_NAV_ITEMS } from "./nav-items";

export function DashboardSidebar() {
  return (
    <div className="flex flex-col">
      <div className="mb-5 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6b5e]">SPEC</p>
        <h1 className="text-sm font-semibold text-[#16140f]">대시보드</h1>
        <div className="mt-4 border-b border-[#f0efe6]" />
      </div>

      <DesktopDashboardNav items={DASHBOARD_NAV_ITEMS} />
    </div>
  );
}
