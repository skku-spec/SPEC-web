"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Users", href: "/admin/users", icon: "👥" },
  { label: "Applications", href: "/admin/applications", icon: "📋" },
  { label: "Posts", href: "/admin/posts", icon: "📝" },
  { label: "Homework", href: "/admin/homework", icon: "📖" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col">
      <div className="mb-5 px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#16140f]">
            <span className="text-xs font-bold text-white">S</span>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6b5e]">SPEC</p>
            <h1 className="text-sm font-semibold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">Admin Panel</h1>
          </div>
        </div>
        <div className="mt-4 border-b border-[#f0efe6]" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[#FFF0E5] font-semibold text-[#FF6C0F]"
                  : "text-[#4a4a40] hover:bg-[#f0efe6]"
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
