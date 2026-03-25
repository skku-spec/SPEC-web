import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SortSelect } from "@/components/blog/SortSelect";

describe("SortSelect", () => {
  it("renders both sort options", () => {
    render(<SortSelect value="newest" onChange={vi.fn()} />);

    expect(screen.getByText("최신순")).toBeInTheDocument();
    expect(screen.getByText("조회수 높은순")).toBeInTheDocument();
  });

  it("highlights the active option with semibold", () => {
    render(<SortSelect value="newest" onChange={vi.fn()} />);

    expect(screen.getByText("최신순").className).toContain("font-semibold");
    expect(screen.getByText("조회수 높은순").className).not.toContain("font-semibold");
  });

  it("calls onChange with 'views' when clicking '조회수 높은순'", () => {
    const onChange = vi.fn();
    render(<SortSelect value="newest" onChange={onChange} />);

    fireEvent.click(screen.getByText("조회수 높은순"));

    expect(onChange).toHaveBeenCalledWith("views");
  });

  it("calls onChange with 'newest' when clicking '최신순'", () => {
    const onChange = vi.fn();
    render(<SortSelect value="views" onChange={onChange} />);

    fireEvent.click(screen.getByText("최신순"));

    expect(onChange).toHaveBeenCalledWith("newest");
  });

  it("renders a pipe separator", () => {
    const { container } = render(<SortSelect value="newest" onChange={vi.fn()} />);

    expect(container.textContent).toContain("|");
  });
});
