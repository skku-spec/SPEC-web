"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/");
    setIsLoading(false);
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isLoading}
      className="w-full rounded-xl border border-[#16140f]/15 bg-white px-4 py-3 font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#16140f] transition-colors hover:bg-[#f8f8f2] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
