"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ApplyButton from "@/components/ui/ApplyButton";
import PendingNavLink from "@/components/ui/PendingNavLink";

export default function ApplyActions() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/apply/form");
    router.prefetch("/apply/status");
  }, [router]);

  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <ApplyButton href="/apply/form" size="xl">
        Apply
      </ApplyButton>
      <PendingNavLink
        href="/apply/status"
        className="inline-flex items-center rounded-full border border-[#d9d9cc] px-14 py-5 font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#4a4a40] transition-colors hover:bg-white hover:text-[#16140f]"
      >
        지원 현황 확인
      </PendingNavLink>
    </div>
  );
}
