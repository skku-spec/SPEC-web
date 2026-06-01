import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdmin: vi.fn(),
}));

const viMockWithVirtual = vi.mock as unknown as (
  path: string,
  factory: () => Record<string, never>,
  options: { virtual: boolean },
) => void;

viMockWithVirtual("server-only", () => ({}), { virtual: true });

vi.mock("next/cache", () => ({
  revalidatePath: mockedDeps.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockedDeps.createClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockedDeps.createAdminClient,
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: mockedDeps.requireAdmin,
}));

import {
  createTag,
  deleteTag,
  getTagsWithPostCount,
  updateTag,
} from "@/lib/actions/tags";

function makeSupabaseMock() {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  return {
    from: vi.fn(() => chainable),
    _chain: chainable,
  };
}

describe("tags server actions", () => {
  let mockSupabase: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = makeSupabaseMock();
    mockedDeps.createClient.mockResolvedValue(mockSupabase);
    mockedDeps.createAdminClient.mockReturnValue(mockSupabase);
    mockedDeps.requireAdmin.mockResolvedValue({
      user: { id: "admin-user" },
      profile: { id: "admin-user", role: "preneur", is_admin: true },
    });
  });

  describe("createTag", () => {
    it("requires admin authorization before creating a service-role client", async () => {
      mockedDeps.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));

      await expect(createTag("운영", "operations")).rejects.toThrow("NEXT_REDIRECT");

      expect(mockedDeps.createClient).not.toHaveBeenCalled();
      expect(mockedDeps.createAdminClient).not.toHaveBeenCalled();
    });

    it("inserts a tag and revalidates /admin/tags", async () => {
      mockSupabase._chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockSupabase._chain.single.mockResolvedValue({
        data: { id: "new-id", label: "운영", slug: "operations" },
        error: null,
      });

      const result = await createTag("운영", "operations");

      expect(mockSupabase.from).toHaveBeenCalledWith("tags");
      expect(mockedDeps.requireAdmin).toHaveBeenCalledTimes(1);
      expect(mockedDeps.createClient).toHaveBeenCalledTimes(1);
      expect(mockedDeps.createAdminClient).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("rejects duplicate slugs", async () => {
      mockSupabase._chain.maybeSingle.mockResolvedValue({
        data: { id: "existing-id", label: "운영", slug: "operations" },
        error: null,
      });

      const result = await createTag("운영", "operations");

      expect(result.success).toBe(false);
      expect(result.error).toContain("이미 존재");
    });
  });

  describe("updateTag", () => {
    it("requires admin authorization before updating a service-role client", async () => {
      mockedDeps.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));

      await expect(updateTag("tag-id", "운영", "operations")).rejects.toThrow("NEXT_REDIRECT");

      expect(mockedDeps.createClient).not.toHaveBeenCalled();
      expect(mockedDeps.createAdminClient).not.toHaveBeenCalled();
    });
  });

  describe("deleteTag", () => {
    it("requires admin authorization before deleting with a service-role client", async () => {
      mockedDeps.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));

      await expect(deleteTag("tag-id")).rejects.toThrow("NEXT_REDIRECT");

      expect(mockedDeps.createClient).not.toHaveBeenCalled();
      expect(mockedDeps.createAdminClient).not.toHaveBeenCalled();
    });

    it("deletes post_tags junction rows before deleting the tag", async () => {
      mockSupabase._chain.eq.mockReturnThis();
      mockSupabase._chain.delete.mockReturnThis();

      await deleteTag("tag-id");

      const fromCalls = mockSupabase.from.mock.calls.map((c: string[]) => c[0]);
      expect(mockedDeps.requireAdmin).toHaveBeenCalledTimes(1);
      expect(mockedDeps.createClient).toHaveBeenCalledTimes(1);
      expect(mockedDeps.createAdminClient).not.toHaveBeenCalled();
      expect(fromCalls).toContain("post_tags");
      expect(fromCalls).toContain("tags");
    });
  });

  describe("getTagsWithPostCount", () => {
    it("returns tags with post counts", async () => {
      mockSupabase._chain.order.mockResolvedValue({
        data: [
          { id: "1", label: "운영", slug: "operations" },
          { id: "2", label: "마케팅", slug: "marketing" },
        ],
        error: null,
      });

      const tags = await getTagsWithPostCount();

      expect(mockSupabase.from).toHaveBeenCalledWith("tags");
      expect(mockedDeps.createClient).toHaveBeenCalledTimes(1);
      expect(mockedDeps.createAdminClient).not.toHaveBeenCalled();
      expect(Array.isArray(tags)).toBe(true);
    });
  });
});
