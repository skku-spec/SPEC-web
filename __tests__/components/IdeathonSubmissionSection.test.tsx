import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import IdeathonSubmissionSection from "@/app/ideathon/IdeathonSubmissionSection";

type MockUser = {
  isAuthenticated: boolean;
  role: "outsider" | "learner" | "alumni" | "preneur";
  isLoading: boolean;
  user: null;
  profile: null;
  refreshUser: () => Promise<void>;
};

const mockGetMyIdeas = vi.fn<() => Promise<{ success: boolean; data?: unknown[]; error?: string }>>();
const mockSubmitIdea = vi.fn<(formData: FormData) => Promise<{ success?: boolean; error?: string }>>();
const mockUpdateIdea = vi.fn<(ideaId: string, formData: FormData) => Promise<{ success?: boolean; error?: string }>>();
const mockUseUser = vi.fn<() => MockUser>();

vi.mock("@/lib/actions/ideas", () => ({
  getMyIdeas: () => mockGetMyIdeas(),
  submitIdea: (formData: FormData) => mockSubmitIdea(formData),
  updateIdea: (ideaId: string, formData: FormData) => mockUpdateIdea(ideaId, formData),
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
    href: string;
    children: ReactNode;
    className?: string;
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

describe("IdeathonSubmissionSection", () => {
  beforeEach(() => {
    mockGetMyIdeas.mockReset();
    mockSubmitIdea.mockReset();
    mockUpdateIdea.mockReset();
    mockUseUser.mockReset();
    mockUseUser.mockReturnValue(defaultUser);
  });

  const sampleIdea = {
    id: "idea-1",
    title: "기존 아이디어",
    description: "현재 팀 매칭용 아이디어입니다.",
    target_customer: null,
    competitors: null,
    market_size: null,
    team_members: null,
    pdf_url: "https://example.com/idea.pdf",
    user_id: "user-1",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  };

  it("shows login CTA for unauthenticated users and hides form fields", async () => {
    mockUseUser.mockReturnValue(defaultUser);
    mockGetMyIdeas.mockResolvedValue({ success: true, data: [] });

    render(<IdeathonSubmissionSection />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("link", { name: "SPEC 계정으로 로그인" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "아이디어 제출하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "아이디어명 / 프로젝트명" })).not.toBeInTheDocument();
  });

  it("shows saved ideas for authenticated members and render edit button", async () => {
    mockUseUser.mockReturnValue({
      ...defaultUser,
      isAuthenticated: true,
      role: "learner",
    });
    mockGetMyIdeas.mockResolvedValue({ success: true, data: [sampleIdea] });

    render(<IdeathonSubmissionSection />);

    await screen.findByText("기존 아이디어");
    expect(screen.getByText("기존 아이디어")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기존 아이디어 수정" })).toBeInTheDocument();
  });

  it("calls updateIdea for edited idea and shows 수정 완료 with updated title", async () => {
    const user = userEvent.setup();

    mockUseUser.mockReturnValue({
      ...defaultUser,
      isAuthenticated: true,
      role: "learner",
    });
    mockGetMyIdeas.mockResolvedValue({ success: true, data: [sampleIdea] });
    mockUpdateIdea.mockResolvedValue({ success: true });

    render(<IdeathonSubmissionSection />);

    await user.click(await screen.findByRole("button", { name: "기존 아이디어 수정" }));

    const titleInput = await screen.findByLabelText(/아이디어명 \/ 프로젝트명/);
    await user.clear(titleInput);
    await user.type(titleInput, "수정된 아이디어");

    await user.click(screen.getByRole("button", { name: "아이디어 수정하기" }));

    await screen.findByText("수정 완료");

    expect(mockUpdateIdea).toHaveBeenCalledTimes(1);
    expect(mockUpdateIdea).toHaveBeenCalledWith(
      "idea-1",
      expect.any(FormData),
    );
    const [, payload] = mockUpdateIdea.mock.calls[0] ?? [];
    expect(payload).toBeInstanceOf(FormData);
    if (payload instanceof FormData) {
      expect(payload.get("title")).toBe("수정된 아이디어");
      expect(payload.get("pdf_url")).toBe("https://example.com/idea.pdf");
    }
    expect(screen.getByText("수정 완료")).toBeInTheDocument();
    expect(screen.getByText("수정된 아이디어")).toBeInTheDocument();
  });

  it("refreshes saved ideas after a new submission so the real row id is available for editing", async () => {
    const user = userEvent.setup();
    const createdIdea = {
      ...sampleIdea,
      id: "real-created-id",
      title: "새 아이디어",
      description: "새 설명입니다.",
      pdf_url: null,
    };

    mockUseUser.mockReturnValue({
      ...defaultUser,
      isAuthenticated: true,
      role: "learner",
    });
    mockGetMyIdeas.mockResolvedValueOnce({ success: true, data: [] });
    mockGetMyIdeas.mockResolvedValueOnce({ success: true, data: [createdIdea] });
    mockSubmitIdea.mockResolvedValue({ success: true });
    mockUpdateIdea.mockResolvedValue({ success: true });

    render(<IdeathonSubmissionSection />);

    await screen.findByRole("button", { name: "새 아이디어로 새로 제출" });
    await user.type(screen.getByLabelText(/아이디어명 \/ 프로젝트명/), "새 아이디어");
    await user.type(screen.getByLabelText(/해결하려는 문제 및 솔루션 설명/), "새 설명입니다.");
    await user.click(screen.getByRole("button", { name: "아이디어 제출하기" }));

    await screen.findByText("아이디어가 성공적으로 등록되었습니다!");
    await user.click(screen.getByRole("button", { name: "추가 제출하기" }));
    await user.click(await screen.findByRole("button", { name: "새 아이디어 수정" }));
    await user.click(screen.getByRole("button", { name: "아이디어 수정하기" }));

    expect(mockGetMyIdeas).toHaveBeenCalledTimes(2);
    expect(mockUpdateIdea).toHaveBeenCalledWith(
      "real-created-id",
      expect.any(FormData),
    );
  });

  it("shows validation error when required fields are empty and does not call updateIdea", async () => {
    const user = userEvent.setup();

    mockUseUser.mockReturnValue({
      ...defaultUser,
      isAuthenticated: true,
      role: "learner",
    });
    mockGetMyIdeas.mockResolvedValue({ success: true, data: [sampleIdea] });

    render(<IdeathonSubmissionSection />);

    await user.click(await screen.findByRole("button", { name: "기존 아이디어 수정" }));
    await user.clear(await screen.findByLabelText(/아이디어명 \/ 프로젝트명/));
    await user.clear(await screen.findByLabelText(/해결하려는 문제 및 솔루션 설명/));

    await user.click(screen.getByRole("button", { name: "아이디어 수정하기" }));

    expect(await screen.findByText("아이디어명과 설명은 필수 입력 항목입니다.")).toBeInTheDocument();
    expect(mockUpdateIdea).not.toHaveBeenCalled();
    expect(mockSubmitIdea).not.toHaveBeenCalled();
  });

  it("renders exactly one required description textarea", async () => {
    mockUseUser.mockReturnValue({
      ...defaultUser,
      isAuthenticated: true,
      role: "learner",
    });
    mockGetMyIdeas.mockResolvedValue({ success: true, data: [sampleIdea] });

    const { container } = render(<IdeathonSubmissionSection />);

    await screen.findByRole("button", { name: "새 아이디어로 새로 제출" });
    const descriptionTextareas = container.querySelectorAll('textarea[name="description"]');

    expect(descriptionTextareas).toHaveLength(1);
    expect(descriptionTextareas[0]).toBeRequired();
  });
});
