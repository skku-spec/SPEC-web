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
      className="w-full h-10 rounded-md border border-[#ddd9cc] bg-white px-4 font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
