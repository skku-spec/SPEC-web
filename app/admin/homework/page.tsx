import { requireRole } from "@/lib/auth";
import { HomeworkClient } from "./HomeworkClient";

export default async function AdminHomeworkPage() {
  await requireRole("preneur");

  return (
    <HomeworkClient />
  );
}
