import type { Metadata } from "next";

import LoginForm from "@/app/login/LoginForm";

export const metadata: Metadata = {
  title: "Log in | SPEC",
  description: "Log in to access the SPEC Application",
};

type LoginPageProps = {
  searchParams: Promise<{ registered?: string; redirect?: string; reset?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6ef] px-4 py-10">
      <div className="w-full max-w-[480px] rounded-xl bg-white p-5 sm:p-8 md:p-10 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/common/logo.png" alt="SPEC" className="h-10 w-10" />
          <h1 className="mt-5 font-['Pretendard',sans-serif] text-xl sm:text-[28px] font-extrabold leading-tight text-[#111]">
            Log in to access the SPEC Application
          </h1>
        </div>

        <LoginForm
          registered={params.registered === "true"}
          passwordReset={params.reset === "true"}
          authError={params.error === "auth"}
          redirect={params.redirect}
        />
      </div>
    </div>
  );
}
