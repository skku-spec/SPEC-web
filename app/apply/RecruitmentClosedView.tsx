"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle } from "lucide-react";
import { submitWaitlistPhone } from "@/lib/actions/recruitment";

type RecruitmentClosedViewProps = {
  status: "closed" | "reviewing" | "upcoming";
  batchLabel?: string;
};

const STATUS_BADGE: Record<
  RecruitmentClosedViewProps["status"],
  { label: string; className: string }
> = {
  closed: { label: "\uBAA8\uC9D1 \uB9C8\uAC10", className: "bg-[#16140f] text-white" },
  reviewing: { label: "\uC2EC\uC0AC \uC9C4\uD589 \uC911", className: "bg-[#2563EB] text-white" },
  upcoming: { label: "\uBAA8\uC9D1 \uC900\uBE44 \uC911", className: "bg-[#FF6C0F] text-white" },
};

const STATUS_COPY: Record<RecruitmentClosedViewProps["status"], string[]> = {
  closed: [
    "\uC9C0\uAE08\uC740 \uBAA8\uC9D1 \uAE30\uAC04\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
    "\uD558\uC9C0\uB9CC \uCC3D\uC5C5\uC758 \uC2DC\uC791\uC740 \uC9C0\uC6D0\uC11C\uAC00 \uC544\uB2D9\uB2C8\uB2E4. \uBB38\uC81C\uB97C \uBC1C\uACAC\uD558\uB294 \uB208, \uC9C1\uC811 \uD574\uBCF4\uACA0\uB2E4\uB294 \uACB0\uC2EC \u2014 \uADF8\uAC83\uC774 \uC9C4\uC9DC \uC2DC\uC791\uC785\uB2C8\uB2E4.",
    "\uB2E4\uC74C \uAE30\uC218\uC5D0\uC11C \uB2E4\uC2DC \uB9CC\uB098\uAE38 \uBC14\uB78D\uB2C8\uB2E4. \uADF8 \uC804\uAE4C\uC9C0, \uB2F9\uC2E0\uC758 \uCC3D\uC5C5\uC758 \uAFC8\uC744 \uC798 \uC9C0\uCF1C\uB098\uAC00\uACE0 \uC788\uAE38.",
  ],
  reviewing: [
    "\uD604\uC7AC \uC2EC\uC0AC\uAC00 \uC9C4\uD589 \uC911\uC785\uB2C8\uB2E4.",
    "\uACB0\uACFC\uB294 \uC9C0\uC6D0\uC11C\uC5D0 \uAE30\uC7AC\uD55C \uC5F0\uB77D\uCC98\uB85C \uC548\uB0B4\uB429\uB2C8\uB2E4. \uC870\uAE08\uB9CC \uAE30\uB2E4\uB824\uC8FC\uC138\uC694.",
  ],
  upcoming: [
    "\uB2E4\uC74C \uAE30\uC218 \uBAA8\uC9D1\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
    "\uACE7 \uB9CC\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  ],
};

type FormState = "idle" | "success" | "duplicate" | "error";

export default function RecruitmentClosedView({
  status,
  batchLabel,
}: RecruitmentClosedViewProps) {
  const [phone, setPhone] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const badge = STATUS_BADGE[status];
  const copy = STATUS_COPY[status];
  const showWaitlist = status === "closed" || status === "upcoming";

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let formatted = "";
    if (value.length <= 3) formatted = value;
    else if (value.length <= 7)
      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
    else
      formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    setPhone(formatted);
  };

  const handleSubmit = () => {
    if (!phone || phone.replace(/-/g, "").length < 10) return;

    startTransition(async () => {
      const result = await submitWaitlistPhone(phone);
      if (result.success && result.duplicate) {
        setFormState("duplicate");
      } else if (result.success) {
        setFormState("success");
      } else {
        setFormState("error");
        setErrorMsg(result.error ?? "오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5ee]">
      <section className="flex min-h-[60vh] items-start justify-center">
        <div className="mx-auto max-w-[640px] px-6 pt-20 pb-16">
          <h1
            className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black text-[#16140f]"
          >
            Apply to SPEC
          </h1>

          <div className="mt-6">
            <span
              className={`inline-flex rounded-full px-4 py-1.5 font-['Pretendard',sans-serif] text-sm font-semibold ${badge.className}`}
            >
              {badge.label}
              {batchLabel && (
                <span className="ml-1.5 font-normal opacity-80">
                  {batchLabel}
                </span>
              )}
            </span>
          </div>

          <div className="mt-8 space-y-5 font-['Pretendard',sans-serif] text-[17px] leading-[1.75] text-[#4a4a40]">
            {copy.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {showWaitlist && (
            <div className="mt-12 rounded-lg border border-[#ddd9cc] bg-white p-6 md:p-8">
              <CalendarClock className="h-5 w-5 text-[#6b6b5e]" strokeWidth={1.5} />

              <h3 className="mt-3 font-['Pretendard',sans-serif] text-lg font-bold text-[#16140f]">
                다음 모집 안내 받기
              </h3>

              <p className="mt-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
                전화번호를 남겨주시면 다음 모집 시 안내 연락을 드리겠습니다.
              </p>

              <div className="mt-4">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  disabled={formState === "success" || formState === "duplicate"}
                  className="w-full rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 focus:outline-none disabled:opacity-50"
                />
              </div>

              {formState === "success" && (
                <div className="mt-3 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-[#2f9e44]" strokeWidth={2} />
                  <span className="font-['Pretendard',sans-serif] text-sm text-[#2f9e44]">
                    등록되었습니다. 다음 모집 시 연락 드리겠습니다.
                  </span>
                </div>
              )}

              {formState === "duplicate" && (
                <p className="mt-3 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  이미 등록된 번호입니다.
                </p>
              )}

              {formState === "error" && (
                <p className="mt-3 font-['Pretendard',sans-serif] text-sm text-[#b42318]">
                  {errorMsg}
                </p>
              )}

              {formState !== "success" && formState !== "duplicate" && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || phone.replace(/-/g, "").length < 10}
                  className="mt-3 h-10 w-full rounded-md bg-[#16140f] font-['Pretendard',sans-serif] text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isPending ? "등록 중..." : "등록하기"}
                </button>
              )}
            </div>
          )}

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-[#ddd9cc] px-4 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f] hover:bg-[#fcfcf8]"
            >
              SPEC 홈으로 돌아가기
            </Link>
            <a
              href="https://instagram.com/skku_spec"
              target="_blank"
              rel="noopener noreferrer"
              className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] underline hover:text-[#4a4a40]"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
