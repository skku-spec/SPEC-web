import type { Metadata } from "next";

import SignUpForm from "@/app/signup/SignUpForm";

export const metadata: Metadata = {
  title: "Sign up | SPEC",
  description: "Sign up to access the SPEC Application",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6ef] px-4 py-10">
      <div className="w-full max-w-[480px] rounded-xl bg-white p-10 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/images/common/logo.png" alt="SPEC" className="h-10 w-10" />
          <h1 className="mt-5 font-['Pretendard',sans-serif] text-[28px] font-extrabold leading-tight text-[#111]">
            Sign up to access the SPEC Application
          </h1>
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}
