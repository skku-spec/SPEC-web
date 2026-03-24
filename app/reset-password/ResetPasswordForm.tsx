"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetPassword } from "@/lib/actions/auth";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);

    startTransition(async () => {
      const result = await resetPassword(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.replace("/login?reset=true");
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      {error ? (
        <p className="rounded bg-[#fdecec] px-3 py-2 font-['Pretendard',sans-serif] text-sm text-[#b42318]">
          {error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="new_password" className="block font-['Pretendard',sans-serif] text-sm font-medium text-[#666]">
          New password
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full border-0 border-b border-[#ccc] rounded-none bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-[#FF6C0F] focus:ring-0"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm_password" className="block font-['Pretendard',sans-serif] text-sm font-medium text-[#666]">
          Confirm password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full border-0 border-b border-[#ccc] rounded-none bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-[#FF6C0F] focus:ring-0"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-[#FF6C0F] px-6 py-3 font-['Pretendard',sans-serif] font-semibold text-white transition-colors hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Updating..." : "Reset password"}
      </button>

      <p className="text-center font-['Pretendard',sans-serif] text-sm text-[#555]">
        <Link href="/login" className="text-[#FF6C0F] hover:underline">
          Back to Log in
        </Link>
      </p>
    </form>
  );
}
