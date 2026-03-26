import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { HomeworkClient } from "./HomeworkClient";

export const metadata: Metadata = {
  title: "과제 관리 | SPEC Admin",
};

export default async function AdminHomeworkPage() {
  await requireRole("preneur");

  return (
    <HomeworkClient />
  );
}
