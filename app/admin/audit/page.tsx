import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AuditClient, { type AuditLogItem } from "./AuditClient";

export const metadata: Metadata = {
  title: "감사 로그 | SPEC Admin",
};

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles: { name: string | null } | null;
};

const AUDIT_SELECT =
  "id, actor_id, action, entity_type, entity_id, details, created_at, profiles:profiles!audit_logs_actor_id_fkey(name)" as const;

export default async function AdminAuditPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs" as never)
    .select(AUDIT_SELECT as never)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load audit logs:", error.message);
  }

  const logs: AuditLogItem[] = ((data ?? []) as unknown as AuditLogRow[]).map((row) => ({
    id: row.id,
    actorName: row.profiles?.name ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: row.created_at,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]">
        감사 로그
      </h1>
      <AuditClient initialLogs={logs} />
    </div>
  );
}
