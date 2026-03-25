"use client";

import { useState, useTransition } from "react";

import { updateUserRole } from "@/lib/actions/admin";
import CustomSelect from "@/components/ui/CustomSelect";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type UsersClientProps = {
  initialProfiles: Profile[];
};

type UserRole = "outsider" | "runner" | "preneur" | "member" | "admin";

const ROLE_OPTIONS: UserRole[] = ["admin", "member", "preneur", "runner", "outsider"];

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#DC2626",
  member: "#2563EB",
  preneur: "#7C3AED",
  runner: "#0F766E",
  outsider: "#6b6b5e",
};

function formatRoleLabel(role: UserRole) {
  if (role === "outsider") return "외부인";
  if (role === "runner") return "러너";
  if (role === "preneur") return "프러너";
  if (role === "member") return "부원";
  return "관리자";
}

function isProfileRole(value: string): value is UserRole {
  return value === "admin" || value === "member" || value === "preneur" || value === "runner" || value === "outsider";
}

function formatJoinedDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function UsersClient({ initialProfiles }: UsersClientProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filteredProfiles = initialProfiles.filter((profile) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      profile.name.toLowerCase().includes(q) ||
      (profile.slug?.toLowerCase().includes(q) ?? false) ||
      (profile.batch?.toLowerCase().includes(q) ?? false) ||
      (profile.company?.toLowerCase().includes(q) ?? false)
    );
  });
  const handleRoleChange = (userId: string, nextRole: UserRole) => {
    startTransition(() => {
      void (async () => {
        const result = await updateUserRole(userId, nextRole);

        if (!result.success) {
          window.alert(result.error ?? "Failed to update role.");
          return;
        }

      })();
    });
  };

  return (
    <section className="relative">
      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-10 py-8 shadow-xl">
            <svg
              className="h-8 w-8 animate-spin text-[#FF6C0F]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              권한을 변경하고 있습니다…
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Users</h1>

        {/* Search */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b5e]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 슬러그, 기수, 회사로 검색…"
              className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 pl-10 pr-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
            />
          </div>
          <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
            {search.trim()
              ? `${filteredProfiles.length}명 / 전체 ${initialProfiles.length}명`
              : `전체 ${initialProfiles.length}명`}
          </p>
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white md:block">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Name</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Role</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Batch</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Company</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => {
                const initial = profile.name.trim().charAt(0).toUpperCase() || "?";

                return (
                  <tr key={profile.id} className="border-t border-[#ece8db]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                          {initial}
                        </div>
                        <div>
                          <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                            {profile.name || "Unknown"}
                          </p>
                          <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{profile.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white"
                          style={{ backgroundColor: ROLE_COLORS[(profile.role as UserRole | null) ?? "outsider"] }}
                        >
                          {formatRoleLabel((profile.role as UserRole | null) ?? "outsider")}
                        </span>
                        <CustomSelect
                          value={(profile.role as UserRole | null) ?? "outsider"}
                          onChange={(nextRole) => {
                            if (isProfileRole(nextRole)) {
                              handleRoleChange(profile.id, nextRole);
                            }
                          }}
                          disabled={isPending}
                          options={ROLE_OPTIONS.map((role) => ({
                            value: role,
                            label: formatRoleLabel(role),
                          }))}
                          className="w-[130px]"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {profile.batch || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                      {profile.company || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                      {formatJoinedDate(profile.created_at)}
                    </td>
                  </tr>
                );
              })}
              {filteredProfiles.length === 0 && (
                <tr className="border-t border-[#ece8db]">
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]"
                  >
                    {search.trim() ? "검색 결과가 없습니다." : "등록된 유저가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="flex flex-col gap-3 md:hidden">
          {filteredProfiles.map((profile) => {
            const initial = profile.name.trim().charAt(0).toUpperCase() || "?";

            return (
              <div
                key={profile.id}
                className="rounded-lg border border-[#ddd9cc] bg-white p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {profile.name || "Unknown"}
                    </p>
                    <p className="truncate font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      {profile.slug}
                    </p>
                  </div>
                  <span
                    className="inline-flex shrink-0 rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white"
                    style={{ backgroundColor: ROLE_COLORS[(profile.role as UserRole | null) ?? "outsider"] }}
                  >
                    {formatRoleLabel((profile.role as UserRole | null) ?? "outsider")}
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">Batch</span>
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{profile.batch || "-"}</p>
                  </div>
                  <div>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">Company</span>
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{profile.company || "-"}</p>
                  </div>
                  <div>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">Joined</span>
                    <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{formatJoinedDate(profile.created_at)}</p>
                  </div>
                </div>

                <div className="border-t border-[#ece8db] pt-3">
                  <span className="mb-1 block font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">Change Role</span>
                  <CustomSelect
                    value={(profile.role as UserRole | null) ?? "outsider"}
                    onChange={(nextRole) => {
                      if (isProfileRole(nextRole)) {
                        handleRoleChange(profile.id, nextRole);
                      }
                    }}
                    disabled={isPending}
                    options={ROLE_OPTIONS.map((role) => ({
                      value: role,
                      label: formatRoleLabel(role),
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            );
          })}
          {filteredProfiles.length === 0 && (
            <div className="rounded-lg border border-[#ddd9cc] bg-white py-8 text-center">
              <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                {search.trim() ? "검색 결과가 없습니다." : "등록된 유저가 없습니다."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
