import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseClientMock = vi.hoisted(() => vi.fn());

type MockWithVirtual = (path: string, factory: () => Record<string, never>, options: { readonly virtual: boolean }) => void;

const viMockWithVirtual: MockWithVirtual = vi.mock;

viMockWithVirtual("server-only", () => ({}), { virtual: true });

vi.mock("@supabase/supabase-js", () => ({
  createClient: createSupabaseClientMock,
}));

describe("Supabase admin environment", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    createSupabaseClientMock.mockReset();
    createSupabaseClientMock.mockReturnValue({ kind: "admin-client" });
  });

  it("uses SUPABASE_SECRET_KEY before the legacy service role key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "secret-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "legacy-service-role-key");

    const { createAdminClient, hasSupabaseAdminEnv } = await import("@/lib/supabase/admin");

    expect(hasSupabaseAdminEnv()).toBe(true);
    expect(createAdminClient()).toEqual({ kind: "admin-client" });
    expect(createSupabaseClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "secret-key",
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    );
  });

  it("falls back to SUPABASE_SERVICE_ROLE_KEY for older deployments", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "legacy-service-role-key");

    const { createAdminClient, hasSupabaseAdminEnv } = await import("@/lib/supabase/admin");

    expect(hasSupabaseAdminEnv()).toBe(true);
    expect(createAdminClient()).toEqual({ kind: "admin-client" });
    expect(createSupabaseClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "legacy-service-role-key",
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    );
  });
});
