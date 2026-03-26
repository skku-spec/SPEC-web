import { describe, expect, it, vi, beforeEach } from "vitest";

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

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn(() => "127.0.0.1"),
  })),
}));

import { incrementViewCount } from "@/lib/actions/views";

describe("incrementViewCount", () => {
  const mockRpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedDeps.createClient.mockResolvedValue({ rpc: mockRpc });
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  it("calls increment_post_view_count RPC with valid UUID", async () => {
    await incrementViewCount("550e8400-e29b-41d4-a716-446655440000");

    expect(mockRpc).toHaveBeenCalledWith("increment_post_view_count", {
      post_id: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("skips DB call for invalid UUID", async () => {
    await incrementViewCount("not-a-uuid");

    expect(mockedDeps.createClient).not.toHaveBeenCalled();
  });

  it("calls createClient to get supabase instance", async () => {
    await incrementViewCount("550e8400-e29b-41d4-a716-446655440000");

    expect(mockedDeps.createClient).toHaveBeenCalledOnce();
  });
});
