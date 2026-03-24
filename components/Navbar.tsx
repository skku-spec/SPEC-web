"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useUser } from "@/hooks/useUser";
import {
  getRecruitmentApplyDdayLabel,
  RECRUITMENT_BATCH,
} from "@/lib/recruitment-schedule";
import { createClient } from "@/lib/supabase/client";

import ApplyButton from "@/components/ui/ApplyButton";

const ROLE_LABEL: Record<string, string> = {
  outsider: "외부인",
  runner: "러너",
  preneur: "프러너",
  admin: "관리자",
};

function getInitials(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return "U";
  }

  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, role, isAuthenticated } = useUser();
  const isHome = pathname === "/";

  const textColor = isHome ? "text-white" : "text-[#16140f]";
  const hoverColor = isHome ? "hover:text-white/80" : "hover:opacity-70";
  const dropdownBg = isHome ? "bg-black/90 border-white/10" : "bg-white border-gray-200";
  const dropdownText = isHome ? "text-white/80 hover:text-white hover:bg-white/10" : "text-[#16140f] hover:bg-gray-100";

  const displayName =
    (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.name?.trim()) ||
    user?.email?.split("@")[0] ||
    "사용자";
  const roleLabel = ROLE_LABEL[role] ?? "외부";
  const initials = getInitials(displayName);
  const applyDdayLabel = getRecruitmentApplyDdayLabel();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleComingSoon = useCallback(() => {
    setShowComingSoon(true);
    setMenuOpen(false);
    setTimeout(() => setShowComingSoon(false), 2000);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  }, [router]);

  return (
    <div className={`sticky top-0 isolate z-50 ${isHome ? "bg-transparent" : "bg-[#f5f5ee]"}`}>
      {/* Recruitment banner removed */}

      <nav>
          <div className="relative hidden min-[1024px]:flex items-center justify-center w-full max-w-[1600px] mx-auto px-8 lg:px-10 py-2">
          <div className="flex w-[320px] items-center justify-end gap-10">
            <div className="nav-item relative">
              <button className={`nav-link ${textColor} ${hoverColor} flex items-center gap-1 font-['Pretendard',sans-serif] text-sm`}>
                소개
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mt-0.5"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="dropdown-menu hidden">
                <div className={`dropdown-container ${dropdownBg} backdrop-blur-sm rounded-lg p-2 mt-2 border`}>
                  <Link href="/about" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    SPEC 소개
                  </Link>
                  <Link href="/curriculum" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    커리큘럼
                  </Link>
                  <Link href="/people" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    멤버
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link href="/profile" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                        내 프로필
                      </Link>
                      <Link href="/apply/status" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                        지원 현황 확인
                      </Link>
                    </>
                  )}

                </div>
              </div>
            </div>

            <div className="nav-item relative">
              <button className={`nav-link ${textColor} ${hoverColor} flex items-center gap-1 font-['Pretendard',sans-serif] text-sm`}>
                프로젝트
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mt-0.5"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="dropdown-menu hidden">
                <div className={`dropdown-container ${dropdownBg} backdrop-blur-sm rounded-lg p-2 mt-2 border`}>
                  <Link href="/companies" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    프로젝트 목록
                  </Link>
                  <Link href="/founders" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    팀원 디렉토리
                  </Link>
                  <button onClick={handleComingSoon} className={`dropdown-item block w-full text-left px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    런칭 소식
                  </button>
                </div>
              </div>
            </div>

{/* <Link href="/library" className={`nav-link ${textColor} ${hoverColor} font-['Pretendard',sans-serif] text-sm`}>
              라이브러리
            </Link> */}
          </div>

          <Link href="/" className="mx-8 shrink-0">
            <img src="/images/common/logo.png" alt="SPEC" className="h-10 w-auto" />
          </Link>

          <div className="flex w-[320px] items-center gap-10">
            <Link href="/partners" className={`nav-link ${textColor} ${hoverColor} font-['Pretendard',sans-serif] text-sm`}>
              파트너
            </Link>

{/* <div className="nav-item relative">
              <button className={`nav-link ${textColor} ${hoverColor} flex items-center gap-1 font-['Pretendard',sans-serif] text-sm`}>
                리소스
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mt-0.5"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="dropdown-menu hidden">
                <div className={`dropdown-container ${dropdownBg} backdrop-blur-sm rounded-lg p-2 mt-2 border`}>
                  <Link href="/subscribe" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    뉴스레터
                  </Link>
                  <Link href="/cofounder-matching" className={`dropdown-item block px-4 py-2 ${dropdownText} rounded text-sm font-['Pretendard',sans-serif]`}>
                    팀원 찾기
                  </Link>
                </div>
              </div>
            </div> */}

            <Link href="/blog" className={`nav-link ${textColor} ${hoverColor} font-['Pretendard',sans-serif] text-sm`}>
              블로그
            </Link>
          </div>

          <div className="absolute right-8 lg:right-10 flex items-center gap-3">
            {/* Apply button removed */}


            {isAuthenticated ? (
              <div className="nav-item">
                <button
                  className={`nav-link ${textColor} ${hoverColor} inline-flex items-center gap-2 font-['Pretendard',sans-serif] text-sm`}
                  aria-label="계정 메뉴"
                >
                  {profile?.photo ? (
                    <img src={profile.photo} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6C0F] text-xs font-semibold text-white">
                      {initials}
                    </span>
                  )}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="mt-0.5">
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="dropdown-menu hidden">
                  <div className={`dropdown-container ${dropdownBg} backdrop-blur-sm rounded-lg p-2 mt-2 border min-w-[220px]`}>
                     <div className="px-4 py-2">
                      <p className="truncate text-sm font-medium font-['Pretendard',sans-serif] text-[#16140f]">{displayName}</p>
                      <span className="mt-1 inline-flex rounded-full bg-[#FF6C0F]/10 px-2 py-0.5 text-xs font-medium text-[#FF6C0F]">
                        {roleLabel}
                      </span>
                    </div>
                    <Link href="/profile" className="dropdown-item block px-4 py-2 text-[#16140f] hover:bg-gray-100 rounded text-sm font-['Pretendard',sans-serif]">
                      내 프로필
                    </Link>

                    {role === "admin" && (
                      <Link href="/admin" className="dropdown-item block px-4 py-2 text-[#16140f] hover:bg-gray-100 rounded text-sm font-['Pretendard',sans-serif]">
                        관리자
                      </Link>
                    )}



                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="dropdown-item block w-full px-4 py-2 text-left text-[#16140f] hover:bg-gray-100 rounded text-sm font-['Pretendard',sans-serif]"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className={`nav-link ${textColor} ${hoverColor} font-['Pretendard',sans-serif] text-sm`}
              >
                로그인
              </Link>
            )}
          </div>
        </div>

        <div className="relative flex min-[1024px]:hidden items-center justify-between px-4 py-2">
          <Link href="/" className="inline-block h-[48px]">
            <img src="/images/common/logo.png" alt="SPEC" className="h-12 w-auto" />
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            className={`inline-flex items-center justify-center rounded-md p-2 ${isHome ? "bg-white/10 text-white" : "bg-gray-100 text-[#16140f]"}`}
            aria-label="Open menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 8h16M4 16h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div
          className={`fixed inset-0 z-50 min-[1024px]:hidden transition-opacity duration-300 ${
            menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />

          <div
            className={`absolute inset-y-0 right-0 w-full max-w-[380px] flex flex-col transition-transform duration-300 ease-out ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            } ${isHome ? "bg-[#202020]" : "bg-[#f5f5ee]"}`}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <img src="/images/common/logo.png" alt="SPEC" className="h-9 w-auto" />
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className={`inline-flex items-center justify-center rounded-md p-2 ${
                  isHome ? "text-white/70 hover:text-white" : "text-[#16140f]/60 hover:text-[#16140f]"
                }`}
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className={`mx-6 h-px ${isHome ? "bg-white/10" : "bg-[#16140f]/10"}`} />

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className={`mb-3 text-xs font-semibold uppercase tracking-widest font-['Pretendard',sans-serif] ${isHome ? "text-white/40" : "text-[#16140f]/40"}`}>
                소개
              </p>
              <div className="mb-6 flex flex-col gap-1">
                <Link href="/about" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  SPEC 소개
                </Link>
                <Link href="/curriculum" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  커리큘럼
                </Link>
                <Link href="/people" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  멤버
                </Link>

              </div>

              <p className={`mb-3 text-xs font-semibold uppercase tracking-widest font-['Pretendard',sans-serif] ${isHome ? "text-white/40" : "text-[#16140f]/40"}`}>
                프로젝트
              </p>
              <div className="mb-6 flex flex-col gap-1">
                <Link href="/companies" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  프로젝트 목록
                </Link>
                <Link href="/founders" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  팀원 디렉토리
                </Link>
                <button onClick={handleComingSoon} className={`block w-full text-left rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  런칭 소식
                </button>
              </div>

              <div className="mb-6 flex flex-col gap-1">
{/* <Link href="/library" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  라이브러리
                </Link> */}
                <Link href="/partners" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  파트너
                </Link>
              </div>

{/* <p className={`mb-3 text-xs font-semibold uppercase tracking-widest font-['Pretendard',sans-serif] ${isHome ? "text-white/40" : "text-[#16140f]/40"}`}>
                리소스
              </p>
              <div className="mb-6 flex flex-col gap-1">
                <Link href="/subscribe" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  뉴스레터
                </Link>
                <Link href="/cofounder-matching" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  팀원 찾기
                </Link>
              </div> */}

              <div className="mb-6 flex flex-col gap-1">
                <Link href="/blog" onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}>
                  블로그
                </Link>
              </div>

              {isAuthenticated && role !== "outsider" && role !== "runner" && (
                <>
                  <p className={`mb-3 mt-6 text-xs font-semibold uppercase tracking-widest font-['Pretendard',sans-serif] ${isHome ? "text-white/40" : "text-[#16140f]/40"}`}>
                    멤버 메뉴
                  </p>
                  <div className="mb-6 flex flex-col gap-1">

                    {role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className={`block rounded-lg px-3 py-2.5 text-[15px] font-['Pretendard',sans-serif] font-medium transition-colors ${isHome ? "text-white/80 hover:text-white hover:bg-white/5" : "text-[#16140f]/80 hover:text-[#16140f] hover:bg-[#16140f]/5"}`}
                      >
                        관리자 패널
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className={`shrink-0 px-6 py-5 ${isHome ? "border-t border-white/10" : "border-t border-[#16140f]/10"}`}>
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {profile?.photo ? (
                      <img src={profile.photo} alt={displayName} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6C0F] text-xs font-semibold text-white">
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium font-['Pretendard',sans-serif] ${isHome ? "text-white" : "text-[#16140f]"}`}>
                        {displayName}
                      </p>
                      <span className="text-xs text-[#FF6C0F]">{roleLabel}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`rounded-lg px-3 py-1.5 text-sm font-['Pretendard',sans-serif] transition-colors ${
                      isHome ? "text-white/60 hover:text-white hover:bg-white/5" : "text-[#16140f]/60 hover:text-[#16140f] hover:bg-[#16140f]/5"
                    }`}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-['Pretendard',sans-serif] font-medium transition-colors ${
                    isHome ? "text-white/70 hover:text-white border border-white/15 hover:bg-white/5" : "text-[#16140f]/70 hover:text-[#16140f] border border-[#16140f]/15 hover:bg-[#16140f]/5"
                  }`}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed left-1/2 top-6 z-[100] -translate-x-1/2 transition-all duration-300 ${
          showComingSoon
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2.5 rounded-full bg-[#16140f] px-5 py-3 shadow-lg">
          <span className="text-base">🚀</span>
          <span className="font-['Pretendard',sans-serif] text-sm font-medium text-white">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
