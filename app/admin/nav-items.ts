import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  Settings,
  FileText,
  Tag,
  BookOpen,
  CalendarDays,
  Cog,
  FormInput,
  GraduationCap,
  HelpCircle,
  Handshake,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "primary" | "content" | "operations" | "system";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroup;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  /* ── Primary (하단 탭바) ──────────────────────── */
  { label: "대시보드", href: "/admin", icon: LayoutDashboard, group: "primary" },
  { label: "멤버 관리", href: "/admin/members", icon: Users, group: "primary" },
  { label: "지원서", href: "/admin/applications", icon: ClipboardList, group: "primary" },
  { label: "출석", href: "/admin/attendance", icon: CalendarDays, group: "primary" },

  /* ── Content (더보기 시트 — 콘텐츠) ───────────── */
  { label: "게시물", href: "/admin/posts", icon: FileText, group: "content" },
  { label: "태그 관리", href: "/admin/tags", icon: Tag, group: "content" },
  { label: "과제", href: "/admin/homework", icon: BookOpen, group: "content" },
  { label: "커리큘럼", href: "/admin/curriculum", icon: GraduationCap, group: "content" },
  { label: "SPEC 로그", href: "/admin/spec-log", icon: ScrollText, group: "content" },

  /* ── Operations (더보기 시트 — 운영) ──────────── */
  { label: "폼 빌더", href: "/admin/form-builder", icon: FormInput, group: "operations" },
  { label: "FAQ", href: "/admin/faq", icon: HelpCircle, group: "operations" },
  { label: "파트너", href: "/admin/partners", icon: Handshake, group: "operations" },

  /* ── System (더보기 시트 — 시스템) ─────────────── */
  { label: "사용자 계정", href: "/admin/users", icon: UserCog, group: "system" },
  { label: "모집 설정", href: "/admin/recruitment", icon: Settings, group: "system" },
  { label: "설정", href: "/admin/settings", icon: Cog, group: "system" },
  { label: "감사 로그", href: "/admin/audit", icon: ShieldCheck, group: "system" },
];

export const PRIMARY_NAV_ITEMS = ADMIN_NAV_ITEMS.filter(
  (item) => item.group === "primary",
);

export const SHEET_NAV_ITEMS = ADMIN_NAV_ITEMS.filter(
  (item) => item.group !== "primary",
);

export function getNavItemsByGroup(group: NavGroup): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => item.group === group);
}

export const NAV_GROUP_BREAKS = new Set([
  "/admin/posts",
  "/admin/form-builder",
  "/admin/users",
]);
