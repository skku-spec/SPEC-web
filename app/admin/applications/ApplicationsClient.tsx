"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { updateApplicationStatus } from "@/lib/actions/applications";
import type { ApplicationStatus } from "@/lib/actions/applications";
import { convertApplicationToMember, getConversionStatusBatch } from "@/lib/actions/member-conversion";
import CustomSelect from "@/components/ui/CustomSelect";
import DeleteApplicationButton from "@/components/dashboard/DeleteApplicationButton";
import type { Database } from "@/lib/supabase/types";

type Application = Database["public"]["Tables"]["applications"]["Row"];

type ApplicationsClientProps = {
  initialApplications: Application[];
};

const STATUS_OPTIONS: ApplicationStatus[] = ["pending", "under_review", "accepted", "rejected"];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "접수완료",
  under_review: "심사중",
  accepted: "합격",
  rejected: "불합격",
};

const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  pending: "bg-[#FFF0E5] text-[#FF6C0F]",
  under_review: "bg-[#E8F0FE] text-[#2563EB]",
  accepted: "bg-[#E6F9E6] text-[#2f9e44]",
  rejected: "bg-[#FEE2E2] text-[#b42318]",
};

function formatStatusLabel(status: string): string {
  return STATUS_LABELS[status as ApplicationStatus] ?? status;
}

function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status as ApplicationStatus] ?? "bg-[#f0efe6] text-[#6b6b5e]";
}

