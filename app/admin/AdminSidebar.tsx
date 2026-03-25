"use client";

import { DesktopAdminNav } from "./AdminNav";
import { ADMIN_NAV_ITEMS } from "./nav-items";

export function AdminSidebar() {
  return (
    <div className="flex flex-col">
      <div className="mb-5 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6b5e]">SPEC</p>
        <h1 className="text-sm font-semibold text-[#16140f]">관리자 센터</h1>
        <div className="mt-4 border-b border-[#f0efe6]" />
      </div>

      <DesktopAdminNav items={ADMIN_NAV_ITEMS} />
    </div>
  );
}
