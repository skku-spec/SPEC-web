import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminBottomNav from "@/app/admin/AdminBottomNav";

const mockPrefetch = vi.fn();

let mockPathname = "/admin/attendance";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    prefetch: mockPrefetch,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, className, ...props }: ComponentProps<"a">) => (
    <a href={href} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe("AdminBottomNav", () => {
  beforeEach(() => {
    mockPathname = "/admin/attendance";
    mockPrefetch.mockClear();
  });

  it("does not leave the closed more sheet dialog in the document flow", () => {
    render(<AdminBottomNav />);

    expect(screen.queryByRole("dialog", { name: "관리자 메뉴" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "더보기" }));

    expect(screen.getByRole("dialog", { name: "관리자 메뉴" })).toBeInTheDocument();
  });
});
