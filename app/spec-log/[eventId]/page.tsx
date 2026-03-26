import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getEventById, getLogsByEvent } from "@/lib/actions/spec-log";

import EventFeedClient from "./EventFeedClient";

export const metadata = {
  title: "SPEC 로그",
};

export default async function EventFeedPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const [eventResult, logsResult, auth] = await Promise.all([
    getEventById(eventId),
    getLogsByEvent(eventId),
    getCurrentUser(),
  ]);

  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  const event = eventResult.data;
  const logs = logsResult.success ? (logsResult.data ?? []) : [];

  const currentUser =
    auth.user && auth.profile
      ? {
          id: auth.user.id,
          name: auth.profile.name ?? "",
          role: auth.profile.role ?? "outsider",
        }
      : null;

  return (
    <EventFeedClient
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        batch: event.batch,
        status: event.status,
        start_date: event.start_date,
        end_date: event.end_date,
      }}
      initialLogs={logs}
      currentUser={currentUser}
    />
  );
}
