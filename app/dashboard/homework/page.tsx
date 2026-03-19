import { requireRole } from "@/lib/auth";
import { RunnerHomeworkClient } from "./RunnerHomeworkClient";

export default async function HomeworkPage() {
  await requireRole("runner");

  return (
    <RunnerHomeworkClient />
  );
}
