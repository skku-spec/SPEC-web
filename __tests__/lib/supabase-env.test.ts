import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Supabase public environment", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY over the legacy anon key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "legacy-anon-key");

    const { getSupabasePublicEnv } = await import("@/lib/supabase/env");

    expect(getSupabasePublicEnv()).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "publishable-key",
    });
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY for older local setups", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "legacy-anon-key");
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const { getSupabasePublicEnv } = await import("@/lib/supabase/env");

    expect(getSupabasePublicEnv()).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "legacy-anon-key",
    });
  });
});
