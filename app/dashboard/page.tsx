import { createClient } from "@/lib/supabase/server";
import { getTrackerData } from "@/lib/actions/tracker";
import { AttendanceClient } from "@/app/admin/attendance/AttendanceClient";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import DeleteApplicationButton from "@/components/dashboard/DeleteApplicationButton";

export default function DashboardPage() {
  redirect("/dashboard/homework");
}
