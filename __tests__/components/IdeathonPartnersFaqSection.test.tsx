import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import IdeathonPartnersFaqSection from "@/app/ideathon/IdeathonPartnersFaqSection";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

describe("IdeathonPartnersFaqSection", () => {
  it("keeps the Alpha Brothers logo visually smaller than profile avatars", () => {
    render(<IdeathonPartnersFaqSection />);

    const alphaLogo = screen.getByAltText("알파브라더스");

    expect(alphaLogo).toHaveAttribute("width", "48");
    expect(alphaLogo).toHaveAttribute("height", "48");
    expect(alphaLogo.className).toContain("h-12");
    expect(alphaLogo.className).toContain("w-12");
  });
});
