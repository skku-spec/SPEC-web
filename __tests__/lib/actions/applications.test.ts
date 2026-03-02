import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 5, retryAfterMs: 0 })),
}));

const viMockWithVirtual = vi.mock as unknown as (
  path: string,
  factory: () => Record<string, never>,
  options: { virtual: boolean },
) => void;

viMockWithVirtual("server-only", () => ({}), { virtual: true });

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve({ get: vi.fn(() => "127.0.0.1") })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockedDeps.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockedDeps.createClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockedDeps.createAdminClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockedDeps.rateLimit,
}));

import {
  getApplicationByCredentials,
  getMyApplication,
  submitApplication,
} from "@/lib/actions/applications";

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    name: "홍길동",
    student_id: "20240001",
    email: "hong@skku.edu",
    phone: "010-1234-5678",
    major: "글로벌경영학과",
    batch: "4",
    grade: "2",
    enrollment_status: "재학",
    introduction: "A".repeat(60),
    vision: "B".repeat(60),
    startup_idea: "C".repeat(60),
    portfolio_url: "D".repeat(20),
    experience_extra: "E".repeat(60),
    additional_comments: "",
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(k, v);
  }
  return fd;
}

function makeInsertClient(options?: {
  user?: { id: string } | null;
  insertError?: { code?: string; message?: string } | null;
}) {
  const insert = vi
    .fn()
    .mockResolvedValue({ error: options?.insertError ?? null });

  const from = vi.fn(() => ({ insert }));
  const getUser = vi
    .fn()
    .mockResolvedValue({ data: { user: options?.user ?? null } });

  return {
    client: {
      auth: { getUser },
      from,
    },
    insert,
  };
}

function makeMaybeSingleChain(result: {
  data?: Record<string, string> | null;
  error?: { message?: string } | null;
}) {
  const chain: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: result.data ?? null, error: result.error ?? null }),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);

  return chain;
}

function makeAdminFallbackClient(options: {
  data?: Record<string, unknown> | null;
  error?: { message?: string } | null;
  updateError?: { message?: string } | null;
}) {
  const selectChain = makeMaybeSingleChain({
    data: (options.data as Record<string, string>) ?? null,
    error: options.error ?? null,
  });

  const updateEq = vi
    .fn()
    .mockResolvedValue({ error: options.updateError ?? null });
  const update = vi.fn(() => ({ eq: updateEq }));

  const from = vi
    .fn()
    .mockReturnValueOnce(selectChain)
    .mockReturnValue({ update });

  return {
    adminClient: { from },
    update,
    updateEq,
  };
}

const mockedCreateClient = mockedDeps.createClient;
const mockedCreateAdminClient = mockedDeps.createAdminClient;
const mockedRateLimit = mockedDeps.rateLimit;
const mockedRevalidatePath = mockedDeps.revalidatePath;

beforeEach(() => {
  vi.clearAllMocks();
  mockedRateLimit.mockReturnValue({
    allowed: true,
    remaining: 5,
    retryAfterMs: 0,
  });
});

