import type { Metadata } from "next";
import { getAllRecruitments, getActiveRecruitment, getWaitlistEntries } from "@/lib/actions/recruitment";
import RecruitmentSettingsClient from "./RecruitmentSettingsClient";

export const metadata: Metadata = {
  title: "모집 관리 | SPEC Admin",
};

export default async function AdminRecruitmentPage() {
  const [allResult, activeResult, waitlistResult] = await Promise.all([
    getAllRecruitments(),
    getActiveRecruitment(),
    getWaitlistEntries(),
  ]);

  return (
    <RecruitmentSettingsClient
      allRecruitments={allResult?.data ?? []}
      activeRecruitment={activeResult?.data ?? null}
      waitlistEntries={waitlistResult?.data ?? []}
    />
  );
}
