import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedDeps = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdmin: vi.fn(),
  requireRole: vi.fn(),
}));

type MockWithVirtual = (path: string, factory: () => Record<string, never>, options: { virtual: boolean }) => void;

const viMockWithVirtual: MockWithVirtual = vi.mock;

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
  requireRole: mockedDeps.requireRole,
}));

import {
  generateAttendanceCheckInCode,
  getLearnerAttendanceCheckInState,
  selfCheckInAttendance,
} from "@/lib/actions/attendance-check-in";
import { classifyAttendanceCheckIn } from "@/lib/attendance-check-in-utils";
import { markAttendance } from "@/lib/actions/tracker";

type DbError = {
  message: string;
};

type DbResult<T> = {
  data: T;
  error: DbError | null;
  count?: number | null;
};

type AttendanceSessionRow = {
  id: string;
  title: string;
  date: string;
  starts_at: string | null;
  check_in_opens_at: string | null;
  check_in_closes_at: string | null;
  self_check_in_enabled: boolean;
};

type AttendanceCheckInRow = {
  session_id: string;
  code_hash: string;
  created_at: string;
  expires_at: string | null;
};

type AttendanceLogRow = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  source: string | null;
  checked_in_at: string | null;
  admin_overridden_at: string | null;
  check_in_method: string | null;
};

type QueryChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  then: (
    resolve: (value: DbResult<unknown>) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise<unknown>;
  getLastPayload: () => unknown;
};

type TableName =
  | "attendance_sessions"
  | "attendance_session_check_ins"
  | "attendance_check_in_attempts"
  | "attendance_logs";

const HASH_482193 = "0a14e0db42e1a9cc8680ab5395bcae92416186796fa4eb636c431d4d53d8f53d";

function makeSession(overrides: Partial<AttendanceSessionRow> = {}): AttendanceSessionRow {
  return {
    id: "session-1",
    title: "금요 세션",
    date: "2026-03-06",
    starts_at: "2026-03-06T10:00:00.000Z",
    check_in_opens_at: "2026-03-06T09:30:00.000Z",
    check_in_closes_at: "2026-03-06T10:15:00.000Z",
    self_check_in_enabled: true,
    ...overrides,
  };
}

function makeCheckInConfig(overrides: Partial<AttendanceCheckInRow> = {}): AttendanceCheckInRow {
  return {
    session_id: "session-1",
    code_hash: HASH_482193,
    created_at: "2026-03-06T09:20:00.000Z",
    expires_at: "2026-03-06T10:15:00.000Z",
    ...overrides,
  };
}

function makeLog(overrides: Partial<AttendanceLogRow> = {}): AttendanceLogRow {
  return {
    id: "log-1",
    session_id: "session-1",
    user_id: "learner-1",
    status: "present",
    notes: null,
    source: "self",
    checked_in_at: "2026-03-06T09:55:00.000Z",
    admin_overridden_at: null,
    check_in_method: "qr",
    ...overrides,
  };
}

function makeQueryChain<T>(result: DbResult<T>): QueryChain {
  let lastPayload: unknown;
  const chain: QueryChain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    update: vi.fn((payload: unknown) => {
      lastPayload = payload;
      return chain;
    }),
    delete: vi.fn(() => chain),
    insert: vi.fn((payload: unknown) => {
      lastPayload = payload;
      return chain;
    }),
    upsert: vi.fn((payload: unknown) => {
      lastPayload = payload;
      return chain;
    }),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: DbResult<unknown>) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result as DbResult<unknown>).then(resolve, reject),
    getLastPayload: () => lastPayload,
  };

  return chain;
}

function makeQueuedClient(queues: Record<TableName, QueryChain[]>) {
  const from = vi.fn((table: TableName) => {
    const chain = queues[table].shift();
    if (!chain) throw new Error(`Unexpected table call: ${table}`);
    return chain;
  });

  return { client: { from }, from };
}

