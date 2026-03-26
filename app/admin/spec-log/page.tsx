import { requireRole } from "@/lib/auth";
import { getEventsByBatch } from "@/lib/actions/spec-log";
import SpecLogAdminClient from "./SpecLogAdminClient";

const BATCHES = ["1기", "2기", "3기", "4기"];

export default async function AdminSpecLogPage() {
  await requireRole("preneur");
  const results = await Promise.all(BATCHES.map((batch) => getEventsByBatch(batch)));
  const allEvents = results.flatMap((r) => r.data ?? []);
  return <SpecLogAdminClient initialEvents={allEvents} />;
}
