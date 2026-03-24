"use client";

import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  FileText,
  BookOpen,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

import { DesktopAdminNav } from "./AdminNav";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "멤버", href: "/admin/users", icon: Users },
  { label: "지원서", href: "/admin/applications", icon: ClipboardList },
  { label: "모집 설정", href: "/admin/recruitment", icon: Settings },
  { label: "게시물", href: "/admin/posts", icon: FileText },
  { label: "과제", href: "/admin/homework", icon: BookOpen },
  { label: "출석", href: "/admin/attendance", icon: CalendarDays },
];

export function AdminSidebar() {
  return (
    <div className="flex flex-col">
      <div className="mb-5 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6b5e]">SPEC</p>
        <h1 className="text-sm font-semibold text-[#16140f]">관리자 센터</h1>
        <div className="mt-4 border-b border-[#f0efe6]" />
      </div>

      <DesktopAdminNav items={NAV_ITEMS} />
    </div>
  );
}
