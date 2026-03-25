import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CategoryTabs from "@/components/blog/CategoryTabs";

const sampleTags = [
  { id: "1", name: "운영", slug: "operations" },
  { id: "2", name: "마케팅", slug: "marketing" },
  { id: "3", name: "프로덕트", slug: "product" },
];

describe("CategoryTabs", () => {
  it("renders '전체보기' as the first tab", () => {
    render(
      <CategoryTabs tags={sampleTags} activeTag={null} onTagChange={vi.fn()} />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("전체보기");
  });

  it("renders all tags as buttons", () => {
    render(
      <CategoryTabs tags={sampleTags} activeTag={null} onTagChange={vi.fn()} />
    );

    expect(screen.getByText("운영")).toBeInTheDocument();
    expect(screen.getByText("마케팅")).toBeInTheDocument();
    expect(screen.getByText("프로덕트")).toBeInTheDocument();
  });

  it("shows totalCount in '전체보기' when provided", () => {
    render(
      <CategoryTabs
        tags={sampleTags}
        activeTag={null}
        onTagChange={vi.fn()}
        totalCount={128}
      />
    );

    expect(screen.getByText("전체보기 (128)")).toBeInTheDocument();
  });

  it("calls onTagChange(null) when clicking '전체보기'", () => {
    const onTagChange = vi.fn();
    render(
      <CategoryTabs tags={sampleTags} activeTag="operations" onTagChange={onTagChange} />
    );

    fireEvent.click(screen.getByText("전체보기"));

    expect(onTagChange).toHaveBeenCalledWith(null);
  });

  it("calls onTagChange with tag slug when clicking a tag", () => {
    const onTagChange = vi.fn();
    render(
      <CategoryTabs tags={sampleTags} activeTag={null} onTagChange={onTagChange} />
    );

    fireEvent.click(screen.getByText("마케팅"));

    expect(onTagChange).toHaveBeenCalledWith("marketing");
  });

  it("applies active style to the selected tag", () => {
    render(
      <CategoryTabs tags={sampleTags} activeTag="operations" onTagChange={vi.fn()} />
    );

    const operationsBtn = screen.getByText("운영");
    expect(operationsBtn.className).toContain("bg-[#16140f]");
    expect(operationsBtn.className).toContain("text-white");
  });

  it("applies active style to '전체보기' when activeTag is null", () => {
    render(
      <CategoryTabs tags={sampleTags} activeTag={null} onTagChange={vi.fn()} />
    );

    const allBtn = screen.getByText("전체보기");
    expect(allBtn.className).toContain("bg-[#16140f]");
  });
});
