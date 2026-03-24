import { getCurriculumWeeks, getCurriculumAreas } from "@/lib/actions/curriculum";
import CurriculumClient from "./CurriculumClient";

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
