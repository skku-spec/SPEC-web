"use client";

import { useTransition, useState } from "react";
import { submitApplication } from "@/lib/actions/applications";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  RECRUITMENT_BATCH,
  RECRUITMENT_SCHEDULE_SUMMARY,
} from "@/lib/recruitment-schedule";

interface ApplicationFormClientProps {
  dbFields?: Record<string, unknown>[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ApplicationFormClient(_props: ApplicationFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: 기본 정보
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");

  // Step 1: Q1-Q3
  const [introduction, setIntroduction] = useState(""); // Q1: 왜 창업인가
  const [vision, setVision] = useState(""); // Q2: 직접 해본 것
  const [startupIdea, setStartupIdea] = useState(""); // Q3: 30주 뒤

  // Step 2: Q4-Q6
  const [fridayParticipation, setFridayParticipation] = useState(""); // Q4: 금요일 참여
  const [teamRole, setTeamRole] = useState(""); // Q5: 팀에서 나는
  const [additionalComments, setAdditionalComments] = useState(""); // Q6: 하고 싶은 말 (선택)

  // Step 3: 동의
  const [acceptedConsent, setAcceptedConsent] = useState(false);

  const stepLabels = ["기본 정보", "지원 질문 (1)", "지원 질문 (2)", "동의 확인"];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let formattedValue = "";

    if (value.length <= 3) {
      formattedValue = value;
    } else if (value.length <= 7) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }

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
    if (step === 3 && !acceptedConsent) {
      setError("개인정보 수집 및 이용에 동의해야 제출할 수 있습니다.");
      return;
    }

    startTransition(async () => {
      const result = await submitApplication(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        window.scrollTo(0, 0);
      }
    });
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-24 text-center animate-in fade-in zoom-in duration-700">
        <div className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8 md:p-12 lg:p-20 shadow-xl">
          <h1 className="mb-6 text-3xl font-black tracking-tight text-[#16140f] [font-family:system-ui,-apple-system,sans-serif] sm:text-4xl">
            지원이 완료되었습니다!
          </h1>
          
          <div className="space-y-6 text-lg leading-relaxed text-[#6b6b5e] font-['Pretendard',sans-serif]">
            <p>
              성균관대학교 실전창업동아리 <span className="font-bold text-[#16140f]">{RECRUITMENT_BATCH.shortLabel}</span>에 <br className="hidden md:block"/>
              소중한 시간을 내어 지원해주셔서 진심으로 감사합니다.
            </p>
            
            <div className="mx-auto max-w-[480px] rounded-lg bg-[#fcfcf8] p-6 text-sm text-left border border-[#f0efe6]">
              <h3 className="font-bold text-[#16140f] mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6C0F]"></span> 추가 모집 절차
              </h3>
              <div className="space-y-3 text-[#4a4a40]">
                {RECRUITMENT_SCHEDULE_SUMMARY.map((step, index) => (
                  <div key={step.title}>
                    <div className="flex justify-between">
                      <span>{step.title}</span>
                      <span className={`font-semibold ${step.highlight ? "text-[#FF6C0F]" : "text-[#16140f]"}`}>
                        {step.date}
                      </span>
                    </div>
                    {index === 1 || index === RECRUITMENT_SCHEDULE_SUMMARY.length - 1 ? (
                      <div className="h-px bg-[#eae9e2] my-1"></div>
                    ) : null}
                  </div>
                ))}
                <div className="space-y-1 text-[#6b6b5e]">
                  <p>• <span className="font-semibold text-[#4a4a40]">안내 채널:</span> 지원서에 기재하신 개별 이메일</p>
                  <p>• <span className="font-semibold text-[#4a4a40]">문의:</span> 전도현 (회장) 010-9445-0964</p>
                  <p className="pl-[18px]">spec.skku@gmail.com</p>
                </div>
              </div>
            </div>

            <p className="text-sm italic text-[#9a9a8c]">
              작성하신 정성만큼 깊이 고민하고 신중하게 검토하겠습니다.
            </p>
          </div>

          <div className="mt-12">
            <button
              onClick={() => router.push("/")}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#16140f] px-4 font-['Pretendard',sans-serif] text-base font-semibold text-white transition-colors hover:bg-[#2a2820] sm:h-16 sm:w-auto sm:px-12 sm:text-xl"
            >
              홈으로 이동하기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-14 md:pt-20">
      <div className="mb-12 flex justify-center">
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
                <span className={`mt-1.5 text-[11px] font-medium ${
                  step >= i ? "text-[#16140f]" : "text-[#6b6b5e]"
                } hidden sm:block`}>
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
            <div className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8 space-y-7 shadow-sm">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step {step + 1} of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">
                  기본 정보
                </h2>
                <p className="mt-2 text-sm text-[#6b6b5e] font-normal">이름, 학번, 연락처 등 기본 정보를 입력해주세요.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">이름 *</span>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all"
                    placeholder="홍길동"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">학번 *</span>
                  <input
                    name="student_id"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    maxLength={10}
                    className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all"
                    placeholder="2024000000"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">이메일 *</span>
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all"
                    placeholder="example@skku.edu"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">연락처 *</span>
                  <input
                    name="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    required
                    className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all"
                    placeholder="010-0000-0000"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">전공 *</span>
                  <input
                    name="major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    required
                    className="h-12 w-full rounded-md border border-[#ddd9cc] px-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all"
                    placeholder="글로벌경영학과"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">학년 *</span>
                  <CustomSelect
                    name="grade"
                    value={grade}
                    onChange={setGrade}
                    options={[
                      { value: "1", label: "1학년" },
                      { value: "2", label: "2학년" },
                      { value: "3", label: "3학년" },
                      { value: "4", label: "4학년" },
                      { value: "5+", label: "5학년 이상" },
                    ]}
                    placeholder="학년 선택"
                    className="h-12"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">현재 상태 *</span>
                  <CustomSelect
                    name="enrollment_status"
                    value={enrollmentStatus}
                    onChange={setEnrollmentStatus}
                    options={[
                      { value: "재학", label: "재학" },
                      { value: "휴학", label: "휴학" },
                      { value: "졸업유예", label: "졸업유예" },
                      { value: "대학원생", label: "대학원생" },
                    ]}
                    placeholder="재학 상태 선택"
                    className="h-12"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#16140f]">지원 차수 *</span>
                  <CustomSelect
                    name="batch"
                    defaultValue="4"
                    options={[{ value: RECRUITMENT_BATCH.value, label: RECRUITMENT_BATCH.learnerLabel }]}
                    className="h-12"
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => router.push("/apply")}
                className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14"
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="h-12 flex-[2] rounded-md bg-[#16140f] font-semibold text-white transition-opacity hover:opacity-90 sm:h-14"
              >
                다음 단계로 →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Q1-Q3 지원 질문 ──────────────────────── */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8 space-y-10 shadow-sm">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step {step + 1} of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">
                  지원 질문 (1/2)
                </h2>
                <p className="mt-2 text-sm text-[#6b6b5e] font-normal">각 질문에 솔직하고 구체적으로 답변해주세요.</p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">
                  Q1. 왜 창업인가요? *
                </span>
                <p className="mb-3 text-xs text-[#6b6b5e]">창업에 관심을 가지게 된 계기와 이유를 자유롭게 작성해주세요. (최소 50자, 현재 {introduction.length}자)</p>
                <textarea
                  name="introduction"
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  required
                  rows={6}
                  maxLength={5000}
                  className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed"
                  placeholder="창업에 관심을 가지게 된 배경, 해결하고 싶은 문제, 또는 만들고 싶은 가치에 대해 작성해주세요."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">
                  Q2. 지금까지 직접 해본 것들을 알려주세요. *
                </span>
                <p className="mb-3 text-xs text-[#6b6b5e]">창업, 프로젝트, 팀 활동 등 어떤 경험이든 좋습니다. (최소 50자, 현재 {vision.length}자)</p>
                <textarea
                  name="vision"
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  required
                  rows={6}
                  maxLength={5000}
                  className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed"
                  placeholder="진행한 프로젝트, 참여한 활동, 운영 경험 등을 구체적으로 작성해주세요."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">
                  Q3. SPEC에서의 30주가 끝난 후, 어떤 모습이고 싶나요? *
                </span>
                <p className="mb-3 text-xs text-[#6b6b5e]">SPEC 활동을 통해 달성하고 싶은 목표를 작성해주세요. (최소 50자, 현재 {startupIdea.length}자)</p>
                <textarea
                  name="startup_idea"
                  value={startupIdea}
                  onChange={(e) => setStartupIdea(e.target.value)}
                  required
                  rows={6}
                  maxLength={5000}
                  className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed"
                  placeholder="SPEC 활동을 통해 달성하고 싶은 구체적인 목표나 변화를 작성해주세요."
                />
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={goToPrevStep}
                className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14"
                disabled={isPending}
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="h-12 flex-[2] rounded-md bg-[#16140f] font-semibold text-white transition-opacity hover:opacity-90 sm:h-14"
              >
                다음 단계로 →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Q4-Q6 지원 질문 ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8 space-y-10 shadow-sm">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step {step + 1} of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">
                  지원 질문 (2/2)
                </h2>
                <p className="mt-2 text-sm text-[#6b6b5e] font-normal">활동 참여와 팀워크에 대해 답변해주세요.</p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">
                  Q4. SPEC은 매주 금요일 정기 활동을 진행합니다. 참여 가능 여부와 각오를 알려주세요. *
                </span>
                <p className="mb-3 text-xs text-[#6b6b5e]">최소 10자 (현재 {fridayParticipation.length}자)</p>
                <textarea
                  name="portfolio_url"
                  value={fridayParticipation}
                  onChange={(e) => setFridayParticipation(e.target.value)}
                  required
                  rows={4}
                  maxLength={5000}
                  className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed"
                  placeholder="금요일 정기 활동 참여 가능 여부와 함께, 활동에 임하는 자세를 작성해주세요."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">
                  Q5. 팀에서 본인은 어떤 사람인가요? *
                </span>
                <p className="mb-3 text-xs text-[#6b6b5e]">팀 내에서의 역할과 협업 스타일을 알려주세요. (최소 50자, 현재 {teamRole.length}자)</p>
                <textarea
                  name="experience_extra"
                  value={teamRole}
                  onChange={(e) => setTeamRole(e.target.value)}
                  required
                  rows={6}
                  maxLength={5000}
                  className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed"
                  placeholder="팀 프로젝트에서 주로 맡는 역할, 갈등 해결 방식, 협업 시 중요하게 생각하는 가치 등을 작성해주세요."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#16140f]">
                  Q6. 마지막으로 하고 싶은 말이 있다면 자유롭게 작성해주세요. (선택)
                </span>
                <p className="mb-3 text-xs text-[#6b6b5e]">선택 사항입니다. (현재 {additionalComments.length}자)</p>
                <textarea
                  name="additional_comments"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  className="w-full rounded-md border border-[#ddd9cc] p-4 text-sm focus:border-[#FF6C0F] focus:ring-1 focus:ring-[#FF6C0F] focus:outline-none transition-all leading-relaxed"
                  placeholder="포트폴리오 링크, 추가 어필 사항, 또는 궁금한 점이 있다면 작성해주세요."
                />
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={goToPrevStep}
                className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14"
                disabled={isPending}
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="h-12 flex-[2] rounded-md bg-[#16140f] font-semibold text-white transition-opacity hover:opacity-90 sm:h-14"
              >
                다음 단계로 →
              </button>
            </div>
          </div>
        )}

        {/* Hidden inputs to preserve data across steps for final submission */}
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
        <input type="hidden" name="batch" value={RECRUITMENT_BATCH.value} />

        {/* ── Step 3: 동의 확인 ──────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[10px] border border-[#ddd9cc] bg-white p-5 sm:p-8 space-y-7 shadow-sm">
              <div className="border-b border-[#f0efe6] pb-4">
                <p className="text-xs font-medium text-[#FF6C0F] mb-1">Step {step + 1} of 4</p>
                <h2 className="text-2xl font-bold text-[#16140f] [font-family:system-ui,-apple-system,sans-serif]">
                  개인정보 수집 및 동의
                </h2>
                <p className="mt-2 text-sm text-[#6b6b5e] font-normal">지원 완료를 위해 동의가 필요합니다.</p>
              </div>

              <div className="rounded-lg border border-[#f0efe6] bg-[#fcfcf8] p-4 text-sm leading-relaxed text-[#6b6b5e] sm:p-6">
                <h3 className="font-bold text-[#16140f] mb-3">개인정보 수집 및 이용 안내</h3>
                <ul className="space-y-2 list-disc pl-4">
                  <li>수집 항목: 성명, 학번, 이메일, 연락처, 전공, 학년, 재학 상태, 자기소개 등 지원 시 기재한 내용</li>
                  <li>수집 목적: {RECRUITMENT_BATCH.shortLabel} 선발 및 활동 관리</li>
                  <li>보유 기간: 선발 종료 후 1년 간 보관 후 파기</li>
                </ul>
                <p className="mt-4 text-xs font-medium text-[#16140f]">
                  * 귀하는 동의를 거부할 권리가 있으나, 동의 거부 시 선발 과정에서 제외될 수 있습니다.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-4">
                <input
                  id="consent-checkbox"
                  type="checkbox"
                  checked={acceptedConsent}
                  onChange={(e) => setAcceptedConsent(e.target.checked)}
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-[#ddd9cc] text-[#FF6C0F] focus:ring-[#FF6C0F] sm:h-5 sm:w-5"
                />
                <label htmlFor="consent-checkbox" className="text-sm font-medium text-[#16140f] select-none cursor-pointer">
                  개인정보 수집 및 이용에 동의합니다. (필수)
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={goToPrevStep}
                className="h-12 flex-1 rounded-md border border-[#ddd9cc] font-semibold text-[#6b6b5e] transition-colors hover:bg-gray-50 sm:h-14"
                disabled={isPending}
              >
                이전으로
              </button>
              <button
                type="submit"
                disabled={isPending || !acceptedConsent}
                className="h-12 flex-[2] rounded-md bg-[#FF6C0F] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30 sm:h-14"
              >
                {isPending ? "제출 처리 중..." : "최종 제출하기 →"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
