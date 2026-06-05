import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import IdeathonTeamBoardSection from "@/app/ideathon/IdeathonTeamBoardSection";
import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";

type MockUser = {
  readonly isAuthenticated: boolean;
  readonly role: "outsider" | "learner" | "alumni" | "preneur";
  readonly isLoading: boolean;
  readonly user: null;
  readonly profile: null;
  readonly refreshUser: () => Promise<void>;
};

const mockGetIdeathonBoardData = vi.fn<() => Promise<{ success: boolean; data?: IdeathonBoardData; error?: string }>>();
const mockUpsertMyIdeathonProfile = vi.fn<(formData: FormData) => Promise<{ success: boolean; error?: string }>>();
const mockUseUser = vi.fn<() => MockUser>();

vi.mock("@/lib/actions/ideathon-profiles", () => ({
  getIdeathonBoardData: () => mockGetIdeathonBoardData(),
  upsertMyIdeathonProfile: (formData: FormData) => mockUpsertMyIdeathonProfile(formData),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    ...props
  }: {
    readonly href: string;
    readonly children: ReactNode;
    readonly className?: string;
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

const defaultUser: MockUser = {
  isAuthenticated: false,
  role: "outsider",
  isLoading: false,
  user: null,
  profile: null,
  refreshUser: async () => {},
};

const sampleData: IdeathonBoardData = {
  currentUser: {
    id: "user-1",
    name: "홍길동",
    role: "learner",
  },
  member: {
    department: "경영학과",
    major: "경영학",
    student_id: "2020123456",
  },
  myProfile: {
    id: "board-1",
    user_id: "user-1",
    photo_url: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.jpg",
    department: "경영학과",
    major: "경영학",
    age: 23,
    student_id: "2020123456",
    grade: "3학년",
    ability_tags: ["개발", "기획"],
    interest_tags: ["B2B"],
    startup_reason: "문제를 직접 풀어보고 싶어서 창업에 관심이 생겼습니다.",
    team_style: "빠르게 정리하고 실행하는 편입니다.",
    december_goal: "12월 데모데이까지 고객 검증을 끝내고 싶습니다.",
    looking_for_teammates: "고객 검증을 끝까지 같이 해볼 팀원을 찾고 있습니다.",
    appeal: "진실되게 오래 달릴 팀을 찾고 있습니다.",
    portfolio_url: "https://example.com/",
    sns_url: null,
    published_at: "2026-06-04T00:00:00.000Z",
    created_at: "2026-06-04T00:00:00.000Z",
    updated_at: "2026-06-04T00:00:00.000Z",
  },
  profiles: [
    {
      id: "board-1",
      user_id: "user-1",
      name: "홍길동",
      role: "learner",
      photo_url: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.jpg",
      department: "경영학과",
      major: "경영학",
      age: 23,
      student_id: "2020123456",
      grade: "3학년",
      ability_tags: ["개발", "기획"],
      interest_tags: ["B2B"],
      startup_reason: "문제를 직접 풀어보고 싶어서 창업에 관심이 생겼습니다.",
      team_style: "빠르게 정리하고 실행하는 편입니다.",
      december_goal: "12월 데모데이까지 고객 검증을 끝내고 싶습니다.",
      looking_for_teammates: "고객 검증을 끝까지 같이 해볼 팀원을 찾고 있습니다.",
      appeal: "진실되게 오래 달릴 팀을 찾고 있습니다.",
      portfolio_url: "https://example.com/",
      sns_url: null,
      published_at: "2026-06-04T00:00:00.000Z",
      created_at: "2026-06-04T00:00:00.000Z",
      updated_at: "2026-06-04T00:00:00.000Z",
    },
    {
      id: "board-2",
      user_id: "user-2",
      name: "김프러너",
      role: "preneur",
      photo_url: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-2/preneur.jpg",
      department: "소프트웨어학과",
      major: "소프트웨어",
      age: 24,
      student_id: "2019123456",
      grade: "4학년",
      ability_tags: ["영업", "운영"],
      interest_tags: ["SaaS"],
      startup_reason: "고객을 직접 만나 문제를 해결하는 과정이 좋아서입니다.",
      team_style: "논의는 짧게, 검증은 빠르게 가져갑니다.",
      december_goal: "데모데이까지 실제 매출을 만들고 싶습니다.",
      looking_for_teammates: "세일즈와 고객 인터뷰를 함께 밀어붙일 팀원을 찾고 있습니다.",
      appeal: "고객 인터뷰와 세일즈를 끈질기게 가져갈 수 있습니다.",
      portfolio_url: null,
      sns_url: "https://instagram.com/spec",
      published_at: "2026-06-04T00:00:00.000Z",
      created_at: "2026-06-04T00:00:00.000Z",
      updated_at: "2026-06-04T00:00:00.000Z",
    },
  ],
};

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseUser.mockReturnValue(defaultUser);
  mockGetIdeathonBoardData.mockResolvedValue({ success: true, data: sampleData });
  mockUpsertMyIdeathonProfile.mockResolvedValue({ success: true });
});

describe("IdeathonTeamBoardSection", () => {
  it("shows a login CTA for unauthenticated visitors without loading board data", async () => {
    render(<IdeathonTeamBoardSection />);
    await flushPromises();

    expect(screen.getByRole("link", { name: "SPEC 계정으로 로그인" })).toHaveAttribute(
      "href",
      "/login?redirect=/ideathon#team-board",
    );
    expect(mockGetIdeathonBoardData).not.toHaveBeenCalled();
  });

  it("blocks alumni before requesting board data", async () => {
    mockUseUser.mockReturnValue({ ...defaultUser, isAuthenticated: true, role: "alumni" });

    render(<IdeathonTeamBoardSection />);
    await flushPromises();

    expect(screen.getByText("팀빌딩 보드는 러너와 프러너만 열람할 수 있습니다.")).toBeInTheDocument();
    expect(mockGetIdeathonBoardData).not.toHaveBeenCalled();
  });

  it("loads learner board data and filters cards by ability tag", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({ ...defaultUser, isAuthenticated: true, role: "learner" });

    render(<IdeathonTeamBoardSection />);

    expect(await screen.findByRole("button", { name: "홍길동 열어보기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "김프러너 열어보기" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("관심 태그 필터"), "SaaS");

    expect(screen.queryByRole("button", { name: "홍길동 열어보기" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "김프러너 열어보기" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("관심 태그 필터"), "all");
    await user.selectOptions(screen.getByLabelText("능력 태그 필터"), "영업");

    expect(screen.queryByRole("button", { name: "홍길동 열어보기" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "김프러너 열어보기" })).toBeInTheDocument();
  });

  it("renders the authenticated mobile profile summary and reopens writing placeholders", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({ ...defaultUser, isAuthenticated: true, role: "learner" });

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
    window.dispatchEvent(new Event("resize"));
    render(<IdeathonTeamBoardSection />);

    expect(await screen.findByText("소개 작성 완료")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "내 소개 수정하기" }));

    expect(screen.getByText("내 소개 작성하기")).toBeInTheDocument();
    expect(screen.getByLabelText("사진 업로드")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("왜 지금 창업을 해보고 싶은지 솔직하게 적어주세요.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("일할 때 편한 방식, 의사결정 스타일, 강한 역할을 적어주세요.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("12월까지 팀과 함께 만들고 싶은 결과를 적어주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내 소개 저장하기" })).toBeInTheDocument();
  });

  it("switches to table view and opens a participant modal", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({ ...defaultUser, isAuthenticated: true, role: "learner" });

    render(<IdeathonTeamBoardSection />);

    await screen.findByText("김프러너");
    await user.click(screen.getByRole("button", { name: "표 보기" }));

    const table = screen.getByRole("table", { name: "아이디어톤 러너 프러너 명단" });
    expect(within(table).getByText("이름")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "김프러너 열어보기" }));

    const dialog = screen.getByRole("dialog", { name: "김프러너 소개" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("데모데이까지 실제 매출을 만들고 싶습니다.")).toBeInTheDocument();
  });

  it("opens the profile form when the current user's modal edit CTA is clicked", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({ ...defaultUser, isAuthenticated: true, role: "learner" });

    render(<IdeathonTeamBoardSection />);

    await user.click(await screen.findByRole("button", { name: "홍길동 열어보기" }));

    const dialog = screen.getByRole("dialog", { name: "홍길동 소개" });
    await user.click(within(dialog).getByRole("button", { name: "내 소개 수정하기" }));

    expect(screen.queryByRole("dialog", { name: "홍길동 소개" })).not.toBeInTheDocument();
    expect(screen.getByText("내 소개 작성하기")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내 소개 저장하기" })).toBeInTheDocument();
  });

  it("submits the current user's edited profile as FormData", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({ ...defaultUser, isAuthenticated: true, role: "learner" });

    render(<IdeathonTeamBoardSection />);

    await user.click(await screen.findByRole("button", { name: "내 소개 수정하기" }));
    expect(screen.getByDisplayValue("진실되게 오래 달릴 팀을 찾고 있습니다.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/자유 어필/), {
      target: { value: "고객에게 오래 머무는 팀원이 되고 싶습니다." },
    });
    await user.click(screen.getByRole("button", { name: "내 소개 저장하기" }));

    expect(mockUpsertMyIdeathonProfile).toHaveBeenCalledWith(expect.any(FormData));
    const [payload] = mockUpsertMyIdeathonProfile.mock.calls[0] ?? [];
    expect(payload).toBeInstanceOf(FormData);
    if (payload instanceof FormData) {
      expect(payload.get("appeal")).toBe("고객에게 오래 머무는 팀원이 되고 싶습니다.");
      expect(payload.getAll("ability_tags")).toEqual(["개발", "기획"]);
    }
  });
});
