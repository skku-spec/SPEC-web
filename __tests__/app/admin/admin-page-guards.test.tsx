import { describe, expect, it, vi, beforeEach } from "vitest";

import { requireAdmin, requireRole } from "@/lib/auth";
import { getEventsByBatch } from "@/lib/actions/spec-log";
import AdminHomeworkPage from "@/app/admin/homework/page";
import AdminSpecLogPage from "@/app/admin/spec-log/page";

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/lib/actions/spec-log", () => ({
  getEventsByBatch: vi.fn(),
}));

vi.mock("@/app/admin/homework/HomeworkClient", () => ({
  HomeworkClient: () => null,
}));

vi.mock("@/app/admin/spec-log/SpecLogAdminClient", () => ({
  default: () => null,
}));

const mockedRequireAdmin = vi.mocked(requireAdmin);
const mockedRequireRole = vi.mocked(requireRole);
const mockedGetEventsByBatch = vi.mocked(getEventsByBatch);

describe("admin page guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue({
      user: { id: "flag-admin" },
      profile: { id: "flag-admin", role: "outsider", is_admin: true },
    } as Awaited<ReturnType<typeof requireAdmin>>);
    mockedRequireRole.mockResolvedValue({
      user: { id: "preneur" },
      profile: { id: "preneur", role: "preneur", is_admin: false },
    } as Awaited<ReturnType<typeof requireRole>>);
    mockedGetEventsByBatch.mockResolvedValue({ success: true, data: [] });
  });

  it("uses the canonical admin guard for the homework admin page", async () => {
    await AdminHomeworkPage();

    expect(mockedRequireAdmin).toHaveBeenCalledTimes(1);
    expect(mockedRequireRole).not.toHaveBeenCalled();
  });

  it("uses the canonical admin guard for the SPEC Log admin page", async () => {
    await AdminSpecLogPage();

    expect(mockedRequireAdmin).toHaveBeenCalledTimes(1);
    expect(mockedRequireRole).not.toHaveBeenCalled();
    expect(mockedGetEventsByBatch).toHaveBeenCalledTimes(4);
  });
});