describe("submitApplication", () => {
  it("returns required fields error when required input is missing", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ name: "" }));

    expect(result).toEqual({ error: "필수 항목을 모두 입력해주세요." });
  });

  it("returns email format error for invalid email", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ email: "invalid-email" }));

    expect(result).toEqual({ error: "올바른 이메일 형식을 입력해주세요." });
  });

  it("returns student_id error when too short", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ student_id: "1234567" }));

    expect(result).toEqual({ error: "학번은 8~10자리 숫자여야 합니다." });
  });

  it("returns student_id error when non-numeric", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ student_id: "abcd1234" }));

    expect(result).toEqual({ error: "학번은 8~10자리 숫자여야 합니다." });
  });

  it("returns phone format error for invalid phone", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ phone: "02-123-4567" }));

    expect(result).toEqual({
      error: "올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)",
    });
  });

  it("passes when phone is optional", async () => {
    const { client, insert } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ phone: "" }));

    expect(result).toEqual({ success: true });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("returns length error when name is too short", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ name: "김" }));

    expect(result).toEqual({ error: "이름은(는) 최소 2자 이상이어야 합니다." });
  });

  it("returns length error when Q1 is too short", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ introduction: "A".repeat(49) }));

    expect(result).toEqual({ error: "Q1 답변은(는) 최소 50자 이상이어야 합니다." });
  });

  it("returns length error when Q4 is too short", async () => {
    const { client } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData({ portfolio_url: "D".repeat(9) }));

    expect(result).toEqual({ error: "Q4 답변은(는) 최소 10자 이상이어야 합니다." });
  });

  it("inserts application and returns success for valid input", async () => {
    const { client, insert } = makeInsertClient({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData());

    expect(result).toEqual({ success: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "홍길동",
        student_id: "20240001",
        email: "hong@skku.edu",
        phone: "010-1234-5678",
        user_id: "user-1",
      }),
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/dashboard/applications");
  });

  it("returns duplicate submission error for 23505", async () => {
    const { client } = makeInsertClient({
      insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData());

    expect(result).toEqual({ error: "이미 해당 기수에 지원서를 제출하셨습니다." });
  });

  it("returns permission error for 42501", async () => {
    const { client } = makeInsertClient({
      insertError: { code: "42501", message: "new row violates row-level security policy" },
    });
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData());

    expect(result).toEqual({
      error: "지원서 제출 권한이 없습니다. 관리자에게 문의해주세요.",
    });
  });

  it("returns rate limit error when limited", async () => {
    mockedRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      retryAfterMs: 60_000,
    });

    const { client, insert } = makeInsertClient();
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await submitApplication(makeFormData());

    expect(result).toEqual({
      error: "너무 많은 요청입니다. 1분 후에 다시 시도해주세요.",
    });
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("getApplicationByCredentials", () => {
  it("returns error for invalid email", async () => {
    const chain = makeMaybeSingleChain({ data: null });
    mockedCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never);

    const result = await getApplicationByCredentials("invalid", "20240001");

    expect(result).toEqual({ error: "올바른 이메일 형식을 입력해주세요." });
  });

  it("returns error for invalid student_id", async () => {
    const chain = makeMaybeSingleChain({ data: null });
    mockedCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never);

    const result = await getApplicationByCredentials("hong@skku.edu", "abcd");

    expect(result).toEqual({ error: "학번은 8~10자리 숫자여야 합니다." });
  });

  it("returns application data when credentials are valid and application exists", async () => {
    const appData = {
      status: "pending",
      name: "홍길동",
      batch: "4",
      created_at: "2026-01-01T00:00:00Z",
    };
    const chain = makeMaybeSingleChain({ data: appData });
    mockedCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never);

    const result = await getApplicationByCredentials("hong@skku.edu", "20240001");

    expect(result).toEqual({ success: true, application: appData });
  });

  it("returns not found error when no application exists", async () => {
    const chain = makeMaybeSingleChain({ data: null });
    mockedCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never);

    const result = await getApplicationByCredentials("hong@skku.edu", "20240001");

    expect(result).toEqual({
      error: "해당 정보로 접수된 지원서를 찾을 수 없습니다.",
    });
  });

  it("returns graceful error when admin client creation throws", async () => {
    mockedCreateAdminClient.mockImplementation(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });

    const result = await getApplicationByCredentials("hong@skku.edu", "20240001");

    expect(result).toEqual({
      error: "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  });

  it("returns rate limit error when limited", async () => {
    mockedRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      retryAfterMs: 60_000,
    });
    const chain = makeMaybeSingleChain({ data: null });
    mockedCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never);

    const result = await getApplicationByCredentials("hong@skku.edu", "20240001");

    expect(result).toEqual({
      error: "너무 많은 요청입니다. 1분 후에 다시 시도해주세요.",
    });
  });
});

