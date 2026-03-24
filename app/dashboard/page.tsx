import { createClient } from "@/lib/supabase/server";
import { getTrackerData } from "@/lib/actions/tracker";
import { AttendanceClient } from "@/app/admin/attendance/AttendanceClient";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import DeleteApplicationButton from "@/components/dashboard/DeleteApplicationButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { profile } = await getCurrentUser();
  const isAdmin = profile?.role === "admin";
  const trackerData = await getTrackerData();

  const { data: applications, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(dateString));
  };

  const statusBadge = (status: string) => {
    const isPending = status === "pending";
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          isPending ? "bg-[#FFF0E5] text-[#FF6C0F]" : "bg-[#f0efe6] text-[#6b6b5e]"
        }`}
      >
        {isPending ? "접수 완료" : status}
      </span>
    );
  };

  return (
    <div className="space-y-12">
      {/* Attendance Section */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AttendanceClient 
          runners={trackerData.runners as any} 
          sessions={trackerData.sessions} 
          logs={trackerData.logs} 
          isAdminOrPreneur={trackerData.isAdminOrPreneur}
          homeworks={trackerData.homeworks as any}
          submissions={trackerData.submissions as any}
          hideHomework={false}
        />
      </section>

      {/* Applications Section */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <h1 className="text-2xl font-semibold text-[#16140f] sm:text-3xl [font-family:system-ui,-apple-system,sans-serif]">
            지원서 목록
          </h1>
          <p className="text-xs text-[#6b6b5e] sm:text-sm">
            총 {applications?.length ?? 0}개
          </p>
        </div>

        {/* Desktop: Table */}
        <div className="hidden overflow-hidden rounded-lg border border-[#ddd9cc] bg-white lg:block">
          <table className="w-full text-left text-sm font-['Pretendard',sans-serif]">
            <thead className="border-b border-[#ddd9cc] bg-[#fcfcf8] font-medium text-[#6b6b5e]">
              <tr>
                <th className="px-6 py-4">지원자</th>
                <th className="px-6 py-4">전공</th>
                <th className="px-6 py-4">지원 차수</th>
                <th className="px-6 py-4">지원일</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ddd9cc]">
              {!applications || applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#9a9a8c]">
                    아직 접수된 지원서가 없습니다.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-[#fcfcf8]">
                    <td className="px-6 py-4 font-medium text-[#16140f]">
                      <div>
                        <p>{app.name}</p>
                        <p className="text-xs font-normal text-[#6b6b5e]">{app.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#4a4a40]">{app.major || "-"}</td>
                    <td className="px-6 py-4 text-[#4a4a40]">{app.batch}기</td>
                    <td className="px-6 py-4 text-[#4a4a40]">{formatDate(app.created_at)}</td>
                    <td className="px-6 py-4">{statusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/applications/${app.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8]"
                        >
                          열람하기
                        </Link>
                        {isAdmin && (
                          <DeleteApplicationButton id={app.id} applicantName={app.name} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: Cards */}
        <div className="space-y-3 lg:hidden">
          {!applications || applications.length === 0 ? (
            <div className="rounded-lg border border-[#ddd9cc] bg-white px-5 py-10 text-center text-sm text-[#9a9a8c]">
              아직 접수된 지원서가 없습니다.
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="rounded-lg border border-[#ddd9cc] bg-white p-4 transition-colors sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#16140f]">{app.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#6b6b5e]">{app.email}</p>
                  </div>
                  {statusBadge(app.status)}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b6b5e]">
                  <span>{app.major || "-"}</span>
                  <span className="text-[#d9d9cc]">·</span>
                  <span>{app.batch}기</span>
                  <span className="text-[#d9d9cc]">·</span>
                  <span>{formatDate(app.created_at)}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-[#f0efe6] pt-3">
                  <Link
                    href={`/dashboard/applications/${app.id}`}
                    className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-[#ddd9cc] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8] sm:flex-none sm:px-4"
                  >
                    열람하기
                  </Link>
                  {isAdmin && (
                    <DeleteApplicationButton id={app.id} applicantName={app.name} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
