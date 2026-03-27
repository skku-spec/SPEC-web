"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { PRIMARY_NAV_ITEMS, SHEET_NAV_ITEMS } from "./nav-items";
import AdminMoreSheet from "./AdminMoreSheet";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function PendingDot() {
  return (
    <span
      className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-80"
      aria-hidden="true"
    />
  );
}

export default function AdminBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPendingHref(null);
  }

  useEffect(() => {
    PRIMARY_NAV_ITEMS.forEach((item) => router.prefetch(item.href));
  }, [router]);

  const activePath = useMemo(() => pendingHref ?? pathname, [pathname, pendingHref]);

  const isMoreActive = useMemo(
    () => SHEET_NAV_ITEMS.some((item) => isActivePath(pathname, item.href)),
    [pathname],
  );

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const handleToggleSheet = useCallback(() => {
    setIsSheetOpen((prev) => !prev);
  }, []);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ddd9cc] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="모바일 관리자 탐색"
      >
        <div className="flex items-center justify-around">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const active = isActivePath(activePath, item.href);
            const pending = pendingHref === item.href && pathname !== item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  if (isModifiedEvent(event)) return;
                  setPendingHref(item.href);
                  setIsSheetOpen(false);
                }}
                className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 ${
                  active ? "text-[#FF6C0F]" : "text-[#6b6b5e]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="font-['Pretendard',sans-serif] text-xs">
                  {item.label}
                </span>
                {pending ? <PendingDot /> : null}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleToggleSheet}
            className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 ${
              isMoreActive || isSheetOpen ? "text-[#FF6C0F]" : "text-[#6b6b5e]"
            }`}
            aria-expanded={isSheetOpen}
            aria-haspopup="dialog"
          >
            <MoreHorizontal
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={isMoreActive || isSheetOpen ? 2.5 : 2}
            />
            <span className="font-['Pretendard',sans-serif] text-xs">
              더보기
            </span>
          </button>
        </div>
      </nav>

      <AdminMoreSheet open={isSheetOpen} onClose={handleCloseSheet} />
    </>
  );
}
