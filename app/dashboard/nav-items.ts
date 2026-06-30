import {
  CalendarCheck,
  LayoutDashboard,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "출석 체크", href: "/dashboard/attendance", icon: CalendarCheck },
  { label: "과제 제출", href: "/dashboard/homework", icon: BookOpen },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(href);
}