function makeCheckInClient(options: {
  session?: AttendanceSessionRow | null;
  existingLog?: AttendanceLogRow | null;
  insertLog?: AttendanceLogRow;
  checkInConfig?: AttendanceCheckInRow | null;
  failedAttemptCount?: number;
}) {
  const sessionChain = makeQueryChain<AttendanceSessionRow | null>({
    data: options.session ?? makeSession(),
    error: null,
  });
  const checkInConfigChain = makeQueryChain<AttendanceCheckInRow | null>({
    data: options.checkInConfig ?? makeCheckInConfig(),
    error: null,
  });
  const existingLogChain = makeQueryChain<AttendanceLogRow | null>({
    data: options.existingLog ?? null,
    error: null,
  });
  const insertChain = makeQueryChain<AttendanceLogRow>({
    data: options.insertLog ?? makeLog(),
    error: null,
  });
  const attemptsCountChain = makeQueryChain<null>({
    data: null,
    error: null,
    count: options.failedAttemptCount ?? 0,
  });
  const attemptsInsertChain = makeQueryChain<null>({
    data: null,
    error: null,
  });
  const { client } = makeQueuedClient({
    attendance_sessions: [sessionChain],
    attendance_session_check_ins: [checkInConfigChain],
    attendance_check_in_attempts: [attemptsCountChain, attemptsInsertChain],
    attendance_logs: [existingLogChain, insertChain],
  });

  return {
    client,
    sessionChain,
    checkInConfigChain,
    existingLogChain,
    insertChain,
    attemptsCountChain,
    attemptsInsertChain,
  };
}

