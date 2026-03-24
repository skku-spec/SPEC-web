import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getSiteConfig } from "@/lib/helpers/site-settings";

export const metadata: Metadata = {
  title: "Contact | SPEC",
  description: "SPEC 연락처입니다.",
};

const pClass =
  "mb-6 font-['Pretendard',sans-serif] font-normal text-[18px] leading-[1.7] text-[#16140f] last:mb-0";

const linkClass =
  "text-[#16140f] underline decoration-gray-500 underline-offset-2 transition-all hover:decoration-gray-700";

export default async function ContactPage() {
  const config = await getSiteConfig();
  return (
    <main className="flex-1 px-4 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[720px]">
        <PageHeader title="Contact" />
      </div>

      <div className="mx-auto max-w-[720px]">
        <div className="mb-10">
          <p className={pClass}>
            문의하시기 전에 먼저{" "}
            <Link href="/faq" className={linkClass}>
              자주 묻는 질문
            </Link>
            을 확인해주세요.
          </p>
          <p className={pClass}>
            SPEC의 다양한 문의 사항을 위한 연락처입니다:
          </p>

          <div className="mb-8 space-y-4">
            {[
              { label: "일반 문의", email: config.contact_general_email },
              { label: "지원 관련", email: config.contact_apply_email },
              { label: "제휴/협업", email: config.contact_partnership_email },
              { label: "언론 문의", email: config.contact_press_email },
            ].map((item) => (
              <div key={item.email}>
                <p className="font-['Pretendard',sans-serif] text-[15px] font-normal text-[#16140f]/60">
                  {item.label}
                </p>
                <a
                  href={`mailto:${item.email}`}
                  className="font-['Pretendard',sans-serif] text-[18px] font-normal text-[#16140f] underline decoration-gray-500 underline-offset-2 transition-all hover:decoration-gray-700"
                >
                  {item.email}
                </a>
              </div>
            ))}
          </div>

          <div className="mb-8 p-4 bg-[#f5f5ee] rounded-lg border border-[#d4d4cc]">
            <p className="font-['Pretendard',sans-serif] text-[15px] font-normal text-[#16140f]/60 mb-2">
              오피스 주소
            </p>
            <p className="font-['Pretendard',sans-serif] text-[18px] font-normal text-[#16140f]">
              {config.contact_office_address}
            </p>
          </div>
        </div>

        <nav>
          <h3 className="mb-4 font-['Pretendard',sans-serif] text-sm font-medium uppercase tracking-wider text-[#16140f]/60">
            소셜 미디어
          </h3>
          <ul className="space-y-2">
            {[
              { label: "Blog", href: "/blog", internal: true },
              { label: "Instagram", href: config.social_instagram, internal: false },
              { label: "LinkedIn", href: config.social_linkedin, internal: false },
            ].map((link) => (
              <li key={link.label}>
                {link.internal ? (
                  <Link
                    href={link.href}
                    className="font-['Pretendard',sans-serif] text-[18px] font-normal text-[#16140f] underline decoration-gray-500 underline-offset-2 transition-all hover:decoration-gray-700"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-['Pretendard',sans-serif] text-[18px] font-normal text-[#16140f] underline decoration-gray-500 underline-offset-2 transition-all hover:decoration-gray-700"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
