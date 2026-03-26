import { getCurrentUser } from "@/lib/auth";
import { getEventsByBatch } from "@/lib/actions/spec-log";
import { CURRENT_BATCH } from "@/lib/constants";
import SpecLogListClient from "./SpecLogListClient";

export const metadata = {
  title: "SPEC 로그",
  description: "SPEC 활동 기록",
};

const BATCHES = ["4기", "3기", "2기", "1기"];

export default async function SpecLogPage() {
  const [authResult, eventsResult] = await Promise.all([
    getCurrentUser(),
    getEventsByBatch(CURRENT_BATCH),
  ]);

  const initialEvents = eventsResult.success ? (eventsResult.data ?? []) : [];

  return (
    <SpecLogListClient
      initialEvents={initialEvents}
      batches={BATCHES}
      defaultBatch={CURRENT_BATCH}
      currentUser={
        authResult.profile ? { name: authResult.profile.name } : null
      }
    />
  );
}
