"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { DASHBOARD_NAV_ITEMS, isActivePath, type DashboardNavItem } from "./nav-items";

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function PendingDot() {
  return <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-current opacity-80" aria-hidden="true" />;
}

type DesktopDashboardNavProps = {
  items: DashboardNavItem[];
};

export function DesktopDashboardNav({ items }: DesktopDashboardNavProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPendingHref(null);
  }

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
            prefetch={false}
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

export function MobileDashboardNav() {
  const items = DASHBOARD_NAV_ITEMS;
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const [prevMobilePath, setPrevMobilePath] = useState(pathname);
  if (prevMobilePath !== pathname) {
    setPrevMobilePath(pathname);
    setPendingHref(null);
  }

  const activePath = useMemo(() => pendingHref ?? pathname, [pathname, pendingHref]);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto p-4 border-b border-[#ddd9cc] bg-white lg:hidden">
      {items.map((item) => {
        const active = isActivePath(activePath, item.href);
        const pending = pendingHref === item.href && pathname !== item.href;
        const Icon = item.icon;

        return (
          <div key={item.href} className="flex shrink-0 items-center">
            <Link
              href={item.href}
              prefetch={false}
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
          </div>
        );
      })}
    </nav>
  );
}
