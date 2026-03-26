import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import RecruitmentBanner from "@/components/RecruitmentBanner";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import HideOnAdmin from "@/components/HideOnAdmin";

export const metadata: Metadata = {
  metadataBase: new URL("https://skku-spec.com"),
  title: "SPEC | 성균관대학교 창업 학회",
  description: "SPEC - 성균관대학교 창업 학회. 만드는 사람이 세상을 바꾼다.",
  openGraph: {
    title: "SKKU SPEC | 성균관대학교 창업 학회",
    description:
      "Execution over everything. SPEC은 30주 안에 진짜 매출을 만드는 성균관대학교 창업 프로그램입니다.",
    siteName: "SKKU SPEC",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SKKU SPEC | 성균관대학교 창업 학회",
    description:
      "Execution over everything. SPEC은 30주 안에 진짜 매출을 만드는 성균관대학교 창업 프로그램입니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="relative w-full max-w-[100vw] overflow-x-clip">
            <div className="relative z-10">
              <HideOnAdmin>
                <RecruitmentBanner />
              </HideOnAdmin>
              <Navbar />
              <main>{children}</main>
              <HideOnAdmin>
                <Footer />
              </HideOnAdmin>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
