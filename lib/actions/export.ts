"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatKoreanDate } from "@/lib/utils/koreanDate";

type ExportResult = {
  success?: boolean;
  error?: string;
  data?: string;
};

type ApplicationStats = Record<
  string,
  { total: number; pending: number; accepted: number; rejected: number; under_review: number }
>;

type StatsResult = {
  success?: boolean;
  error?: string;
  data?: ApplicationStats;
};

function escapeCSV(value: string): string {
  const str = (value ?? "").toString().replace(/"/g, '""');
  return `"${str}"`;
}

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
  excused: "공결",
};

export async function exportApplicationsCSV(batch?: string): Promise<ExportResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    let query = supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (batch) query = query.eq("batch", batch);

    const { data, error } = await query;

    if (error) {
      return { error: "지원서 데이터 조회 중 오류가 발생했습니다." };
    }

    if (!data || data.length === 0) {
      return { success: true, data: "" };
    }

    const headers = ["이름", "학번", "전공", "이메일", "전화번호", "기수", "상태", "지원일"];
    const rows = data.map((a) => [
      a.name,
      a.student_id,
      a.major,
      a.email,
      a.phone,
      a.batch ? `${a.batch}기` : "",
      a.status,
      formatKoreanDate(a.created_at, { year: "numeric", month: "numeric", day: "numeric" }),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => escapeCSV(v ?? "")).join(",")),
    ].join("\n");

    return { success: true, data: csv };
  } catch {
    return { error: "지원서 CSV 내보내기 중 오류가 발생했습니다." };
  }
}

export async function exportAttendanceCSV(): Promise<ExportResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*, profiles:user_id(name), attendance_sessions:session_id(title, date)")
      .order("created_at", { ascending: false });

    if (error) {
      return { error: "출석 데이터 조회 중 오류가 발생했습니다." };
    }

    if (!data || data.length === 0) {
      return { success: true, data: "" };
    }

    const headers = ["이름", "세션", "날짜", "상태"];
    const rows = data.map((log) => {
      const profiles = (log as unknown as Record<string, unknown>).profiles as { name: string } | null;
      const session = (log as unknown as Record<string, unknown>).attendance_sessions as { title: string; date: string } | null;
      return [
        profiles?.name ?? "",
        session?.title ?? "",
        session?.date ?? "",
        ATTENDANCE_STATUS_LABELS[log.status] ?? log.status,
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => escapeCSV(v ?? "")).join(",")),
    ].join("\n");

    return { success: true, data: csv };
  } catch {
    return { error: "출석 CSV 내보내기 중 오류가 발생했습니다." };
  }
}

export async function getApplicationStats(): Promise<StatsResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("applications")
      .select("batch, status");

    if (error) {
      return { error: "지원서 통계 조회 중 오류가 발생했습니다." };
    }

    if (!data) return { success: true, data: {} };

    const stats: ApplicationStats = {};
    for (const app of data) {
      const batch = app.batch ?? "unknown";
      if (!stats[batch]) {
        stats[batch] = { total: 0, pending: 0, accepted: 0, rejected: 0, under_review: 0 };
      }
      stats[batch].total++;
      const status = app.status as string;
      if (status === "pending") stats[batch].pending++;
      else if (status === "accepted") stats[batch].accepted++;
      else if (status === "rejected") stats[batch].rejected++;
      else if (status === "under_review") stats[batch].under_review++;
    }

    return { success: true, data: stats };
  } catch {
    return { error: "지원서 통계 조회 중 오류가 발생했습니다." };
  }
}
