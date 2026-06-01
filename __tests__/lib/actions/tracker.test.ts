import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requireRole: vi.fn(),
  normalizeRole: vi.fn((role?: string | null) => role ?? "outsider"),
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

vi.mock("@/lib/auth", () => ({
  requireAuth: mockedDeps.requireAuth,
  requireAdmin: mockedDeps.requireAdmin,
  requireRole: mockedDeps.requireRole,
  normalizeRole: mockedDeps.normalizeRole,
}));

import { getTrackerData } from "@/lib/actions/tracker";

type QueryResult = {
  data: Array<Record<string, unknown>>;
  error: null;
};

function makeThenableChain(result: QueryResult) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    not: vi.fn(() => Promise.resolve(result)),
    order: vi.fn(() => Promise.resolve(result)),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    then: (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };

  return chain;
}

function makeTrackerClient() {
  const chains = {
    profiles: makeThenableChain({
      data: [
        {
          id: "learner-1",
          name: "Learner One",
          first_name: "Learner",
          last_name: "One",
          role: "learner",
          username: "learnerone",
        },
      ],
      error: null,
    }),
    members: makeThenableChain({
      data: [{ public_profile_id: "learner-1" }],
      error: null,
    }),
    sessions: makeThenableChain({ data: [], error: null }),
    homeworks: makeThenableChain({ data: [], error: null }),
    syncStatus: makeThenableChain({ data: [], error: null }),
    logs: makeThenableChain({ data: [], error: null }),
    submissions: makeThenableChain({ data: [], error: null }),
    sectionSubmissions: makeThenableChain({ data: [], error: null }),
  };

  let homeworkSectionCalls = 0;
  const from = vi.fn((table: string) => {
    if (table === "profiles") return chains.profiles;
    if (table === "members") return chains.members;
    if (table === "attendance_sessions") return chains.sessions;
    if (table === "homeworks") return chains.homeworks;
    if (table === "attendance_logs") return chains.logs;
    if (table === "homework_submissions") return chains.submissions;
    if (table === "homework_section_submissions") {
      homeworkSectionCalls += 1;
      return homeworkSectionCalls === 1 ? chains.syncStatus : chains.sectionSubmissions;
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    client: { from },
    chains,
    from,
  };
}

describe("getTrackerData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDeps.normalizeRole.mockImplementation((role?: string | null) => role ?? "outsider");
    mockedDeps.requireAdmin.mockResolvedValue({
      user: { id: "admin-user" },
      profile: { id: "admin-user", role: "preneur", is_admin: true },
    });
  });

  it("allows is_admin users to load admin tracker data without learner-role precondition", async () => {
    mockedDeps.requireAuth.mockResolvedValue({
      user: { id: "admin-user" },
      profile: {
        id: "admin-user",
        name: "Admin User",
        first_name: "Admin",
        last_name: "User",
        role: "outsider",
        username: "admin",
        is_admin: true,
      },
    });
    mockedDeps.requireRole.mockRejectedValue(new Error("NEXT_REDIRECT"));
    const { client, chains } = makeTrackerClient();
    mockedDeps.createClient.mockResolvedValue(client);

    const result = await getTrackerData();

    expect(result.success).toBe(true);
    expect(result.data?.isAdminOrPreneur).toBe(true);
    expect(mockedDeps.requireRole).not.toHaveBeenCalled();
    expect(chains.profiles.in).toHaveBeenCalledWith("id", ["learner-1"]);
  });

  it("preserves learner-only filtering for non-admin learner users", async () => {
    mockedDeps.requireAuth.mockResolvedValue({
      user: { id: "learner-1" },
      profile: {
        id: "learner-1",
        name: "Learner One",
        first_name: "Learner",
        last_name: "One",
        role: "learner",
        username: "learnerone",
        is_admin: false,
      },
    });
    mockedDeps.requireRole.mockResolvedValue({
      user: { id: "learner-1" },
      profile: { id: "learner-1", role: "learner", is_admin: false },
    });
    const { client, chains } = makeTrackerClient();
    mockedDeps.createClient.mockResolvedValue(client);

    const result = await getTrackerData();

    expect(result.success).toBe(true);
    expect(result.data?.isAdminOrPreneur).toBe(false);
    expect(mockedDeps.requireRole).toHaveBeenCalledWith("learner");
    expect(chains.profiles.eq).toHaveBeenCalledWith("id", "learner-1");
    expect(chains.logs.eq).toHaveBeenCalledWith("user_id", "learner-1");
    expect(chains.submissions.eq).toHaveBeenCalledWith("user_id", "learner-1");
    expect(chains.sectionSubmissions.eq).toHaveBeenCalledWith("user_id", "learner-1");
  });
});
