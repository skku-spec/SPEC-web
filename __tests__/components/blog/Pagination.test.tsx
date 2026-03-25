import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "@/components/blog/Pagination";

describe("Pagination", () => {
  it("returns null when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders prev and next buttons", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByLabelText("이전 페이지")).toBeInTheDocument();
    expect(screen.getByLabelText("다음 페이지")).toBeInTheDocument();
  });

  it("disables prev button on first page", () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByLabelText("이전 페이지")).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByLabelText("다음 페이지")).toBeDisabled();
  });

  it("calls onPageChange when clicking prev", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText("이전 페이지"));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when clicking next", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText("다음 페이지"));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("shows mobile prev/next text buttons", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByText("이전")).toBeInTheDocument();
    expect(screen.getByText("다음")).toBeInTheDocument();
  });
});
