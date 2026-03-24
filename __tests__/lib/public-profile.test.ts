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
  it("returns canonical /profile/[slug] for public profiles", () => {
    expect(
      getPublicAuthorHref({
        slug: "jane-doe",
        role: "preneur",
        profile_visibility: "public",
      }),
    ).toBe("/profile/jane-doe");
  });

  it("returns null for private profiles", () => {
    expect(
      getPublicAuthorHref({
        slug: "jane-doe",
        role: "preneur",
        profile_visibility: "private",
      }),
    ).toBeNull();
  });
});
