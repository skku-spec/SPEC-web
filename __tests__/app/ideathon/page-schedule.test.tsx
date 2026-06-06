import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import IdeathonPage from "@/app/ideathon/page";

vi.mock("@/app/ideathon/IdeathonScrollHero", () => ({
  IdeathonScrollHero: () => <div>Mocked Ideathon Scroll Hero</div>,
}));

vi.mock("@/app/ideathon/IdeathonTeamBoardSection", () => ({
  default: () => <section>Mocked Ideathon Team Board Section</section>,
}));

vi.mock("@/app/ideathon/IdeathonPartnersFaqSection", () => ({
  default: () => <section>Mocked Ideathon Partners FAQ Section</section>,
}));

vi.mock("@/app/ideathon/IdeathonSubmissionSection", () => ({
  default: () => <section>Mocked Ideathon Submission Section</section>,
}));

describe("IdeathonPage schedule", () => {
  it("renders the updated Day 1 opening block when the ideathon page loads", () => {
    render(<IdeathonPage />);

    const dayOneHeading = screen.getByText("6/6 (토)");
    const dayOneColumn = dayOneHeading.closest("div");

    expect(dayOneColumn).not.toBeNull();

    const dayOneScope = within(dayOneColumn ?? document.body);

    expect(dayOneScope.getByText("12:00 ~ 13:00")).toBeInTheDocument();
    expect(dayOneScope.getByText("출석 (luma QR 이용)")).toBeInTheDocument();
    expect(dayOneScope.getByText("참가자 집합 및 행사 안내")).toBeInTheDocument();
    expect(dayOneScope.getByText("프러너")).toBeInTheDocument();
    expect(dayOneScope.getByText("공간 사용 안내 및 알파브라더스 소개")).toBeInTheDocument();
    expect(dayOneScope.getByText("전체 일정, 운영 방식, 팀빌딩/발표 기준 안내")).toBeInTheDocument();
    expect(
      dayOneScope.getByText("프러너 소개: 아이디어톤 페이지에 띄워두고 1분 자기 소개"),
    ).toBeInTheDocument();
  });

  it("renders all late Day 1 rows and removes stale timeline copy", () => {
    render(<IdeathonPage />);

    const dayOneHeading = screen.getByText("6/6 (토)");
    const dayOneColumn = dayOneHeading.closest("div");

    expect(dayOneColumn).not.toBeNull();

    const dayOneScope = within(dayOneColumn ?? document.body);

    const expectedDayOneCopy = [
      "13:00 ~ 14:30",
      "아이디어 개별/자유 피칭",
      "개별 아이디어 또는 관심 문제를 짧게 공유하고 팀빌딩 후보를 형성 (1인당 5분 피칭 + 3분 QA)",
      "14:30 ~ 15:00",
      "휴식 및 팀빌딩 준비",
      "아이디어 분류, 관심 팀 후보 정리, 스피드 데이팅 준비",
      "15:00 ~ 17:00",
      "팀 스피드 데이팅 및 팀빌딩",
      "관심 아이디어별 대화 후 팀 구성 확정",
      "17:00 ~ 18:00",
      "팀 회의",
      "팀별 아이디어 문제 정의, 타깃 고객, 해결 방식, 초기 검증 방향 구체화 정리",
      "18:00 ~ 19:00",
      "저녁 식사",
      "배달 식사 제공 및 멘토링 세션 준비",
      "19:00 ~ 19:05",
      "오프닝 및 멘토 소개",
      "멘토 소개, 세션 목적, 진행 방식 안내",
      "19:05 ~ 19:35",
      "멘토 창업 스토리 공유",
      "이정민 대표·배지현 변리사 각 15분 내외로 경험과 관점 공유",
      "19:50 ~ 20:50",
      "팀별 간단 피칭 및 멘토 피드백",
      "팀별 핵심 아이디어 공유 후 사업성·실행 가능성·권리화 관점 피드백",
      "각 팀 총 10분씩 (3분 발표, 7분 피드백)피드백",
      "20:50 ~ 21:00",
      "마무리 코멘트",
      "공통 피드백 정리 및 Day 2 발표 준비 방향 안내",
    ] as const;

    for (const text of expectedDayOneCopy) {
      expect(dayOneScope.getByText(text)).toBeInTheDocument();
    }

    expect(dayOneScope.getByText("19:35 ~ 19:50")).toBeInTheDocument();
    expect(dayOneScope.getByText("질의 응답")).toBeInTheDocument();
    expect(dayOneScope.queryByText("아이디어 검증, 팀빌딩, 실행, 첫 고객 등")).not.toBeInTheDocument();
    expect(dayOneScope.getByText("21:00 ~")).toBeInTheDocument();
    expect(dayOneScope.getByText("야식 및 팀별 자율 작업")).toBeInTheDocument();
    expect(dayOneScope.getByText("팀별 피드백 반영 및 자유 작업")).toBeInTheDocument();

    expect(dayOneScope.queryByText("12:30 - 13:00")).not.toBeInTheDocument();
    expect(dayOneScope.queryByText("아이스브레이킹")).not.toBeInTheDocument();
    expect(dayOneScope.queryByText("18:25 - 18:50")).not.toBeInTheDocument();
    expect(dayOneScope.queryByText("키워드 토크")).not.toBeInTheDocument();
    expect(dayOneScope.queryByText("아이스브레이킹 및 자유 네트워킹")).not.toBeInTheDocument();
    expect(dayOneScope.queryByText("14:00 ~ 15:30")).not.toBeInTheDocument();
    expect(dayOneScope.queryByText("15:30 ~ 17:00")).not.toBeInTheDocument();
    expect(dayOneScope.queryByText("18:00 ~ 18:20")).not.toBeInTheDocument();
  });

  it("renders the updated Day 2 schedule while preserving event metadata cards", () => {
    render(<IdeathonPage />);

    const dayTwoHeading = screen.getByText("6/7 (일)");
    const dayTwoColumn = dayTwoHeading.closest("div");

    expect(dayTwoColumn).not.toBeNull();

    const dayTwoScope = within(dayTwoColumn ?? document.body);

    expect(dayTwoScope.getByText("09:00 ~ 10:00")).toBeInTheDocument();
    expect(dayTwoScope.getByText("아침 식사 및 팀별 최종 작업")).toBeInTheDocument();
    expect(
      dayTwoScope.getByText("아침 배달 식사 제공, 전날 피드백 반영 사항 점검, 발표 자료 구조 확정, 팀별 리허설"),
    ).toBeInTheDocument();
    expect(dayTwoScope.getByText("10:00 ~ 11:20")).toBeInTheDocument();
    expect(dayTwoScope.getByText("팀별 최종 발표")).toBeInTheDocument();
    expect(dayTwoScope.getByText("팀별 발표 진행 및 질의응답")).toBeInTheDocument();
    expect(dayTwoScope.getByText("각팀 10분 (7분 발표 + 3분 QA)")).toBeInTheDocument();
    expect(dayTwoScope.getByText("11:20 ~ 11:50")).toBeInTheDocument();
    expect(dayTwoScope.getByText("심사위원 Q&A 및 총평")).toBeInTheDocument();
    expect(dayTwoScope.getByText("전체 질의응답, 공통 피드백, 후속 실행 방향 코멘트")).toBeInTheDocument();
    expect(dayTwoScope.getByText("11:50 ~ 12:10")).toBeInTheDocument();
    expect(dayTwoScope.getByText("시상 및 마무리")).toBeInTheDocument();
    expect(dayTwoScope.getByText("우수 팀 발표, 행사 회고, 후속 일정 안내")).toBeInTheDocument();

    expect(screen.getByText("EVENT DATE")).toBeInTheDocument();
    expect(screen.getByText("2026.06.06 (토) - 2026.06.07 (일)")).toBeInTheDocument();
    expect(screen.getByText("VENUE")).toBeInTheDocument();
    expect(screen.getByText("알파브러더스 사무실")).toBeInTheDocument();
  });
});
