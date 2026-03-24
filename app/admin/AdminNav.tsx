"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  Settings,
  FileText,
  BookOpen,
  CalendarDays,
  Briefcase,
  Rocket,
  Library,
  Cog,
  FormInput,
  GraduationCap,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: AdminNavItem[] = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "멤버 관리", href: "/admin/members", icon: Users },
  { label: "사용자 계정", href: "/admin/users", icon: UserCog },
  { label: "지원서", href: "/admin/applications", icon: ClipboardList },
  { label: "모집 설정", href: "/admin/recruitment", icon: Settings },
  { label: "게시물", href: "/admin/posts", icon: FileText },
  { label: "과제", href: "/admin/homework", icon: BookOpen },
  { label: "출석", href: "/admin/attendance", icon: CalendarDays },
  { label: "폼 빌더", href: "/admin/form-builder", icon: FormInput },
  { label: "커리큘럼", href: "/admin/curriculum", icon: GraduationCap },
  { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
  { label: "채용", href: "/admin/jobs", icon: Briefcase },
  { label: "런칭", href: "/admin/launches", icon: Rocket },
  { label: "자료실", href: "/admin/library", icon: Library },
  { label: "설정", href: "/admin/settings", icon: Cog },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function PendingDot() {
  return <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-current opacity-80" aria-hidden="true" />;
}

type DesktopAdminNavProps = {
  items: AdminNavItem[];
};

export function DesktopAdminNav({ items }: DesktopAdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    items.forEach((item) => router.prefetch(item.href));
  }, [items, router]);

  const activePath = useMemo(() => pendingHref ?? pathname, [pathname, pendingHref]);

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active = isActivePath(activePath, item.href);
        const pending = pendingHref === item.href && pathname !== item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(event) => {
              if (isModifiedEvent(event)) {
                return;
              }

              setPendingHref(item.href);
            }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-[#FFF0E5] font-semibold text-[#FF6C0F]"
                : "text-[#4a4a40] hover:bg-[#f0efe6]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span>{item.label}</span>
            {pending ? <PendingDot /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileAdminNav() {
  const items = NAV_ITEMS;
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    items.forEach((item) => router.prefetch(item.href));
  }, [items, router]);

  const activePath = useMemo(() => pendingHref ?? pathname, [pathname, pendingHref]);

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto">
      {items.map((item) => {
        const active = isActivePath(activePath, item.href);
        const pending = pendingHref === item.href && pathname !== item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(event) => {
              if (isModifiedEvent(event)) {
                return;
              }

              setPendingHref(item.href);
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-[#FFF0E5] text-[#FF6C0F]"
                : "text-[#4a4a40] hover:bg-[#f0efe6]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span>{item.label}</span>
            {pending ? <PendingDot /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