function isValidApplicationStatus(value: string): value is ApplicationStatus {
  return STATUS_OPTIONS.includes(value as ApplicationStatus);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const router = useRouter();

  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());
  const [conversionStatus, setConversionStatus] = useState<Record<string, "idle" | "done" | "already">>({});
  const [toast, setToast] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  const showToast = (id: string, type: "success" | "error", text: string) => {
    setToast({ id, type, text });
    setTimeout(() => setToast(null), 2500);
  };

  const checkConversionStatuses = useCallback(async () => {
    const acceptedIds = initialApplications
      .filter((a) => a.status === "accepted")
      .map((a) => a.id);
    if (acceptedIds.length === 0) return;

    const result = await getConversionStatusBatch(acceptedIds);
    if (!result.success || !result.data) return;

    const statusMap: Record<string, "already"> = {};
    for (const [id, status] of Object.entries(result.data)) {
      if (status.converted) statusMap[id] = "already";
    }
    setConversionStatus((prev) => ({ ...prev, ...statusMap }));
  }, [initialApplications]);

  useEffect(() => {
    checkConversionStatuses();
  }, [checkConversionStatuses]);

  const handleConvert = async (appId: string) => {
    setConvertingIds((prev) => new Set(prev).add(appId));
    const result = await convertApplicationToMember(appId);
    if (result.success) {
      setConversionStatus((prev) => ({ ...prev, [appId]: "done" }));
      showToast(appId, "success", "멤버 등록 완료");
    } else {
      const isAlready = result.error?.includes("이미 존재합니다");
      setConversionStatus((prev) => ({ ...prev, [appId]: isAlready ? "already" : "idle" }));
      showToast(appId, "error", result.error ?? "등록 실패");
    }
    setConvertingIds((prev) => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
  };

  const handleStatusChange = async (appId: string, nextStatus: ApplicationStatus) => {
    setStatusChangingId(appId);
    const result = await updateApplicationStatus(appId, nextStatus);
    if (!result.success) {
      showToast(appId, "error", result.error ?? "상태 변경 실패");
    }
    setStatusChangingId(null);
    router.refresh();
  };

  const batches = useMemo(() => {
    const unique = [...new Set(initialApplications.map((a) => a.batch))];
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [initialApplications]);

  const [selectedBatch, setSelectedBatch] = useState<string>(() =>
    batches.length > 0 ? batches[0] : "all",
  );

  const filteredApplications = useMemo(() => {
    if (selectedBatch === "all") return initialApplications;
    return initialApplications.filter((a) => a.batch === selectedBatch);
  }, [initialApplications, selectedBatch]);

  const isConverted = (id: string) => conversionStatus[id] === "done" || conversionStatus[id] === "already";

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Applications</h1>
         <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <CustomSelect
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={[
              { value: "all", label: "전체" },
              ...batches.map((b) => ({ value: b, label: `${b}기` })),
            ]}
            className="w-[120px]"
          />
          <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
            {selectedBatch === "all"
              ? `총 ${initialApplications.length}건`
              : `총 ${initialApplications.length}건 중 ${filteredApplications.length}건`}
          </p>
        </div>

        {toast && (
          <div className={`mt-3 rounded-md px-3 py-2 font-['Pretendard',sans-serif] text-xs font-semibold ${toast.type === "success" ? "bg-[#E6F9E6] text-[#2f9e44]" : "bg-[#FEE2E2] text-[#b42318]"}`}>
            {toast.text}
          </div>
        )}

        <div className="mt-4 hidden overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white md:block">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">지원자</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">학번</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">전공</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">기수</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">지원일</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">상태</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr className="border-t border-[#ece8db]">
                  <td colSpan={7} className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    아직 접수된 지원서가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const initial = app.name.trim().charAt(0).toUpperCase() || "?";
                  const isThisStatusChanging = statusChangingId === app.id;
                  const isThisConverting = convertingIds.has(app.id);

                  return (
                    <tr key={app.id} className="border-t border-[#ece8db]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{app.name}</p>
                            <p className="truncate font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{app.student_id || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{app.major || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{app.batch}기</td>
                      <td className="whitespace-nowrap px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">{formatDate(app.created_at)}</td>
                      <td className="px-4 py-3">
                        <CustomSelect
                          value={app.status}
                          onChange={(v) => {
                            if (isValidApplicationStatus(v)) handleStatusChange(app.id, v);
                          }}
                          disabled={isThisStatusChanging}
                          options={STATUS_OPTIONS.map((s) => ({ value: s, label: formatStatusLabel(s) }))}
                          className="w-[110px]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8] transition-colors"
                          >
                            열람
                          </Link>
                          {app.status === "accepted" && (
                            isConverted(app.id) ? (
                              <span className="inline-flex h-8 items-center whitespace-nowrap px-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">
                                등록됨
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConvert(app.id)}
                                disabled={isThisConverting}
                                className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8] disabled:opacity-50 transition-colors"
                              >
                                {isThisConverting ? "등록 중..." : "멤버 등록"}
                              </button>
                            )
                          )}
                          <DeleteApplicationButton id={app.id} applicantName={app.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {filteredApplications.length === 0 ? (
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-5">
              <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">아직 접수된 지원서가 없습니다.</p>
            </div>
          ) : (
            filteredApplications.map((app) => {
              const isThisConverting = convertingIds.has(app.id);

              return (
                <article key={app.id} className="rounded-lg border border-[#ddd9cc] bg-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{app.name}</p>
                      <p className="truncate font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{app.email}</p>
                    </div>
                    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${getStatusBadgeClass(app.status)}`}>
                      {formatStatusLabel(app.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-['Pretendard',sans-serif] text-xs text-[#4a4a40]">
                    <p>학번: {app.student_id || "-"}</p>
                    <p>전공: {app.major || "-"}</p>
                    <p>기수: {app.batch}기</p>
                    <p className="text-[#6b6b5e]">{formatDate(app.created_at)}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <CustomSelect
                      value={app.status}
                      onChange={(v) => {
                        if (isValidApplicationStatus(v)) handleStatusChange(app.id, v);
                      }}
                      disabled={statusChangingId === app.id}
                      options={STATUS_OPTIONS.map((s) => ({ value: s, label: formatStatusLabel(s) }))}
                      className="w-[130px]"
                    />
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8]"
                    >
                      열람
                    </Link>
                    {app.status === "accepted" && (
                      isConverted(app.id) ? (
                        <span className="inline-flex h-8 items-center font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">등록됨</span>
                      ) : (
                        <button
                          onClick={() => handleConvert(app.id)}
                          disabled={isThisConverting}
                          className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8] disabled:opacity-50"
                        >
                          {isThisConverting ? "등록 중..." : "멤버 등록"}
                        </button>
                      )
                    )}
                    <DeleteApplicationButton id={app.id} applicantName={app.name} />
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
