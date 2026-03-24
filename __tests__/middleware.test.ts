import { describe, expect, it } from "vitest";

import { isPrivateProfileRoute } from "@/middleware";

describe("isPrivateProfileRoute", () => {
  it("protects only private profile routes", () => {
    expect(isPrivateProfileRoute("/profile")).toBe(true);
    expect(isPrivateProfileRoute("/profile/edit")).toBe(true);
    expect(isPrivateProfileRoute("/profile/jane-doe")).toBe(false);
    expect(isPrivateProfileRoute("/profile/jane-doe/posts")).toBe(false);
  });
});
