import { notFound } from "next/navigation";

import IdeathonProfileHarnessClient from "@/app/ideathon/qa-profile-collapse/IdeathonProfileHarnessClient";
import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";

const USER_ID = "qa-profile-collapse-user";
const PHOTO_URL = "/images/common/logo.png";

const initialProfile: NonNullable<IdeathonBoardData["myProfile"]> = {
  id: "qa-profile-collapse-profile",
  user_id: USER_ID,
  photo_url: PHOTO_URL,
  department: "QA학과",
  major: "QA전공",
  age: 23,
  student_id: "2099123456",
  grade: "3학년",
  ability_tags: ["개발", "기획"],
  interest_tags: ["B2B"],
  startup_reason: "진실되게 오래 달릴 팀을 찾고 있습니다.",
  team_style: "빠르게 정리하고 실행하는 편입니다.",
  december_goal: "12월 데모데이까지 고객 검증을 끝내고 싶습니다.",
  looking_for_teammates: "고객 검증을 끝까지 같이 해볼 팀원을 찾고 있습니다.",
  appeal: "QA 중에도 실제 사용 흐름을 꼼꼼하게 봅니다.",
  portfolio_url: null,
  sns_url: null,
  published_at: "2026-06-05T00:00:00.000Z",
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const initialData: IdeathonBoardData = {
  currentUser: {
    id: USER_ID,
    name: "QA러너",
    role: "learner",
  },
  member: {
    department: "QA학과",
    major: "QA전공",
    student_id: "2099123456",
  },
  myProfile: initialProfile,
  profiles: [{ ...initialProfile, name: "QA러너", role: "learner" }],
};

export default function QaProfileCollapsePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <IdeathonProfileHarnessClient
      initialData={initialData}
      failureDepartment="서버실패학과"
      failureMessage="QA 저장 실패입니다."
    />
  );
}
