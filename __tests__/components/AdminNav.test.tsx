import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { LayoutDashboard, Users } from "lucide-react";

import { DesktopAdminNav } from "@/app/admin/AdminNav";

const mockPrefetch = vi.fn();

let mockPathname = "/admin";

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

const items = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "멤버", href: "/admin/users", icon: Users },
];

describe("DesktopAdminNav", () => {
  beforeEach(() => {
    mockPathname = "/admin";
    mockPrefetch.mockClear();
  });

  it("marks the clicked sidebar item active immediately before navigation completes", () => {
    render(<DesktopAdminNav items={items} />);

    const dashboardLink = screen.getByRole("link", { name: "대시보드" });
    const usersLink = screen.getByRole("link", { name: "멤버" });

    expect(dashboardLink).toHaveAttribute("aria-current", "page");
    expect(usersLink).not.toHaveAttribute("aria-current");

    fireEvent.click(usersLink);

    expect(usersLink).toHaveAttribute("aria-current", "page");
    expect(dashboardLink).not.toHaveAttribute("aria-current");
    expect(usersLink.querySelector("span:last-child")).toHaveClass("animate-pulse");
  });
});
