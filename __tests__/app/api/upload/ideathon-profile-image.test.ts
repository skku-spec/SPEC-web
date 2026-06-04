import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  validateMagicBytes: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockedDeps.createClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockedDeps.createAdminClient,
}));

vi.mock("@/lib/upload-validation", () => ({
  validateMagicBytes: mockedDeps.validateMagicBytes,
}));

import { POST } from "@/app/api/upload/ideathon-profile-image/route";

type QueryResult<T> = {
  readonly data: T;
  readonly error: { readonly message?: string } | null;
};

function makeQueryChain<T>(result: QueryResult<T>) {
  const chain = {
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

function makeStorageClient() {
  const bucketClient = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn(() => ({
      data: {
        publicUrl: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.png",
      },
    })),
  };
  const storage = {
    getBucket: vi.fn().mockResolvedValue({ data: { public: true, allowed_mime_types: ["image/png"] }, error: null }),
    createBucket: vi.fn().mockResolvedValue({ error: null }),
    updateBucket: vi.fn().mockResolvedValue({ error: null }),
    from: vi.fn(() => bucketClient),
  };

  return { storage, bucketClient };
}

function makeSupabaseMock(overrides?: {
  readonly userId?: string | null;
  readonly role?: string | null;
}) {
  const profileChain = makeQueryChain({
    data: overrides?.role === undefined ? { role: "learner" } : { role: overrides.role },
    error: null,
  });
  const getUser = vi.fn().mockResolvedValue({
    data: { user: overrides?.userId === null ? null : { id: overrides?.userId ?? "user-1" } },
    error: null,
  });
  const from = vi.fn(() => profileChain);
  const storageClient = makeStorageClient();

  return {
    client: { auth: { getUser }, from, storage: storageClient.storage },
    from,
    profileChain,
    storageClient,
  };
}

function makeRequest(file?: File) {
  const formData = new FormData();
  if (file) {
    formData.set("image", file);
  }
  return {
    formData: async () => formData,
  } as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedDeps.validateMagicBytes.mockReturnValue(true);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example.com";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
});

describe("POST /api/upload/ideathon-profile-image", () => {
  it("requires login", async () => {
    const mock = makeSupabaseMock({ userId: null });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "로그인이 필요해요.",
    });
  });

  it("rejects alumni uploads", async () => {
    const mock = makeSupabaseMock({ role: "alumni" });
    mockedDeps.createClient.mockResolvedValue(mock.client);

    const response = await POST(makeRequest(new File([new Uint8Array(16)], "profile.png", { type: "image/png" })));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "팀빌딩 보드 사진은 러너와 프러너만 업로드할 수 있습니다.",
    });
  });

  it("rejects files whose bytes do not match the declared image type", async () => {
    const mock = makeSupabaseMock();
    mockedDeps.createClient.mockResolvedValue(mock.client);
    mockedDeps.validateMagicBytes.mockReturnValue(false);

    const response = await POST(makeRequest(new File([new Uint8Array(16)], "profile.png", { type: "image/png" })));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("실제 내용이 image/png 형식과 일치하지 않아요");
  });

  it("uploads to the board-only bucket without mutating profiles.photo", async () => {
    const mock = makeSupabaseMock({ role: "preneur" });
    const adminStorage = makeStorageClient();
    mockedDeps.createClient.mockResolvedValue(mock.client);
    mockedDeps.createAdminClient.mockReturnValue({ storage: adminStorage.storage });

    const response = await POST(makeRequest(new File([new Uint8Array(16)], "profile.png", { type: "image/png" })));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      url: "https://supabase.example.com/storage/v1/object/public/ideathon-profile-images/profiles/user-1/profile.png",
    });
    expect(adminStorage.storage.from).toHaveBeenCalledWith("ideathon-profile-images");
    expect(adminStorage.bucketClient.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^profiles\/user-1\/.+\.png$/),
      expect.any(File),
      expect.objectContaining({ contentType: "image/png" }),
    );
    expect(mock.profileChain.update).not.toHaveBeenCalled();
  });
});
