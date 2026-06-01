import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { HomeworkClient } from "./HomeworkClient";

export const metadata: Metadata = {
  title: "과제 관리 | SPEC Admin",
};

export default async function AdminHomeworkPage() {
  await requireAdmin();

  return (
    <HomeworkClient />
  );
}
