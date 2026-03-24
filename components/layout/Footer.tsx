import Link from "next/link";
import Image from "next/image";
import { getSiteConfig } from "@/lib/helpers/site-settings";

export default async function Footer() {
  const config = await getSiteConfig();
  const footerLinks = {
    programs: [
      { label: "SPEC 프로그램", href: "/about" },
      { label: "커리큘럼", href: "/curriculum" },
      { label: "지원하기", href: "/apply" },
    ],
    resources: [
      { label: "프로젝트 목록", href: "/companies" },
      { label: "파트너", href: "/partners" },
      { label: "멤버", href: "/people" },
    ],
    company: [
      { label: "블로그", href: "/blog" },
      { label: "개인정보처리방침", href: "/legal#privacy" },
      { label: "이용약관", href: "/legal#tou" },
    ],
  };

  return (
    <footer className="bg-black/90 border-t border-white/10 px-6 py-12 text-white lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex flex-col gap-4">
            <Image src="/images/common/logo_ver1.png" alt="SPEC" width={40} height={40} />
            <h3 className="font-['Pretendard',sans-serif] text-base font-light text-white/90">
              Execution over everything.
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-16">
            {(
              [
                { key: "programs", title: "프로그램" },
                { key: "resources", title: "리소스" },
                { key: "company", title: "SPEC" },
              ] as const
            ).map((section) => (
              <div key={section.key} className="flex flex-col gap-4">
                <h3 className="font-['Pretendard',sans-serif] text-sm font-medium tracking-wider text-white">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-2">
                  {footerLinks[section.key].map((link) => {
                    const isExternal = link.href.startsWith("http");
                    if (isExternal) {
                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-['Pretendard',sans-serif] text-sm font-light text-white/60 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="font-['Pretendard',sans-serif] text-sm font-light text-white/60 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
          <div className="flex gap-4">
            <a
              href={config.social_instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 transition-colors hover:text-white"
              aria-label="Instagram"
            >
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href={config.social_linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 transition-colors hover:text-white"
              aria-label="LinkedIn"
            >
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>

          <p className="font-['Pretendard',sans-serif] text-sm font-light text-white/50">
            &copy; 2026 SPEC 성균관대학교 창업 학회
          </p>
        </div>
      </div>
    </footer>
  );
}
