import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  updateTag: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockedDeps.refresh,
  }),
}));

vi.mock("@/lib/actions/tags", () => ({
  createTag: mockedDeps.createTag,
  deleteTag: mockedDeps.deleteTag,
  updateTag: mockedDeps.updateTag,
}));

import TagsClient from "@/app/admin/tags/TagsClient";

describe("TagsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDeps.createTag.mockResolvedValue({ success: true });
    mockedDeps.deleteTag.mockResolvedValue({ success: true });
    mockedDeps.updateTag.mockResolvedValue({ success: true });
  });

  it("refreshes the route after creating a tag", async () => {
    const user = userEvent.setup();
    render(<TagsClient initialTags={[]} />);

    await user.click(screen.getByRole("button", { name: "태그 추가" }));
    await user.type(screen.getByPlaceholderText("태그 이름"), "QA 태그");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(mockedDeps.createTag).toHaveBeenCalledWith("QA 태그", "qa-태그");
      expect(mockedDeps.refresh).toHaveBeenCalledTimes(1);
    });
  });

  it("refreshes the route after deleting a tag", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <TagsClient
        initialTags={[
          {
            id: "tag-1",
            label: "운영",
            slug: "operations",
            postCount: 0,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));

    await waitFor(() => {
      expect(mockedDeps.deleteTag).toHaveBeenCalledWith("tag-1");
      expect(mockedDeps.refresh).toHaveBeenCalledTimes(1);
    });
  });
});
