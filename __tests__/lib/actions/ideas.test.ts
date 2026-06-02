import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockedDeps.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockedDeps.createClient,
}));

import { getMyIdeas, submitIdea, updateIdea } from "@/lib/actions/ideas";

type QueryResult<T> = {
  data: T;
  error: { message?: string } | null;
};

function makeQueryChain<T>(result: QueryResult<T>) {
  const chain: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: (resolve: (value: QueryResult<T>) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
  } = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

function makeSupabaseMock(overrides?: {
  userId?: string | null;
  profile?: { role?: string | null } | null;
  profileError?: { message?: string } | null;
  ideaResult?: QueryResult<unknown[]>;
  fallbackResult?: QueryResult<unknown[]>;
}) {
  const ideaResult = overrides?.ideaResult ?? { data: [], error: null };
  const profileResult = {
    data: overrides?.profile ?? null,
    error: overrides?.profileError ?? null,
  };
  const fallback = overrides?.fallbackResult ?? { data: [], error: null };

  const ideaChain = makeQueryChain(ideaResult);
  const profileChain = makeQueryChain(profileResult);
  const fallbackChain = makeQueryChain(fallback);

  const getUser = vi.fn().mockResolvedValue({
    data: { user: overrides?.userId ? { id: overrides.userId } : null },
  });

  const from = vi.fn((table: string) => {
    if (table === "ideathon_ideas") return ideaChain;
    if (table === "profiles") return profileChain;
    return fallbackChain;
  });

  return {
    client: { auth: { getUser }, from },
    ideaChain,
    profileChain,
    from,
    ideaResult,
  };
}

function makeFormData(overrides: Partial<Record<string, string>> = {}) {
  const fd = new FormData();
  const defaults = {
    title: "아이디어명",
    description: "상세 설명입니다.",
    target_customer: "학생",
    competitors: "경쟁사A",
    market_size: "100명",
    team_members: "홍길동",
    pdf_url: "https://example.com/idea.pdf",
  };

  Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
    fd.set(key, value);
  });

  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitIdea", () => {
  it("requires title and description", async () => {
    const result = await submitIdea(makeFormData({ title: " ", description: " " }));

    expect(result).toEqual({ error: "아이디어명과 해결안 설명은 필수 입력 항목입니다." });
  });

  it("returns login error when unauthenticated", async () => {
    const mock = makeSupabaseMock({ userId: null });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await submitIdea(makeFormData());

    expect(result).toEqual({ error: "로그인이 필요합니다." });
  });
});

describe("getMyIdeas", () => {
  it("returns login error when unauthenticated", async () => {
    const mock = makeSupabaseMock({ userId: null });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await getMyIdeas();

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
  });

  it("returns only current user's ideas ordered newest first", async () => {
    const mockIdeas = [
      {
        id: "idea-1",
        user_id: "user-1",
        title: "A",
        description: "desc",
        target_customer: null,
        competitors: null,
        market_size: null,
        team_members: null,
        pdf_url: "https://example.com/idea.pdf",
        created_at: "2026-06-02T00:00:00Z",
        updated_at: "2026-06-02T00:00:00Z",
      },
    ];

    const mock = makeSupabaseMock({
      userId: "user-1",
      profile: { role: "learner" },
      ideaResult: { data: mockIdeas, error: null },
    });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await getMyIdeas();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockIdeas);
    expect(mock.from).toHaveBeenCalledWith("ideathon_ideas");
    expect(mock.ideaChain.select).toHaveBeenCalledWith(
      "id, user_id, title, description, target_customer, competitors, market_size, team_members, pdf_url, created_at, updated_at",
    );
    expect(mock.ideaChain.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1",
    );
    expect(mock.ideaChain.order).toHaveBeenCalledWith(
      "created_at",
      { ascending: false },
    );
  });
});

describe("updateIdea", () => {
  it("rejects blank title and description before database mutation", async () => {
    const mock = makeSupabaseMock({
      userId: "user-1",
      profile: { role: "learner" },
      ideaResult: { data: [], error: null },
    });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await updateIdea("idea-1", makeFormData({ title: " ", description: " " }));

    expect(result).toEqual({ error: "아이디어명과 해결안 설명은 필수 입력 항목입니다." });
    expect(mock.from).not.toHaveBeenCalledWith("ideathon_ideas");
  });

  it("rejects unauthenticated users", async () => {
    const mock = makeSupabaseMock({ userId: null });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await updateIdea("idea-1", makeFormData());

    expect(result).toEqual({ error: "로그인이 필요합니다." });
  });

  it("updates by id and current user_id and revalidates pages", async () => {
    const mock = makeSupabaseMock({
      userId: "user-1",
      profile: { role: "learner" },
      ideaResult: { data: [{ id: "idea-1" }], error: null },
    });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await updateIdea(
      "idea-1",
      makeFormData({
        title: "  새 제목  ",
        description: "  새 설명  ",
        target_customer: "  새 타깃  ",
        pdf_url: "  https://example.com/updated.pdf  ",
      }),
    );

    expect(result).toEqual({ success: true });
    expect(mock.ideaChain.update).toHaveBeenCalledWith({
      title: "새 제목",
      description: "새 설명",
      target_customer: "새 타깃",
      competitors: "경쟁사A",
      market_size: "100명",
      team_members: "홍길동",
      pdf_url: "https://example.com/updated.pdf",
    });
    expect(mock.ideaChain.eq).toHaveBeenCalledWith("id", "idea-1");
    expect(mock.ideaChain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mockedDeps.revalidatePath).toHaveBeenCalledWith("/ideathon");
    expect(mockedDeps.revalidatePath).toHaveBeenCalledWith("/dashboard/ideas");
    expect(mockedDeps.revalidatePath).toHaveBeenCalledWith("/admin/ideas");
  });

  it("returns permission-safe error when no row is updated", async () => {
    const mock = makeSupabaseMock({
      userId: "user-1",
      profile: { role: "learner" },
      ideaResult: { data: [], error: null },
    });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await updateIdea("missing-id", makeFormData());

    expect(result).toEqual({ error: "권한이 없거나 해당 아이디어를 찾을 수 없습니다." });
  });
});
