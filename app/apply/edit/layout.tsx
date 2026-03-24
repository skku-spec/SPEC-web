import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getActiveRecruitment } from "@/lib/actions/recruitment";

export default async function ApplyEditLayout({ children }: { children: ReactNode }) {
  const result = await getActiveRecruitment();
  const recruitment = result?.data ?? null;

  if (!recruitment || recruitment.status !== "recruiting") {
    redirect("/apply");
  }

  return <>{children}</>;
}
