import { createClient } from "@/lib/supabase/server";

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "role_change"
  | "convert"
  | "export";

type AuditEntityType =
  | "member"
  | "application"
  | "recruitment"
  | "user"
  | "site_setting"
  | "form_field"
  | "curriculum"
  | "faq"
  | "partner"
  | "homework"
  | "attendance"
  | "post"
  | "job"
  | "launch"
  | "library";

export async function logAuditEvent(params: {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("audit_logs" as never).insert({
      actor_id: user?.id ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      details: params.details ?? null,
    } as never);
  } catch {}
}
