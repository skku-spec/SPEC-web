"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { updateApplicationStatus } from "@/lib/actions/applications";
import type { ApplicationStatus } from "@/lib/actions/applications";
import { convertApplicationToMember, getConversionStatus } from "@/lib/actions/member-conversion";
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
  const [isPending, startTransition] = useTransition();
  const [conversionStatus, setConversionStatus] = useState<Record<string, "idle" | "loading" | "done" | "already">>({});
  const [conversionMsg, setConversionMsg] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  const checkConversionStatuses = useCallback(async () => {
    const accepted = initialApplications.filter((a) => a.status === "accepted");
    for (const app of accepted) {
      const result = await getConversionStatus(app.id);
      if (result.success && result.data?.converted) {
        setConversionStatus((prev) => ({ ...prev, [app.id]: "already" }));
      }
    }
  }, [initialApplications]);

  useEffect(() => {
    checkConversionStatuses();
  }, [checkConversionStatuses]);

  const handleConvert = (appId: string) => {
    setConversionStatus((prev) => ({ ...prev, [appId]: "loading" }));
    startTransition(() => {
      void (async () => {
        const result = await convertApplicationToMember(appId);
        if (result.success) {
          setConversionStatus((prev) => ({ ...prev, [appId]: "done" }));
          setConversionMsg((prev) => ({ ...prev, [appId]: { type: "success", text: "멤버 등록 완료" } }));
        } else {
          const isAlreadyExists = result.error?.includes("이미 존재합니다");
          setConversionStatus((prev) => ({ ...prev, [appId]: isAlreadyExists ? "already" : "idle" }));
          setConversionMsg((prev) => ({ ...prev, [appId]: { type: "error", text: result.error ?? "등록 실패" } }));
        }
        setTimeout(() => {
          setConversionMsg((prev) => {
            const next = { ...prev };
            delete next[appId];
            return next;
          });
        }, 3000);
      })();
    });
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

  const handleStatusChange = (appId: string, nextStatus: ApplicationStatus) => {
    startTransition(() => {
      void (async () => {
        const result = await updateApplicationStatus(appId, nextStatus);

        if (!result.success) {
          window.alert(result.error ?? "상태 변경에 실패했습니다.");
          return;
        }

      })();
    });
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Applications</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
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

        <div className="mt-4 hidden rounded-lg border border-[#ddd9cc] bg-white md:block">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">지원자</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">학번</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">전공</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">지원 차수</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">지원일</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">상태</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr className="border-t border-[#ece8db]">
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]"
                  >
                    아직 접수된 지원서가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const initial = app.name.trim().charAt(0).toUpperCase() || "?";

                  return (
                    <tr key={app.id} className="border-t border-[#ece8db]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                            {initial}
                          </div>
                          <div>
                            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{app.name}</p>
                            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{app.student_id || "-"}</td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{app.major || "-"}</td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">{app.batch}기</td>
                      <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">{formatDate(app.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${getStatusBadgeClass(app.status)}`}
                          >
                            {formatStatusLabel(app.status)}
                          </span>
                          <CustomSelect
                            value={app.status}
                            onChange={(v) => {
                              if (isValidApplicationStatus(v)) handleStatusChange(app.id, v);
                            }}
                            disabled={isPending}
                            options={STATUS_OPTIONS.map((s) => ({ value: s, label: formatStatusLabel(s) }))}
                            className="w-[130px]"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8]"
                          >
                            열람하기
                          </Link>
                          {app.status === "accepted" && (
                            conversionStatus[app.id] === "done" || conversionStatus[app.id] === "already" ? (
                              <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">등록됨</span>
                            ) : (
                              <button
                                onClick={() => handleConvert(app.id)}
                                disabled={isPending || conversionStatus[app.id] === "loading"}
                                className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8] disabled:opacity-50"
                              >
                                {conversionStatus[app.id] === "loading" ? "등록 중..." : "멤버 등록"}
                              </button>
                            )
                          )}
                          {conversionMsg[app.id] && (
                            <span className={`font-['Pretendard',sans-serif] text-xs font-semibold ${conversionMsg[app.id].type === "success" ? "text-[#2f9e44]" : "text-[#b42318]"}`}>
                              {conversionMsg[app.id].text}
                            </span>
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

        <div className="space-y-3 md:hidden">
          {filteredApplications.length === 0 ? (
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-4 sm:p-5">
              <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">아직 접수된 지원서가 없습니다.</p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <article key={app.id} className="rounded-lg border border-[#ddd9cc] bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{app.name}</p>
                    <p className="truncate font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{app.email}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${getStatusBadgeClass(app.status)}`}
                  >
                    {formatStatusLabel(app.status)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-['Pretendard',sans-serif] text-xs text-[#4a4a40] sm:text-sm">
                  <p>학번: {app.student_id || "-"}</p>
                  <p>전공: {app.major || "-"}</p>
                  <p>지원 차수: {app.batch}기</p>
                  <p className="text-[#6b6b5e]">지원일: {formatDate(app.created_at)}</p>
                </div>

                  <div className="mt-4 space-y-2">
                    <CustomSelect
                      value={app.status}
                      onChange={(v) => {
                        if (isValidApplicationStatus(v)) handleStatusChange(app.id, v);
                      }}
                      disabled={isPending}
                      options={STATUS_OPTIONS.map((s) => ({ value: s, label: formatStatusLabel(s) }))}
                      className="w-full sm:w-[160px]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8]"
                      >
                        열람하기
                      </Link>
                      {app.status === "accepted" && (
                        conversionStatus[app.id] === "done" || conversionStatus[app.id] === "already" ? (
                          <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">등록됨</span>
                        ) : (
                          <button
                            onClick={() => handleConvert(app.id)}
                            disabled={isPending || conversionStatus[app.id] === "loading"}
                            className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#fcfcf8] disabled:opacity-50"
                          >
                            {conversionStatus[app.id] === "loading" ? "등록 중..." : "멤버 등록"}
                          </button>
                        )
                      )}
                      {conversionMsg[app.id] && (
                        <span className={`font-['Pretendard',sans-serif] text-xs font-semibold ${conversionMsg[app.id].type === "success" ? "text-[#2f9e44]" : "text-[#b42318]"}`}>
                          {conversionMsg[app.id].text}
                        </span>
                      )}
                      <DeleteApplicationButton id={app.id} applicantName={app.name} />
                    </div>
                  </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
