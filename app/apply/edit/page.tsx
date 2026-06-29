"use client";

import { useTransition, useState, useEffect } from "react";
import { updateMyApplication, getMyApplicationDetail } from "@/lib/actions/applications";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/ui/CustomSelect";
import { RECRUITMENT_BATCH } from "@/lib/recruitment-schedule";

export default function EditApplicationPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Step 0: 기본 정보
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");

  // Step 1: Q1-Q3
  const [introduction, setIntroduction] = useState("");
  const [vision, setVision] = useState("");
  const [startupIdea, setStartupIdea] = useState("");

  // Step 2: Q4-Q6
  const [fridayParticipation, setFridayParticipation] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  const stepLabels = ["기본 정보", "지원 질문 (1)", "지원 질문 (2)", "최종 확인"];

  useEffect(() => {
    async function fetchDetail() {
      const result = await getMyApplicationDetail();
      if (result.success && result.application) {
        const app = result.application;
        setName(app.name || "");
        setStudentId(app.student_id || "");
        setEmail(app.email || "");
        setPhone(app.phone || "");
        setMajor(app.major || "");
        setGrade(app.grade || "");
        setEnrollmentStatus(app.enrollment_status || "");
        setIntroduction(app.introduction || "");
        setVision(app.vision || "");
        setStartupIdea(app.startup_idea || "");
        setFridayParticipation(app.portfolio_url || "");
        setTeamRole(app.experience_extra || "");
        setAdditionalComments(app.additional_comments || "");
        setIsLoading(false);
      } else {
        router.push("/apply");
      }
    }
    void fetchDetail();
  }, [router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let formattedValue = "";
    if (value.length <= 3) formattedValue = value;
    else if (value.length <= 7) formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    else formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    setPhone(formattedValue);
  };

  const validateStep = (currentStep: number) => {
    setError(null);
    if (currentStep === 0) {
      if (!name || !studentId || !email || !phone || !major || !grade || !enrollmentStatus) {
        setError("기본 정보의 모든 필수 항목을 입력해주세요.");
        return false;
      }
      if (studentId.length < 8) {
        setError("올바른 학번을 입력해주세요.");
        return false;
      }
    } else if (currentStep === 1) {
      if (!introduction || !vision || !startupIdea) {
        setError("모든 필수 질문에 답변해주세요.");
        return false;
      }
      if (introduction.length < 50) {
        setError(`Q1 답변은 최소 50자 이상 작성해야 합니다. (현재 ${introduction.length}자)`);
        return false;
      }
      if (vision.length < 50) {
        setError(`Q2 답변은 최소 50자 이상 작성해야 합니다. (현재 ${vision.length}자)`);
        return false;
      }
      if (startupIdea.length < 50) {
        setError(`Q3 답변은 최소 50자 이상 작성해야 합니다. (현재 ${startupIdea.length}자)`);
        return false;
      }
    } else if (currentStep === 2) {
      if (!fridayParticipation || !teamRole) {
        setError("Q4, Q5 질문에 답변해주세요.");
        return false;
      }
      if (fridayParticipation.length < 10) {
        setError(`Q4 답변은 최소 10자 이상 작성해야 합니다. (현재 ${fridayParticipation.length}자)`);
        return false;
      }
      if (teamRole.length < 50) {
        setError(`Q5 답변은 최소 50자 이상 작성해야 합니다. (현재 ${teamRole.length}자)`);
        return false;
      }
    }
    return true;
  };

  const goToNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPrevStep = () => {
    setError(null);
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateMyApplication(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        window.scrollTo(0, 0);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6C0F] border-t-transparent mx-auto"></div>
          <p className="mt-4 font-['Pretendard',sans-serif] text-[#6b6b5e]">기존 지원서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-24 text-center animate-in fade-in zoom-in duration-700">
        <div className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 shadow-xl sm:p-8 md:p-12 lg:p-20">
          <h1 className="mb-6 text-3xl font-black tracking-tight text-[#16140f] [font-family:system-ui,-apple-system,sans-serif] sm:text-4xl">
            지원서 수정 완료!
          </h1>
          <p className="text-lg text-[#6b6b5e] font-['Pretendard',sans-serif]">
            수정된 내용이 안전하게 저장되었습니다.
          </p>
          <div className="mt-12">
            <button
              onClick={() => router.push("/apply")}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-base font-semibold text-white transition-colors hover:bg-[#2a2820] sm:h-16 sm:w-auto sm:px-12 sm:text-xl"
            >
              지원 페이지로 돌아가기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-14 md:pt-20">
      {/* Progress bar */}
      <div className="mb-12 flex flex-col items-center">
        <h1 className="text-3xl font-black text-[#16140f] [font-family:system-ui,-apple-system,sans-serif] mb-6">지원서 수정하기</h1>
        <div className="flex items-center gap-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    step > i ? "bg-[#16140f] text-white" : step === i ? "bg-[#FF6C0F] text-white" : "bg-[#ddd9cc] text-[#6b6b5e]"
                  }`}
                >
                  {step > i ? "✓" : i + 1}
                </div>
                <span className={`mt-1.5 text-[11px] font-medium ${step >= i ? "text-[#16140f]" : "text-[#6b6b5e]"} hidden sm:block`}>
                  {stepLabels[i]}
                </span>
              </div>
              {i < 3 && (
                <div className={`mx-2 sm:mx-3 mt-[15px] h-[2px] w-6 sm:w-8 md:w-12 rounded-full ${step > i ? "bg-[#16140f]" : "bg-[#ddd9cc]"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form action={handleSubmit} className="mx-auto max-w-[800px]">
        {/* ── Step 0: 기본 정보 ──────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-7 rounded-[10px] border border-[#ddd9cc] bg-white p-5 shadow-sm sm:p-8">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step 1 of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">기본 정보 수정</h2>
                <p className="mt-2 text-sm text-[#6b6b5e] font-normal">수정이 필요한 항목을 변경해주세요.</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">이름 *</span>
                  <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all" placeholder="홍길동" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">학번 *</span>
                  <input name="student_id" value={studentId} onChange={(e) => setStudentId(e.target.value)} required maxLength={10} className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all" placeholder="2024000000" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">이메일 *</span>
                  <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all" placeholder="example@skku.edu" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">연락처 *</span>
                  <input name="phone" value={phone} onChange={handlePhoneChange} maxLength={13} required className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all" placeholder="010-0000-0000" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">전공 *</span>
                  <input name="major" value={major} onChange={(e) => setMajor(e.target.value)} required className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all" placeholder="글로벌경영학과" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">학년 *</span>
                  <CustomSelect name="grade" value={grade} onChange={setGrade} options={[{ value: "1", label: "1학년" }, { value: "2", label: "2학년" }, { value: "3", label: "3학년" }, { value: "4", label: "4학년" }, { value: "5+", label: "5학년 이상" }]} placeholder="학년 선택" className="h-12" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">현재 상태 *</span>
                  <CustomSelect name="enrollment_status" value={enrollmentStatus} onChange={setEnrollmentStatus} options={[{ value: "재학", label: "재학" }, { value: "휴학", label: "휴학" }, { value: "졸업유예", label: "졸업유예" }, { value: "대학원생", label: "대학원생" }]} placeholder="재학 상태 선택" className="h-12" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">지원 차수 *</span>
                  <CustomSelect name="batch" defaultValue={RECRUITMENT_BATCH.value} options={[{ value: RECRUITMENT_BATCH.value, label: RECRUITMENT_BATCH.learnerLabel }]} className="h-12" />
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">{error}</div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button type="button" onClick={() => router.push("/apply")} className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14">취소</button>
              <button type="button" onClick={goToNextStep} className="h-12 flex-[2] rounded-md bg-[#16140f] font-semibold text-white transition-opacity hover:opacity-90 sm:h-14">다음 단계로 →</button>
            </div>
          </div>
        )}

        {/* ── Step 1: Q1-Q3 ──────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-10 rounded-[10px] border border-[#ddd9cc] bg-white p-5 shadow-sm sm:p-8">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step 2 of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">지원 질문 (1/2)</h2>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">Q1. 왜 창업인가요? *</span>
                <p className="mb-3 text-xs text-[#6b6b5e]">최소 50자 (현재 {introduction.length}자)</p>
                <textarea name="introduction" value={introduction} onChange={(e) => setIntroduction(e.target.value)} required rows={6} maxLength={5000} className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">Q2. 지금까지 직접 해본 것들을 알려주세요. *</span>
                <p className="mb-3 text-xs text-[#6b6b5e]">최소 50자 (현재 {vision.length}자)</p>
                <textarea name="vision" value={vision} onChange={(e) => setVision(e.target.value)} required rows={6} maxLength={5000} className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">Q3. SPEC에서의 30주가 끝난 후, 어떤 모습이고 싶나요? *</span>
                <p className="mb-3 text-xs text-[#6b6b5e]">최소 50자 (현재 {startupIdea.length}자)</p>
                <textarea name="startup_idea" value={startupIdea} onChange={(e) => setStartupIdea(e.target.value)} required rows={6} maxLength={5000} className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed" />
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">{error}</div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button type="button" onClick={goToPrevStep} className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14" disabled={isPending}>이전으로</button>
              <button type="button" onClick={goToNextStep} className="h-12 flex-[2] rounded-md bg-[#16140f] font-semibold text-white transition-opacity hover:opacity-90 sm:h-14">다음 단계로 →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Q4-Q6 ──────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-10 rounded-[10px] border border-[#ddd9cc] bg-white p-5 shadow-sm sm:p-8">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step 3 of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">지원 질문 (2/2)</h2>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">Q4. 매주 금요일 정기 활동 참여 가능 여부와 각오 *</span>
                <p className="mb-3 text-xs text-[#6b6b5e]">최소 10자 (현재 {fridayParticipation.length}자)</p>
                <textarea name="portfolio_url" value={fridayParticipation} onChange={(e) => setFridayParticipation(e.target.value)} required rows={4} maxLength={5000} className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">Q5. 팀에서 본인은 어떤 사람인가요? *</span>
                <p className="mb-3 text-xs text-[#6b6b5e]">최소 50자 (현재 {teamRole.length}자)</p>
                <textarea name="experience_extra" value={teamRole} onChange={(e) => setTeamRole(e.target.value)} required rows={6} maxLength={5000} className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">Q6. 마지막으로 하고 싶은 말 (선택)</span>
                <p className="mb-3 text-xs text-[#6b6b5e]">현재 {additionalComments.length}자</p>
                <textarea name="additional_comments" value={additionalComments} onChange={(e) => setAdditionalComments(e.target.value)} rows={4} maxLength={5000} className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed" />
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">{error}</div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button type="button" onClick={goToPrevStep} className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14" disabled={isPending}>이전으로</button>
              <button type="button" onClick={goToNextStep} className="h-12 flex-[2] rounded-md bg-[#16140f] font-semibold text-white transition-opacity hover:opacity-90 sm:h-14">다음 단계로 →</button>
            </div>
          </div>
        )}

        {/* Hidden inputs */}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="major" value={major} />
        <input type="hidden" name="grade" value={grade} />
        <input type="hidden" name="enrollment_status" value={enrollmentStatus} />
        <input type="hidden" name="introduction" value={introduction} />
        <input type="hidden" name="vision" value={vision} />
        <input type="hidden" name="startup_idea" value={startupIdea} />
        <input type="hidden" name="portfolio_url" value={fridayParticipation} />
        <input type="hidden" name="experience_extra" value={teamRole} />
        <input type="hidden" name="additional_comments" value={additionalComments} />
        <input type="hidden" name="batch" value="4" />

        {/* ── Step 3: 최종 확인 ──────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-7 rounded-[10px] border border-[#ddd9cc] bg-white p-5 shadow-sm sm:p-8">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step 4 of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">수정 사항 최종 확인</h2>
                <p className="mt-2 text-sm text-[#6b6b5e] font-normal">수정하신 내용을 확인하신 후 완료 버튼을 눌러주세요.</p>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">{error}</div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button type="button" onClick={goToPrevStep} className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14" disabled={isPending}>이전으로</button>
              <button type="submit" disabled={isPending} className="h-12 flex-[2] rounded-md bg-[#FF6C0F] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30 sm:h-14">
                {isPending ? "수정 처리 중..." : "수정 완료하기 →"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
