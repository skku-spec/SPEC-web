import { describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

const viMockWithVirtual = vi.mock as unknown as (
  path: string,
  factory: () => Record<string, never>,
  options: { virtual: boolean },
) => void;

viMockWithVirtual("server-only", () => ({}), { virtual: true });

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockedDeps.createClient,
}));

import { getPublicAuthorHref } from "@/lib/public-profile";

describe("getPublicAuthorHref", () => {
  it("returns canonical /profile/[slug] for eligible roles", () => {
    expect(
      getPublicAuthorHref({
        slug: "jane-doe",
        role: "preneur",
      }),
    ).toBe("/profile/jane-doe");
  });

  it("returns null for outsider role", () => {
    expect(
      getPublicAuthorHref({
        slug: "jane-doe",
        role: "outsider",
      }),
    ).toBeNull();
  });

  it("returns null when slug is missing", () => {
    expect(
      getPublicAuthorHref({
        slug: "",
        role: "learner",
      }),
    ).toBeNull();
  });
});