describe("getMyApplication", () => {
  it("returns error when no user is logged in", async () => {
    const chain = makeMaybeSingleChain({ data: null });
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(() => chain),
    };
    mockedCreateClient.mockResolvedValue(client as never);

    const result = await getMyApplication();

    expect(result).toEqual({ error: "로그인이 필요합니다." });
  });

  it("returns application data when user has application", async () => {
    const appData = {
      status: "accepted",
      name: "홍길동",
      batch: "4",
      created_at: "2026-01-01T00:00:00Z",
    };
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "hong@skku.edu" } } }),
      },
      from: vi.fn(),
    };
    mockedCreateClient.mockResolvedValue(client as never);

    const detailData = {
      id: "app-1",
      user_id: "user-1",
      ...appData,
      email: "hong@skku.edu",
      phone: null,
      student_id: "20240001",
      major: "컴퓨터공학과",
      introduction: "intro",
      vision: "vision",
      startup_idea: "idea",
      portfolio_url: "https://example.com",
      experience_extra: null,
      equip: false,
      photo_exp: false,
      design_exp: false,
      figma: false,
      illustrator: false,
    };
    const { adminClient } = makeAdminFallbackClient({ data: detailData });
    mockedCreateAdminClient.mockReturnValue(adminClient as never);

    const result = await getMyApplication();

    expect(result).toEqual({ success: true, application: appData });
    expect(mockedCreateAdminClient).toHaveBeenCalledTimes(1);
  });

  it("returns success without application when user has no application", async () => {
    const chain = makeMaybeSingleChain({ data: null });
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn(() => chain),
    };
    mockedCreateClient.mockResolvedValue(client as never);

    const { adminClient } = makeAdminFallbackClient({ data: null });
    mockedCreateAdminClient.mockReturnValue(adminClient as never);

    const result = await getMyApplication();

    expect(result).toEqual({ success: true });
  });

  it("returns graceful error when admin client creation throws", async () => {
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1", email: "hong@skku.edu" } } }),
      },
      from: vi.fn(),
    };
    mockedCreateClient.mockResolvedValue(client as never);
    mockedCreateAdminClient.mockImplementation(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });

    const result = await getMyApplication();

    expect(result).toEqual({
      error: "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  });

  it("returns fallback application by email and links user_id", async () => {
    const chain = makeMaybeSingleChain({ data: null });
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1", email: "hong@skku.edu" } } }),
      },
      from: vi.fn(() => chain),
    };
    mockedCreateClient.mockResolvedValue(client as never);

    const fallbackData = {
      id: "app-1",
      user_id: null,
      status: "under_review",
      name: "홍길동",
      batch: "4",
      created_at: "2026-01-01T00:00:00Z",
      email: "hong@skku.edu",
      phone: null,
      student_id: "20240001",
      major: "컴퓨터공학과",
      introduction: "intro",
      vision: "vision",
      startup_idea: "idea",
      portfolio_url: "https://example.com",
      experience_extra: null,
      equip: false,
      photo_exp: false,
      design_exp: false,
      figma: false,
      illustrator: false,
    };
    const firstSelect = makeMaybeSingleChain({ data: null });
    const secondSelect = makeMaybeSingleChain({ data: fallbackData as unknown as Record<string, string> });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));
    const from = vi
      .fn()
      .mockReturnValueOnce(firstSelect)
      .mockReturnValueOnce(secondSelect)
      .mockReturnValue({ update });
    mockedCreateAdminClient.mockReturnValue({ from } as never);

    const result = await getMyApplication();

    expect(result).toEqual({
      success: true,
      application: {
        status: "under_review",
        name: "홍길동",
        batch: "4",
        created_at: "2026-01-01T00:00:00Z",
      },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1" }),
    );
    expect(updateEq).toHaveBeenCalledWith("id", "app-1");
  });

  it("returns fallback application by email without relinking when already linked", async () => {
    const chain = makeMaybeSingleChain({ data: null });
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1", email: "hong@skku.edu" } } }),
      },
      from: vi.fn(() => chain),
    };
    mockedCreateClient.mockResolvedValue(client as never);

    const fallbackData = {
      id: "app-2",
      user_id: "user-1",
      status: "pending",
      name: "홍길동",
      batch: "4",
      created_at: "2026-01-01T00:00:00Z",
      email: "hong@skku.edu",
      phone: null,
      student_id: "20240001",
      major: "컴퓨터공학과",
      introduction: "intro",
      vision: "vision",
      startup_idea: "idea",
      portfolio_url: "https://example.com",
      experience_extra: null,
      equip: false,
      photo_exp: false,
      design_exp: false,
      figma: false,
      illustrator: false,
    };
    const firstSelect = makeMaybeSingleChain({ data: null });
    const secondSelect = makeMaybeSingleChain({ data: fallbackData as unknown as Record<string, string> });
    const update = vi.fn(() => ({ eq: vi.fn() }));
    const from = vi
      .fn()
      .mockReturnValueOnce(firstSelect)
      .mockReturnValueOnce(secondSelect)
      .mockReturnValue({ update });
    mockedCreateAdminClient.mockReturnValue({ from } as never);

    const result = await getMyApplication();

    expect(result).toEqual({
      success: true,
      application: {
        status: "pending",
        name: "홍길동",
        batch: "4",
        created_at: "2026-01-01T00:00:00Z",
      },
    });
    expect(update).not.toHaveBeenCalled();
  });
});