describe("attendance QR/code check-in actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-06T09:55:00.000Z"));
    vi.clearAllMocks();
    mockedDeps.requireAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      profile: { id: "admin-1", role: "preneur", is_admin: true },
    });
    mockedDeps.requireRole.mockResolvedValue({
      user: { id: "learner-1" },
      profile: { id: "learner-1", role: "learner", is_admin: false },
    });
  });

  it("generates a six-digit session code and lets a learner self check in from a QR-prefilled code", async () => {
    const fetchSessionChain = makeQueryChain<AttendanceSessionRow>({
      data: makeSession(),
      error: null,
    });
    const upsertCodeChain = makeQueryChain<null>({ data: null, error: null });
    const updateChain = makeQueryChain<AttendanceSessionRow>({
      data: makeSession(),
      error: null,
    });
    const { client: adminClient } = makeQueuedClient({
      attendance_sessions: [fetchSessionChain, updateChain],
      attendance_session_check_ins: [upsertCodeChain],
      attendance_check_in_attempts: [],
      attendance_logs: [],
    });
    mockedDeps.createClient.mockResolvedValueOnce(adminClient);

    const codeResult = await generateAttendanceCheckInCode("session-1");

    expect(codeResult.success).toBe(true);
    if (!codeResult.success) throw new Error(codeResult.error);
    expect(codeResult.data.code).toMatch(/^\d{6}$/);
    expect(codeResult.data.checkInUrl).toContain("/dashboard/attendance/check-in");
    expect(updateChain.getLastPayload()).toEqual(
      expect.objectContaining({
        self_check_in_enabled: true,
      }),
    );
    expect(upsertCodeChain.getLastPayload()).toEqual(
      expect.objectContaining({
        session_id: "session-1",
        code_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        created_at: "2026-03-06T09:55:00.000Z",
      }),
    );

    const { client: learnerClient, insertChain, attemptsInsertChain } = makeCheckInClient({
      session: makeSession({ starts_at: "2026-03-06T10:00:00.000Z" }),
      insertLog: makeLog({ status: "present", checked_in_at: "2026-03-06T09:55:00.000Z" }),
    });
    mockedDeps.createAdminClient.mockReturnValueOnce(learnerClient);

    const checkInResult = await selfCheckInAttendance({
      sessionId: "session-1",
      code: "482193",
      method: "qr",
    });

    expect(checkInResult.success).toBe(true);
    if (!checkInResult.success) throw new Error(checkInResult.error);
    expect(checkInResult.data.status).toBe("present");
    expect(insertChain.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.getLastPayload()).toEqual(
      expect.objectContaining({
        user_id: "learner-1",
        session_id: "session-1",
        status: "present",
        source: "self",
        check_in_method: "qr",
        checked_in_at: "2026-03-06T09:55:00.000Z",
      }),
    );
    expect(attemptsInsertChain.insert).not.toHaveBeenCalled();
  });

  it("rolls back the private code when opening the session fails after code upsert", async () => {
    const fetchSessionChain = makeQueryChain<AttendanceSessionRow>({
      data: makeSession(),
      error: null,
    });
    const upsertCodeChain = makeQueryChain<null>({ data: null, error: null });
    const updateChain = makeQueryChain<AttendanceSessionRow | null>({
      data: null,
      error: { message: "session update failed" },
    });
    const deleteCodeChain = makeQueryChain<null>({ data: null, error: null });
    const { client } = makeQueuedClient({
      attendance_sessions: [fetchSessionChain, updateChain],
      attendance_session_check_ins: [upsertCodeChain, deleteCodeChain],
      attendance_check_in_attempts: [],
      attendance_logs: [],
    });
    mockedDeps.createClient.mockResolvedValueOnce(client);

    const result = await generateAttendanceCheckInCode("session-1");

    expect(result.success).toBe(false);
    if (result.success) throw new Error("session open unexpectedly succeeded");
    expect(result.error).toContain("출석 세션을 열지 못했습니다");
    expect(upsertCodeChain.upsert).toHaveBeenCalledTimes(1);
    expect(updateChain.update).toHaveBeenCalledTimes(1);
    expect(deleteCodeChain.delete).toHaveBeenCalledTimes(1);
    expect(deleteCodeChain.eq).toHaveBeenCalledWith("session_id", "session-1");
  });

  it("loads the learner check-in screen through the signed-in learner client, not the service role client", async () => {
    const sessionChain = makeQueryChain<AttendanceSessionRow | null>({
      data: makeSession(),
      error: null,
    });
    const existingLogChain = makeQueryChain<AttendanceLogRow | null>({
      data: null,
      error: null,
    });
    const { client: learnerClient } = makeQueuedClient({
      attendance_sessions: [sessionChain],
      attendance_session_check_ins: [],
      attendance_check_in_attempts: [],
      attendance_logs: [existingLogChain],
    });
    mockedDeps.createClient.mockResolvedValueOnce(learnerClient);

    const result = await getLearnerAttendanceCheckInState("session-1", "482193");

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data.session?.id).toBe("session-1");
    expect(result.data.prefilledCode).toBe("482193");
    expect(result.data.classification).toEqual({ kind: "ready", status: "present" });
    expect(mockedDeps.createClient).toHaveBeenCalledTimes(1);
    expect(mockedDeps.createAdminClient).not.toHaveBeenCalled();
    expect(sessionChain.eq).toHaveBeenCalledWith("id", "session-1");
    expect(existingLogChain.eq).toHaveBeenCalledWith("user_id", "learner-1");
  });

  it("rejects wrong codes, closed 15-minute windows, and duplicate self check-ins without inserting", async () => {
    const wrongCode = makeCheckInClient({
      checkInConfig: makeCheckInConfig({ code_hash: HASH_482193 }),
    });
    mockedDeps.createAdminClient.mockReturnValueOnce(wrongCode.client);

    const wrongCodeResult = await selfCheckInAttendance({
      sessionId: "session-1",
      code: "111111",
      method: "code",
    });

    expect(wrongCodeResult.success).toBe(false);
    if (wrongCodeResult.success) throw new Error("wrong code unexpectedly succeeded");
    expect(wrongCodeResult.error).toContain("출석 코드");
    expect(wrongCode.insertChain.insert).not.toHaveBeenCalled();
    expect(wrongCode.attemptsInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "session-1",
        user_id: "learner-1",
        outcome: "failed",
      }),
    );

    vi.setSystemTime(new Date("2026-03-06T10:15:01.000Z"));
    const closedWindow = makeCheckInClient({
      session: makeSession({ check_in_closes_at: "2026-03-06T10:15:00.000Z" }),
    });
    mockedDeps.createAdminClient.mockReturnValueOnce(closedWindow.client);

    const closedResult = await selfCheckInAttendance({
      sessionId: "session-1",
      code: "482193",
      method: "qr",
    });

    expect(closedResult.success).toBe(false);
    if (closedResult.success) throw new Error("closed window unexpectedly succeeded");
    expect(closedResult.error).toContain("종료");
    expect(closedWindow.insertChain.insert).not.toHaveBeenCalled();
    expect(
      classifyAttendanceCheckIn(makeSession(), new Date("2026-03-06T10:15:01.000Z")).kind,
    ).toBe("closed");
    expect(
      classifyAttendanceCheckIn(
        makeSession({ check_in_closes_at: "2026-03-06T10:30:00.000Z" }),
        new Date("2026-03-06T10:20:00.000Z"),
      ),
    ).toEqual({ kind: "ready", status: "late" });

    vi.setSystemTime(new Date("2026-03-06T09:55:00.000Z"));
    const locked = makeCheckInClient({
      failedAttemptCount: 5,
    });
    mockedDeps.createAdminClient.mockReturnValueOnce(locked.client);

    const lockedResult = await selfCheckInAttendance({
      sessionId: "session-1",
      code: "111111",
      method: "code",
    });

    expect(lockedResult.success).toBe(false);
    if (lockedResult.success) throw new Error("locked check-in unexpectedly succeeded");
    expect(lockedResult.error).toContain("잠시 후");
    expect(locked.insertChain.insert).not.toHaveBeenCalled();
    expect(locked.attemptsInsertChain.insert).not.toHaveBeenCalled();

    const duplicate = makeCheckInClient({
      existingLog: makeLog({ source: "self" }),
    });
    mockedDeps.createAdminClient.mockReturnValueOnce(duplicate.client);

    const duplicateResult = await selfCheckInAttendance({
      sessionId: "session-1",
      code: "482193",
      method: "qr",
    });

    expect(duplicateResult.success).toBe(false);
    if (duplicateResult.success) throw new Error("duplicate check-in unexpectedly succeeded");
    expect(duplicateResult.error).toContain("이미");
    expect(duplicate.insertChain.insert).not.toHaveBeenCalled();
  });

  it("records admin override metadata and never lets self check-in overwrite an admin-authored log", async () => {
    const adminUpsertChain = makeQueryChain<AttendanceLogRow>({
      data: makeLog({
        source: "admin",
        admin_overridden_at: "2026-03-06T09:55:00.000Z",
        check_in_method: null,
      }),
      error: null,
    });
    const { client: adminClient } = makeQueuedClient({
      attendance_sessions: [],
      attendance_session_check_ins: [],
      attendance_check_in_attempts: [],
      attendance_logs: [adminUpsertChain],
    });
    mockedDeps.createClient.mockResolvedValueOnce(adminClient);

    const overrideResult = await markAttendance("learner-1", "session-1", "present");

    expect(overrideResult.success).toBe(true);
    expect(adminUpsertChain.getLastPayload()).toEqual(
      expect.objectContaining({
        user_id: "learner-1",
        session_id: "session-1",
        status: "present",
        source: "admin",
        admin_overridden_at: "2026-03-06T09:55:00.000Z",
      }),
    );

    const adminAuthoredLog = makeCheckInClient({
      existingLog: makeLog({ source: "admin", admin_overridden_at: "2026-03-06T09:55:00.000Z" }),
    });
    mockedDeps.createAdminClient.mockReturnValueOnce(adminAuthoredLog.client);

    const checkInResult = await selfCheckInAttendance({
      sessionId: "session-1",
      code: "482193",
      method: "qr",
    });

    expect(checkInResult.success).toBe(false);
    if (checkInResult.success) throw new Error("admin-authored log was overwritten");
    expect(checkInResult.error).toContain("운영진");
    expect(adminAuthoredLog.insertChain.insert).not.toHaveBeenCalled();
  });
});
