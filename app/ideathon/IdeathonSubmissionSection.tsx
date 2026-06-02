"use client";

import { useEffect, useState, useTransition } from "react";
import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { getMyIdeas, submitIdea, updateIdea } from "@/lib/actions/ideas";
import type { Database } from "@/lib/supabase/types";
import type { UserRole } from "@/lib/auth-shared";
import type { FormValues } from "@/app/ideathon/IdeathonSubmissionForm";
import IdeathonSubmissionForm from "@/app/ideathon/IdeathonSubmissionForm";
import IdeathonSubmissionFeedback from "@/app/ideathon/IdeathonSubmissionFeedback";
import IdeathonSubmissionIdeaList from "@/app/ideathon/IdeathonSubmissionIdeaList";

type IdeathonIdea = Database["public"]["Tables"]["ideathon_ideas"]["Row"];

type Feedback = {
  mode: "create" | "update";
  title: string;
};

const ALLOWED_IDEA_ROLES = ["learner", "alumni", "preneur"] as const satisfies readonly UserRole[];
const INITIAL_FORM: FormValues = {
  title: "",
  targetCustomer: "",
  description: "",
  competitors: "",
  marketSize: "",
  teamMembers: "",
  pdfUrl: "",
  pdfName: "",
};

function buildFormFromIdea(idea: IdeathonIdea): FormValues {
  return {
    title: idea.title,
    targetCustomer: idea.target_customer ?? "",
    description: idea.description,
    competitors: idea.competitors ?? "",
    marketSize: idea.market_size ?? "",
    teamMembers: idea.team_members ?? "",
    pdfUrl: idea.pdf_url ?? "",
    pdfName: idea.pdf_url ? "첨부된 PDF" : "",
  };
}

function toFormData(formValues: FormValues): FormData {
  const formData = new FormData();

  formData.append("title", formValues.title.trim());
  formData.append("target_customer", formValues.targetCustomer.trim());
  formData.append("description", formValues.description.trim());
  formData.append("competitors", formValues.competitors.trim());
  formData.append("market_size", formValues.marketSize.trim());
  formData.append("team_members", formValues.teamMembers.trim());
  formData.append("pdf_url", formValues.pdfUrl.trim());

  return formData;
}

function normalizeFormValues(formValues: FormValues): FormValues {
  return {
    title: formValues.title.trim(),
    targetCustomer: formValues.targetCustomer.trim(),
    description: formValues.description.trim(),
    competitors: formValues.competitors.trim(),
    marketSize: formValues.marketSize.trim(),
    teamMembers: formValues.teamMembers.trim(),
    pdfUrl: formValues.pdfUrl.trim(),
    pdfName: formValues.pdfName.trim(),
  };
}

function normalizeIdeaFromForm(selectedIdea: IdeathonIdea, formValues: FormValues, now: string): IdeathonIdea {
  return {
    ...selectedIdea,
    title: formValues.title.trim(),
    description: formValues.description.trim(),
    target_customer: formValues.targetCustomer || null,
    competitors: formValues.competitors || null,
    market_size: formValues.marketSize || null,
    team_members: formValues.teamMembers || null,
    pdf_url: formValues.pdfUrl || null,
    updated_at: now,
  };
}

