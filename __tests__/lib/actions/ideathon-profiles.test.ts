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

import {
  getIdeathonBoardData,
  upsertMyIdeathonProfile,
} from "@/lib/actions/ideathon-profiles";

type QueryResult<T> = {
  readonly data: T;
  readonly error: { readonly message?: string } | null;
};

type QueryChain<T> = {
  readonly select: ReturnType<typeof vi.fn>;
  readonly insert: ReturnType<typeof vi.fn>;
  readonly upsert: ReturnType<typeof vi.fn>;
  readonly update: ReturnType<typeof vi.fn>;
  readonly delete: ReturnType<typeof vi.fn>;
  readonly eq: ReturnType<typeof vi.fn>;
  readonly in: ReturnType<typeof vi.fn>;
  readonly not: ReturnType<typeof vi.fn>;
  readonly contains: ReturnType<typeof vi.fn>;
  readonly order: ReturnType<typeof vi.fn>;
  readonly single: ReturnType<typeof vi.fn>;
  readonly maybeSingle: ReturnType<typeof vi.fn>;
  readonly then: (
    resolve: (value: QueryResult<T>) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function makeQueryChain<T>(result: QueryResult<T>): QueryChain<T> {
  const chain: QueryChain<T> = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    not: vi.fn(() => chain),
    contains: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

const completeProfile = {
  id: "board-1",
  user_id: "user-1",
  photo_url: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.jpg",
  department: "경영학과",
  major: "경영학",
  age: 23,
  student_id: "2020123456",
  grade: "3학년",
  ability_tags: ["개발", "기획"],
  interest_tags: ["B2B"],
  startup_reason: "문제를 직접 풀어보고 싶어서 창업에 관심이 생겼습니다.",
  team_style: "빠르게 정리하고 실행하는 편입니다.",
  december_goal: "12월 데모데이까지 고객 검증을 끝내고 싶습니다.",
  looking_for_teammates: "고객 검증을 끝까지 같이 해볼 팀원을 찾고 있습니다.",
  appeal: "진실되게 오래 달릴 팀을 찾고 있습니다.",
  portfolio_url: "https://example.com",
  sns_url: null,
  published_at: "2026-06-04T00:00:00.000Z",
  created_at: "2026-06-04T00:00:00.000Z",
  updated_at: "2026-06-04T00:00:00.000Z",
};

function makeSupabaseMock(overrides?: {
  readonly userId?: string | null;
  readonly profile?: { readonly id?: string; readonly name?: string | null; readonly role?: string | null; readonly is_admin?: boolean } | null;
  readonly profileRows?: readonly { readonly id: string; readonly name: string | null; readonly role: string | null }[];
  readonly member?: { readonly department?: string | null; readonly major?: string | null; readonly student_id?: string | null } | null;
  readonly boardRows?: readonly typeof completeProfile[];
  readonly myBoardProfile?: typeof completeProfile | null;
  readonly upsertResult?: QueryResult<unknown[]>;
}) {
  const profile = overrides?.profile ?? { id: overrides?.userId ?? "user-1", name: "홍길동", role: "learner", is_admin: false };
  const profileChain = makeQueryChain({ data: profile, error: null });
  const memberChain = makeQueryChain({ data: overrides?.member ?? null, error: null });
  const boardListChain = makeQueryChain({ data: overrides?.boardRows ?? [], error: null });
  const myBoardProfileChain = makeQueryChain({ data: overrides?.myBoardProfile ?? null, error: null });
  const upsertChain = makeQueryChain(overrides?.upsertResult ?? { data: [{ id: "board-1" }], error: null });
  const profileRowsChain = makeQueryChain({ data: overrides?.profileRows ?? [], error: null });

  let boardCallCount = 0;
  const getUser = vi.fn().mockResolvedValue({
    data: { user: overrides?.userId === null ? null : { id: overrides?.userId ?? "user-1" } },
    error: null,
  });

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      if (profileRowsChain.in.mock.calls.length > 0 || profileChain.single.mock.calls.length > 0) {
        return profileRowsChain;
      }
      return profileChain;
    }

    if (table === "members") return memberChain;

    if (table === "ideathon_participant_profiles") {
      boardCallCount += 1;
      if (boardCallCount === 1) return boardListChain;
      if (boardCallCount === 2) return myBoardProfileChain;
      return upsertChain;
    }

    return makeQueryChain({ data: [], error: null });
  });

  return {
    client: { auth: { getUser }, from },
    from,
    profileChain,
    memberChain,
    boardListChain,
    myBoardProfileChain,
    upsertChain,
    profileRowsChain,
  };
}

