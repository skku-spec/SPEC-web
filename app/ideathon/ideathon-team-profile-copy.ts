import type { UserRole } from "@/lib/auth-shared";

type ProfileCopy = {
  readonly roleLabel: string;
  readonly formTitle: string;
  readonly formDescription: string;
  readonly abilityLabel: string;
  readonly abilityHelper: string;
  readonly interestLabel: string;
  readonly interestPlaceholder: string;
  readonly summaryAbilityPrefix: string | null;
  readonly cardAbilityLabel: string;
  readonly tableAbilityHeader: string;
  readonly tableFocusHeader: string;
  readonly startupReason: {
    readonly label: string;
    readonly placeholder: string;
  };
  readonly teamStyle: {
    readonly label: string;
    readonly placeholder: string;
  };
  readonly decemberGoal: {
    readonly label: string;
    readonly placeholder: string;
  };
  readonly lookingForTeammates: {
    readonly label: string;
    readonly placeholder: string;
  };
  readonly freeAppeal: {
    readonly label: string;
    readonly modalLabel: string;
    readonly placeholder: string;
  };
};

type ProfileFocusSource = {
  readonly role: UserRole;
  readonly december_goal: string;
  readonly team_style: string;
};

const learnerCopy: ProfileCopy = {
  roleLabel: "러너",
  formTitle: "내 소개 작성하기",
  formDescription: "지금 형성되는 팀은 12월 데모데이까지 함께 달리게 됩니다. 본인을 진실되게 써주세요.",
  abilityLabel: "능력 태그",
  abilityHelper: "본인을 가장 잘 보여주는 능력을 선택해 주세요.",
  interestLabel: "관심 분야 태그",
  interestPlaceholder: "예: B2B, SaaS, 커머스",
  summaryAbilityPrefix: null,
  cardAbilityLabel: "능력 태그",
  tableAbilityHeader: "능력/도움 태그",
  tableFocusHeader: "12월 목표/지원",
  startupReason: {
    label: "창업인 이유",
    placeholder: "왜 지금 창업을 해보고 싶은지 솔직하게 적어주세요.",
  },
  teamStyle: {
    label: "팀에서의 성향",
    placeholder: "일할 때 편한 방식, 의사결정 스타일, 강한 역할을 적어주세요.",
  },
  decemberGoal: {
    label: "12월 데모데이까지 얻어가고 싶은 것",
    placeholder: "12월까지 팀과 함께 만들고 싶은 결과를 적어주세요.",
  },
  lookingForTeammates: {
    label: "함께 찾는 팀원",
    placeholder: "어떤 동료와 함께 달리고 싶은지 적어주세요.",
  },
  freeAppeal: {
    label: "자유 어필 (선택)",
    modalLabel: "자유 어필",
    placeholder: "본인을 더 잘 보여줄 수 있는 말을 자유롭게 적어주세요.",
  },
};

const preneurCopy: ProfileCopy = {
  roleLabel: "프러너",
  formTitle: "프러너 소개 작성하기",
  formDescription:
    "프러너는 러너 팀 옆에서 방향을 함께 정리하고 막히는 구간을 같이 풀어주는 역할입니다. 어떤 사람인지, 어떤 팀을 잘 도울 수 있는지 진실되게 써주세요.",
  abilityLabel: "도움 가능 태그",
  abilityHelper: "러너 팀에게 실제로 도와줄 수 있는 영역을 선택해 주세요.",
  interestLabel: "관심/경험 분야 태그",
  interestPlaceholder: "예: B2B, SaaS, 고객 인터뷰",
  summaryAbilityPrefix: "도움 가능",
  cardAbilityLabel: "도움 가능",
  tableAbilityHeader: "능력/도움 태그",
  tableFocusHeader: "12월 목표/지원",
  startupReason: {
    label: "저는 이런 사람입니다",
    placeholder: "지금까지의 경험, 관심사, 러너 팀에게 보여주고 싶은 본인의 모습을 적어주세요.",
  },
  teamStyle: {
    label: "팀을 도울 때의 방식",
    placeholder: "멘토링, 고객 검증, 기획 정리처럼 어떤 방식으로 팀을 도울 때 편한지 적어주세요.",
  },
  decemberGoal: {
    label: "12월 데모데이까지 팀에게 남기고 싶은 것",
    placeholder: "러너 팀이 데모데이까지 어떤 상태에 도달하도록 돕고 싶은지 적어주세요.",
  },
  lookingForTeammates: {
    label: "제가 잘 도울 수 있는 팀",
    placeholder: "어떤 문제를 풀거나 어떤 단계에 있는 팀을 특히 잘 도울 수 있는지 적어주세요.",
  },
  freeAppeal: {
    label: "관련 경험과 한마디 (선택)",
    modalLabel: "관련 경험과 한마디",
    placeholder: "관련 경험이나 러너 팀에게 전하고 싶은 말을 자유롭게 적어주세요.",
  },
};

export function getIdeathonTeamProfileCopy(role: UserRole): ProfileCopy {
  return role === "preneur" ? preneurCopy : learnerCopy;
}

export function getIdeathonProfileFocusText(profile: ProfileFocusSource): string {
  return profile.role === "preneur" ? profile.team_style : profile.december_goal;
}
