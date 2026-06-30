import { describe, expect, it } from "vitest";

import { isPrivateProfileRoute } from "@/middleware";

describe("isPrivateProfileRoute", () => {
  it("protects private profile and learner dashboard routes", () => {
    expect(isPrivateProfileRoute("/profile")).toBe(true);
    expect(isPrivateProfileRoute("/profile/edit")).toBe(true);
    expect(isPrivateProfileRoute("/dashboard")).toBe(true);
    expect(isPrivateProfileRoute("/dashboard/attendance/check-in")).toBe(true);
    expect(isPrivateProfileRoute("/profile/jane-doe")).toBe(false);
    expect(isPrivateProfileRoute("/profile/jane-doe/posts")).toBe(false);
  });
});

describe("middleware auth-required routes", () => {
  it("reset-password is not covered by isPrivateProfileRoute", () => {
    expect(isPrivateProfileRoute("/reset-password")).toBe(false);
  });
});
