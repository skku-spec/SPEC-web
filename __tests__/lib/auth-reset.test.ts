import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}));

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://skku-spec.com");

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: mockAuth,
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn(() => "127.0.0.1"),
  })),
}));

import { forgotPassword, resetPassword } from "@/lib/actions/auth";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls resetPasswordForEmail with redirectTo", async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

    const result = await forgotPassword(formData({ email: "user@test.com" }));

    expect(result).toEqual({ success: true });
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith("user@test.com", {
      redirectTo: "https://skku-spec.com/auth/callback?next=/reset-password",
    });
  });

  it("returns error for empty email", async () => {
    const result = await forgotPassword(formData({ email: "" }));
    expect(result).toEqual({ error: "이메일을 입력해주세요." });
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockAuth.updateUser.mockResolvedValue({ error: null });
    mockAuth.signOut.mockResolvedValue({});
  });

  it("resets password and signs out", async () => {
    const result = await resetPassword(
      formData({ new_password: "newpass123", confirm_password: "newpass123" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: "newpass123" });
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: "global" });
  });

  it("returns error for empty password", async () => {
    const result = await resetPassword(
      formData({ new_password: "", confirm_password: "" }),
    );
    expect(result).toEqual({ error: "새 비밀번호를 입력해주세요." });
  });

  it("returns error for short password", async () => {
    const result = await resetPassword(
      formData({ new_password: "abc", confirm_password: "abc" }),
    );
    expect(result).toEqual({ error: "비밀번호는 6자 이상이어야 합니다." });
  });

  it("returns error for mismatched passwords", async () => {
    const result = await resetPassword(
      formData({ new_password: "newpass123", confirm_password: "different" }),
    );
    expect(result).toEqual({ error: "비밀번호가 일치하지 않습니다." });
  });

  it("returns error when no session", async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null } });

    const result = await resetPassword(
      formData({ new_password: "newpass123", confirm_password: "newpass123" }),
    );
    expect(result).toEqual({
      error: "세션이 만료되었습니다. 비밀번호 재설정 링크를 다시 요청해주세요.",
    });
  });

  it("returns friendly message for same password error", async () => {
    mockAuth.updateUser.mockResolvedValue({
      error: { message: "New password should be different from the old password." },
    });

    const result = await resetPassword(
      formData({ new_password: "samepass", confirm_password: "samepass" }),
    );
    expect(result).toEqual({
      error: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
    });
  });

  it("returns friendly message for weak password", async () => {
    mockAuth.updateUser.mockResolvedValue({
      error: { message: "Password does not meet strength requirements." },
    });

    const result = await resetPassword(
      formData({ new_password: "weakpw", confirm_password: "weakpw" }),
    );
    expect(result).toEqual({
      error: "비밀번호가 너무 약합니다. 더 강한 비밀번호를 선택해주세요.",
    });
  });
});
