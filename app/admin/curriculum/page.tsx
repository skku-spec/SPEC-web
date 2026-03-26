import type { Metadata } from "next";
import { getCurriculumWeeks, getCurriculumAreas } from "@/lib/actions/curriculum";
import CurriculumClient from "./CurriculumClient";

export const metadata: Metadata = {
  title: "커리큘럼 관리 | SPEC Admin",
};

export default async function AdminCurriculumPage() {
  const [weeksResult, areasResult] = await Promise.all([
    getCurriculumWeeks("learner"),
    getCurriculumAreas("preneur"),
  ]);

  return (
    <CurriculumClient
      initialWeeks={weeksResult.data ?? []}
      initialAreas={areasResult.data ?? []}
    />
  );
}
