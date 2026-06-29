import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCachedActiveRecruitment } from "@/lib/recruitment-public";

export default async function RecruitmentCard() {
  const data = await getCachedActiveRecruitment();

  if (!data || data.status === "closed") {
    return null;
  }

  if (data.status === "recruiting") {
    return (
      <div className="rounded-lg border border-[#ddd9cc] bg-white p-8 text-center">
        <span className="inline-flex rounded-full bg-[#FF6C0F] px-3 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white">
          {data.hero_badge}
        </span>
        <h3 className="mt-4 font-['Pretendard',sans-serif] text-xl font-bold text-[#16140f]">
          {data.batch_label}
        </h3>
        <p className="mt-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
          {data.banner_label}
        </p>
        <Link
          href="/apply"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-[#FF6C0F] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          지원하기
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    );
  }

  if (data.status === "reviewing") {
    return (
      <div className="rounded-lg border border-[#ddd9cc] bg-white p-8 text-center">
        <span className="inline-flex rounded-full bg-[#2563EB] px-3 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white">
          심사 진행 중
        </span>
        <h3 className="mt-4 font-['Pretendard',sans-serif] text-xl font-bold text-[#16140f]">
          {data.batch_label}
        </h3>
        <p className="mt-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
          심사가 진행 중입니다. 결과는 개별 안내됩니다.
        </p>
      </div>
    );
  }

  if (data.status === "upcoming") {
    return (
      <div className="rounded-lg border border-[#ddd9cc] bg-white p-8 text-center">
        <span className="inline-flex rounded-full bg-[#FF6C0F] px-3 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white">
          Coming Soon
        </span>
        <h3 className="mt-4 font-['Pretendard',sans-serif] text-xl font-bold text-[#16140f]">
          다음 모집을 준비하고 있습니다
        </h3>
        <p className="mt-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
          자세한 일정은 곧 안내됩니다.
        </p>
      </div>
    );
  }

  return null;
}