function makeProfileForm(overrides: Partial<Record<string, string | string[]>> = {}) {
  const formData = new FormData();
  const defaults: Record<string, string | string[]> = {
    photo_url: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.jpg",
    department: "경영학과",
    major: "경영학",
    age: "23",
    student_id: "2020123456",
    grade: "3학년",
    ability_tags: ["개발", "기획"],
    interest_tags: ["B2B"],
    startup_reason: "문제를 직접 풀어보고 싶어서 창업에 관심이 생겼습니다.",
    team_style: "빠르게 정리하고 실행하는 편입니다.",
    december_goal: "12월 데모데이까지 고객 검증을 끝내고 싶습니다.",
    looking_for_teammates: "고객 검증을 끝까지 같이 해볼 팀원을 찾고 있습니다.",
    appeal: "진실되게 오래 달릴 팀을 찾고 있습니다.",
    portfolio_url: "example.com",
    sns_url: "",
  };

  Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
    formData.delete(key);
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => formData.append(key, entry));
      return;
    }
    formData.set(key, value);
  });

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getIdeathonBoardData", () => {
  it("requires login before returning board data", async () => {
    const mock = makeSupabaseMock({ userId: null });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await getIdeathonBoardData();

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
    expect(mock.from).not.toHaveBeenCalledWith("ideathon_participant_profiles");
  });

  it("rejects alumni even though alumni can submit ideathon ideas", async () => {
    const mock = makeSupabaseMock({ profile: { id: "user-1", name: "김알럼", role: "alumni", is_admin: false } });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await getIdeathonBoardData();

    expect(result).toEqual({
      success: false,
      error: "팀빌딩 보드는 러너와 프러너만 열람할 수 있습니다.",
    });
    expect(mock.from).not.toHaveBeenCalledWith("ideathon_participant_profiles");
  });

  it("rejects admin-flag-only outsiders", async () => {
    const mock = makeSupabaseMock({ profile: { id: "user-1", name: "관리자", role: "outsider", is_admin: true } });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await getIdeathonBoardData();

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("expected board data request to fail");
    }
    expect(result.error).toBe("팀빌딩 보드는 러너와 프러너만 열람할 수 있습니다.");
  });

  it("returns published board rows with profile names for learner users", async () => {
    const mock = makeSupabaseMock({
      boardRows: [completeProfile],
      profileRows: [{ id: "user-1", name: "홍길동", role: "learner" }],
      myBoardProfile: completeProfile,
    });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await getIdeathonBoardData();

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("expected board data request to succeed");
    }
    expect(result.data.profiles).toEqual([
      {
        ...completeProfile,
        name: "홍길동",
        role: "learner",
      },
    ]);
    expect(result.data.myProfile?.id).toBe("board-1");
    expect(mock.boardListChain.not).toHaveBeenCalledWith("published_at", "is", null);
    expect(mock.profileRowsChain.in).toHaveBeenCalledWith("id", ["user-1"]);
  });
});

describe("upsertMyIdeathonProfile", () => {
  it("requires an image and ability tags before database mutation", async () => {
    const mock = makeSupabaseMock();
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await upsertMyIdeathonProfile(makeProfileForm({ photo_url: " ", ability_tags: [] }));

    expect(result).toEqual({
      success: false,
      error: "사진과 본인을 나타내는 능력 태그는 필수입니다.",
    });
    expect(mock.from).not.toHaveBeenCalledWith("ideathon_participant_profiles");
  });

  it("rejects alumni saves", async () => {
    const mock = makeSupabaseMock({ profile: { id: "user-1", name: "김알럼", role: "alumni", is_admin: false } });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await upsertMyIdeathonProfile(makeProfileForm());

    expect(result).toEqual({
      success: false,
      error: "팀빌딩 보드는 러너와 프러너만 작성할 수 있습니다.",
    });
    expect(mock.from).not.toHaveBeenCalledWith("ideathon_participant_profiles");
  });

  it("rejects profile images outside the board upload bucket", async () => {
    const mock = makeSupabaseMock();
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await upsertMyIdeathonProfile(makeProfileForm({ photo_url: "https://example.com/profile.jpg" }));

    expect(result).toEqual({
      success: false,
      error: "팀빌딩 보드 사진 업로드를 완료한 이미지 URL만 저장할 수 있습니다.",
    });
    expect(mock.from).not.toHaveBeenCalledWith("ideathon_participant_profiles");
  });

  it("upserts the normalized current user's profile and revalidates ideathon", async () => {
    const mock = makeSupabaseMock();
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await upsertMyIdeathonProfile(makeProfileForm());

    expect(result).toEqual({ success: true });
    expect(mock.boardListChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        photo_url: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.jpg",
        age: 23,
        ability_tags: ["개발", "기획"],
        looking_for_teammates: "고객 검증을 끝까지 같이 해볼 팀원을 찾고 있습니다.",
        appeal: "진실되게 오래 달릴 팀을 찾고 있습니다.",
        portfolio_url: "https://example.com/",
        sns_url: null,
      }),
      { onConflict: "user_id" },
    );
    expect(mockedDeps.revalidatePath).toHaveBeenCalledWith("/ideathon");
  });

  it("allows a blank optional appeal", async () => {
    const mock = makeSupabaseMock();
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const result = await upsertMyIdeathonProfile(makeProfileForm({ appeal: "" }));

    expect(result).toEqual({ success: true });
    expect(mock.boardListChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        appeal: null,
      }),
      { onConflict: "user_id" },
    );
  });
});
