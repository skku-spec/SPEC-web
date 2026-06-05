import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import IdeathonTeamProfileForm from "@/app/ideathon/IdeathonTeamProfileForm";
import type { IdeathonBoardData } from "@/lib/actions/ideathon-profiles";

const mockUpsertMyIdeathonProfile = vi.fn<(formData: FormData) => Promise<{ success: boolean; error?: string }>>();
const uploadUrl = "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.png";

vi.mock("@/lib/actions/ideathon-profiles", () => ({
  upsertMyIdeathonProfile: (formData: FormData) => mockUpsertMyIdeathonProfile(formData),
}));

const formData: IdeathonBoardData = {
  currentUser: {
    id: "user-1",
    name: "홍길동",
    role: "learner",
  },
  member: {
    department: "",
    major: "",
    student_id: "",
  },
  myProfile: null,
  profiles: [],
};

const existingProfileData: IdeathonBoardData = {
  ...formData,
  myProfile: {
    id: "board-1",
    user_id: "user-1",
    photo_url: uploadUrl,
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
};

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function mockSuccessfulUploadFetch() {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        success: true,
        url: uploadUrl,
      }),
      { headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("IdeathonTeamProfileForm", () => {
  it("collapses completed profile into a summary card and reopens the form for editing", async () => {
    // Given
    const user = userEvent.setup();

    render(<IdeathonTeamProfileForm data={existingProfileData} onSaved={async () => {}} />);

    // Then
    expect(screen.getByText("소개 작성 완료")).toBeInTheDocument();
    expect(screen.getByAltText("홍길동 팀빌딩 보드 사진")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("경영학과")).toBeInTheDocument();
    expect(screen.getByText("개발, 기획")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "내 소개 저장하기" })).not.toBeInTheDocument();

    // When
    await user.click(screen.getByRole("button", { name: "내 소개 수정하기" }));

    // Then
    expect(screen.getByRole("button", { name: "내 소개 저장하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "개발" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the form open after a failed profile save", async () => {
    // Given
    const user = userEvent.setup();
    mockUpsertMyIdeathonProfile.mockResolvedValueOnce({ success: false, error: "저장에 실패했습니다." });

    render(<IdeathonTeamProfileForm data={existingProfileData} onSaved={async () => {}} />);

    // When
    await user.click(screen.getByRole("button", { name: "내 소개 수정하기" }));
    await user.click(screen.getByRole("button", { name: "내 소개 저장하기" }));

    // Then
    expect(await screen.findByText("저장에 실패했습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내 소개 저장하기" })).toBeInTheDocument();
    expect(screen.queryByText("소개 작성 완료")).not.toBeInTheDocument();
  });

  it("collapses the form after a successful first save and keeps the submitted summary visible", async () => {
    // Given
    const user = userEvent.setup();
    const onSaved = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    mockSuccessfulUploadFetch();
    mockUpsertMyIdeathonProfile.mockResolvedValueOnce({ success: true });

    render(<IdeathonTeamProfileForm data={formData} onSaved={onSaved} />);

    // When
    await user.upload(screen.getByLabelText("사진 업로드"), new File([new Uint8Array(1024)], "profile.png", { type: "image/png" }));
    await screen.findByText("사진이 업로드되었습니다.");
    await user.type(screen.getByLabelText("학과"), "컴퓨터교육과");
    await user.click(screen.getByRole("button", { name: "개발" }));
    await user.click(screen.getByRole("button", { name: "내 소개 저장하기" }));

    // Then
    expect(await screen.findByText("소개 작성 완료")).toBeInTheDocument();
    expect(screen.getByAltText("홍길동 팀빌딩 보드 사진")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("컴퓨터교육과")).toBeInTheDocument();
    expect(screen.getByText("개발")).toBeInTheDocument();
    expect(screen.getByText("내 소개가 저장되었습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "내 소개 저장하기" })).not.toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("renders selectable ability tag chips and submits selected chips as ability_tags FormData values", async () => {
    const user = userEvent.setup();
    mockUpsertMyIdeathonProfile.mockResolvedValueOnce({ success: true });

    render(<IdeathonTeamProfileForm data={formData} onSaved={async () => {}} />);

    expect(screen.queryByPlaceholderText("예: 기획, 개발, 디자인")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "기획" }));
    await user.click(screen.getByRole("button", { name: "개발" }));
    await user.click(screen.getByRole("button", { name: "내 소개 저장하기" }));

    expect(mockUpsertMyIdeathonProfile).toHaveBeenCalledWith(expect.any(FormData));
    const [payload] = mockUpsertMyIdeathonProfile.mock.calls[0] ?? [];
    expect(payload).toBeInstanceOf(FormData);
    if (payload instanceof FormData) {
      expect(payload.getAll("ability_tags")).toEqual(["기획", "개발"]);
    }
  });

  it("deselects all ability tags without preserving stale selected values", async () => {
    const user = userEvent.setup();
    mockUpsertMyIdeathonProfile.mockResolvedValueOnce({
      success: false,
      error: "사진과 본인을 나타내는 능력 태그는 필수입니다.",
    });

    render(<IdeathonTeamProfileForm data={existingProfileData} onSaved={async () => {}} />);

    await user.click(screen.getByRole("button", { name: "내 소개 수정하기" }));

    expect(screen.getByRole("button", { name: "개발" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "기획" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "개발" }));
    await user.click(screen.getByRole("button", { name: "기획" }));
    await user.click(screen.getByRole("button", { name: "내 소개 저장하기" }));

    const [payload] = mockUpsertMyIdeathonProfile.mock.calls[0] ?? [];
    expect(payload).toBeInstanceOf(FormData);
    if (payload instanceof FormData) {
      expect(payload.getAll("ability_tags")).toEqual([]);
    }
    expect(await screen.findByText("사진과 본인을 나타내는 능력 태그는 필수입니다.")).toBeInTheDocument();
  });

  it("renders visible placeholder copy for mobile writing fields", () => {
    render(<IdeathonTeamProfileForm data={formData} onSaved={async () => {}} />);

    expect(screen.getByPlaceholderText("왜 지금 창업을 해보고 싶은지 솔직하게 적어주세요.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("일할 때 편한 방식, 의사결정 스타일, 강한 역할을 적어주세요.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("12월까지 팀과 함께 만들고 싶은 결과를 적어주세요.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("어떤 동료와 함께 달리고 싶은지 적어주세요.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("본인을 더 잘 보여줄 수 있는 말을 자유롭게 적어주세요.")).toBeInTheDocument();
  });

  it("uploads the original file when browser image preprocessing is unavailable", async () => {
    const user = userEvent.setup();
    const fetchMock = mockSuccessfulUploadFetch();
    vi.stubGlobal("createImageBitmap", undefined);
    const original = new File([new Uint8Array(1024)], "profile.png", { type: "image/png" });

    render(<IdeathonTeamProfileForm data={formData} onSaved={async () => {}} />);

    await user.upload(screen.getByLabelText("사진 업로드"), original);

    expect(await screen.findByText("사진이 업로드되었습니다.")).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    if (init?.body instanceof FormData) {
      expect(init.body.get("image")).toBe(original);
    }
    expect(screen.getByLabelText("사진 업로드")).toBeInTheDocument();
  });

  it("uploads the smaller jpeg produced by browser image preprocessing", async () => {
    const user = userEvent.setup();
    const fetchMock = mockSuccessfulUploadFetch();
    const closeBitmap = vi.fn();
    const drawImage = vi.fn();
    const resizeCalls: Array<{ readonly width: number; readonly height: number; readonly quality: number | undefined }> = [];
    const nativeCreateElement = document.createElement.bind(document);

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn<() => Promise<ImageBitmap>>().mockResolvedValue({
        width: 4000,
        height: 2000,
        close: closeBitmap,
      } as ImageBitmap),
    );
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      const element = nativeCreateElement(tagName, options);
      if (tagName !== "canvas") {
        return element;
      }

      const canvas = element as HTMLCanvasElement;
      Object.defineProperty(canvas, "getContext", {
        value: () => ({ drawImage }),
      });
      Object.defineProperty(canvas, "toBlob", {
        value: (callback: BlobCallback, type?: string, quality?: number) => {
          resizeCalls.push({ width: canvas.width, height: canvas.height, quality });
          callback(new Blob([new Uint8Array(128)], { type: type ?? "image/jpeg" }));
        },
      });
      return canvas;
    }) as typeof document.createElement);

    render(<IdeathonTeamProfileForm data={formData} onSaved={async () => {}} />);

    await user.upload(screen.getByLabelText("사진 업로드"), new File([new Uint8Array(2048)], "profile.png", { type: "image/png" }));

    expect(await screen.findByText("모바일 업로드를 위해 사진을 가볍게 줄였어요.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/upload/ideathon-profile-image",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.body).toBeInstanceOf(FormData);
    if (init?.body instanceof FormData) {
      const image = init.body.get("image");
      expect(image).toBeInstanceOf(File);
      if (image instanceof File) {
        expect(image.name).toBe("profile.jpg");
        expect(image.type).toBe("image/jpeg");
        expect(image.size).toBe(128);
      }
    }
    expect(resizeCalls).toEqual([{ width: 1280, height: 640, quality: 0.82 }]);
    expect(drawImage).toHaveBeenCalled();
    expect(closeBitmap).toHaveBeenCalled();
    expect(screen.getByLabelText("사진 업로드")).toBeInTheDocument();
  });
});