export default function IdeathonSubmissionSection() {
  const { isAuthenticated, role, isLoading } = useUser();
  const canSubmit = isAuthenticated && ALLOWED_IDEA_ROLES.some((allowedRole) => allowedRole === role);
  const [ideas, setIdeas] = useState<readonly IdeathonIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<IdeathonIdea | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    const syncIdeas = async () => {
      if (!canSubmit) {
        await Promise.resolve();

        if (cancelled) {
          return;
        }

        setIdeas([]);
        setSelectedIdea(null);
        setFormValues(INITIAL_FORM);
        setFormError(null);
        setFeedback(null);
        setIsLoadingIdeas(false);
        return;
      }

      setIsLoadingIdeas(true);
      const result = await getMyIdeas();

      if (cancelled) {
        return;
      }

      if (!result.success) {
        setFormError(result.error ?? "아이디어 조회에 실패했습니다.");
      } else {
        setIdeas(result.data ?? []);
      }
      setIsLoadingIdeas(false);
    };

    syncIdeas();

    return () => {
      cancelled = true;
    };
  }, [canSubmit]);

  const onEditIdea = (idea: IdeathonIdea) => {
    setSelectedIdea(idea);
    setFormValues(buildFormFromIdea(idea));
    setFeedback(null);
    setFormError(null);
  };

  const onResetForNew = () => {
    setSelectedIdea(null);
    setFormValues(INITIAL_FORM);
    setFeedback(null);
    setFormError(null);
  };

  const updateFormField = (name: keyof FormValues, value: string) => {
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      if (!formValues.title.trim() || !formValues.description.trim()) {
        setFormError("아이디어명과 설명은 필수 입력 항목입니다.");
        return;
      }

      setFormError(null);
      const now = new Date().toISOString();
      const normalized = normalizeFormValues(formValues);

      if (selectedIdea) {
        const result = await updateIdea(selectedIdea.id, toFormData(normalized));
        if (result.error) {
          setFormError(result.error);
          return;
        }

        const nextIdea = normalizeIdeaFromForm(selectedIdea, normalized, now);
        setIdeas((previous) => previous.map((idea) => (idea.id === nextIdea.id ? nextIdea : idea)));
        setSelectedIdea(nextIdea);
        setFormValues(normalized);
        setFeedback({ mode: "update", title: normalized.title });
        return;
      }

      const result = await submitIdea(toFormData(normalized));
      if (result.error) {
        setFormError(result.error);
        return;
      }

      const refreshedIdeas = await getMyIdeas();
      if (refreshedIdeas.success) {
        setIdeas(refreshedIdeas.data ?? []);
      }
      setFormValues(INITIAL_FORM);
      setFeedback({ mode: "create", title: normalized.title });
    });
  };

  if (isLoading) {
    return (
      <section id="submit" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 bg-[#f5f5ee]/30">
        <div className="relative z-10 mx-auto max-w-[720px] px-6">
          <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
            <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
              사용자 정보를 확인 중입니다...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="submit" className="relative w-full py-16 md:py-24 border-t border-[#ddd9cc]/60 bg-[#f5f5ee]/30">
      <div className="relative z-10 mx-auto max-w-[720px] px-6">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          {feedback ? (
            <IdeathonSubmissionFeedback mode={feedback.mode} title={feedback.title} onReset={onResetForNew} />
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-6 w-6 text-[#FF6C0F]" />
                  <h2 className="font-['Pretendard',sans-serif] text-2xl font-semibold text-[#16140f]">
                    Idea Submission
                  </h2>
                </div>
                <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                  구상하신 혁신적인 비즈니스 아이디어를 공유해 주세요. 제출된 정보는 SPEC 학회원 모두에게 공유되며 공동창업자 매칭에 활용됩니다.
                </p>
              </div>

              {!isAuthenticated ? (
                <div className="flex flex-col items-center text-center py-6 space-y-4">
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    아이디어를 제출하려면 SPEC 멤버 로그인이 필요합니다.
                  </p>
                  <Link
                    href="/login?redirect=/ideathon#submit"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#16140f] px-6 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    SPEC 계정으로 로그인
                  </Link>
                </div>
              ) : !canSubmit ? (
                <div className="flex flex-col items-center text-center py-6 space-y-4">
                  <p className="font-['Pretendard',sans-serif] text-sm text-[#b42318] font-semibold">아이디어 제출 권한이 없습니다.</p>
                  <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                    SPEC 4기 러너, 알럼나이, 프러너 권한을 가진 계정으로 로그인해 주세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <IdeathonSubmissionIdeaList
                    ideas={ideas}
                    isLoadingIdeas={isLoadingIdeas}
                    onSelectIdea={onEditIdea}
                    onNewIdea={onResetForNew}
                  />
                  <IdeathonSubmissionForm
                    selectedIdeaTitle={selectedIdea?.title ?? null}
                    formValues={formValues}
                    isPending={isPending}
                    formError={formError}
                    onChange={updateFormField}
                    onSubmit={handleSubmit}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
