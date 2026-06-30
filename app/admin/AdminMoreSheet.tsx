"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { getNavItemsByGroup, type NavGroup } from "./nav-items";

type AdminMoreSheetProps = {
  open: boolean;
  onClose: () => void;
};

const GROUPS: { key: NavGroup; label: string }[] = [
  { key: "content", label: "콘텐츠" },
  { key: "operations", label: "운영" },
  { key: "system", label: "시스템" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export default function AdminMoreSheet({ open, onClose }: AdminMoreSheetProps) {
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;

      const focusable = sheet.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const firstFocusable = sheet.querySelector<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[45] bg-black/40 transition-opacity duration-300 ease-in-out lg:hidden"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="관리자 메뉴"
        className="fixed bottom-0 left-0 right-0 z-[45] max-h-[70vh] overflow-y-auto rounded-t-lg bg-white transition-transform duration-300 ease-in-out lg:hidden"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#ddd9cc]" />

        {GROUPS.map((group) => {
          const items = getNavItemsByGroup(group.key);
          if (items.length === 0) return null;

          return (
            <div key={group.key}>
              <div className="px-5 pb-2 pt-5 font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                {group.label}
              </div>

              {items.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex min-h-[48px] items-center gap-3 font-['Pretendard',sans-serif] text-sm transition-colors ${
                      active
                        ? "mx-3 rounded-lg bg-[#FFF0E5] px-2 text-[#FF6C0F]"
                        : "px-5 text-[#4a4a40]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}

        <div className="pb-[max(20px,env(safe-area-inset-bottom))]" />
      </div>
    </>
  );
}
