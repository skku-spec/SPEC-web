import { notFound } from "next/navigation";

import IdeathonProfileHarnessClient from "@/app/ideathon/qa-profile-collapse/IdeathonProfileHarnessClient";
import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";
import type { UserRole } from "@/lib/auth-shared";

const USER_ID = "qa-profile-collapse-user";
const PHOTO_URL = "/images/common/logo.png";

type QaRole = Extract<UserRole, "learner" | "preneur">;
type PageProps = {
  readonly searchParams: Promise<{ readonly role?: string }>;
};

function readQaRole(role: string | undefined): QaRole {
  return role === "preneur" ? "preneur" : "learner";
}

function buildInitialData(role: QaRole): IdeathonBoardData {
  const isPreneur = role === "preneur";
  const name = isPreneur ? "QA프러너" : "QA러너";
  const initialProfile: NonNullable<IdeathonBoardData["myProfile"]> = {
    id: "qa-profile-collapse-profile",
    user_id: USER_ID,
    photo_url: PHOTO_URL,
    department: "QA학과",
    major: "QA전공",
    age: isPreneur ? 24 : 23,
    student_id: "2099123456",
    grade: isPreneur ? "4학년" : "3학년",
    ability_tags: isPreneur ? ["영업", "운영"] : ["개발", "기획"],
    interest_tags: ["B2B"],
    startup_reason: isPreneur ? "저는 고객 인터뷰와 GTM을 오래 해본 프러너입니다." : "진실되게 오래 달릴 팀을 찾고 있습니다.",
    team_style: isPreneur ? "러너 팀 옆에서 가설을 좁히고 고객 검증 흐름을 같이 잡습니다." : "빠르게 정리하고 실행하는 편입니다.",
    december_goal: isPreneur
      ? "12월 데모데이까지 팀이 검증된 스토리를 말할 수 있게 돕고 싶습니다."
      : "12월 데모데이까지 고객 검증을 끝내고 싶습니다.",
    looking_for_teammates: isPreneur ? "B2B 문제를 파고드는 초기 팀을 잘 도울 수 있습니다." : "고객 검증을 끝까지 같이 해볼 팀원을 찾고 있습니다.",
    appeal: isPreneur ? "고객 인터뷰와 세일즈 경험을 나누겠습니다." : "QA 중에도 실제 사용 흐름을 꼼꼼하게 봅니다.",
    portfolio_url: null,
    sns_url: null,
    published_at: "2026-06-05T00:00:00.000Z",
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
  };

  return {
    currentUser: {
      id: USER_ID,
      name,
      role,
    },
    member: {
      department: "QA학과",
      major: "QA전공",
      student_id: "2099123456",
    },
    myProfile: initialProfile,
    profiles: [{ ...initialProfile, name, role }],
  };
}

export default async function QaProfileCollapsePage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const initialData = buildInitialData(readQaRole(params.role));

  return (
    <IdeathonProfileHarnessClient
      initialData={initialData}
      failureDepartment="서버실패학과"
      failureMessage="QA 저장 실패입니다."
    />
  );
}
