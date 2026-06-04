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
