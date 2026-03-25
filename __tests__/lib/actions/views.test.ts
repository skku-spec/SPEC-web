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

import { incrementViewCount } from "@/lib/actions/views";

describe("incrementViewCount", () => {
  const mockRpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedDeps.createClient.mockResolvedValue({ rpc: mockRpc });
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  it("calls increment_post_view_count RPC with correct post_id", async () => {
    await incrementViewCount("test-post-id");

    expect(mockRpc).toHaveBeenCalledWith("increment_post_view_count", {
      post_id: "test-post-id",
    });
  });

  it("calls createClient to get supabase instance", async () => {
    await incrementViewCount("any-id");

    expect(mockedDeps.createClient).toHaveBeenCalledOnce();
  });
});
