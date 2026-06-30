import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, type ImgHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AttendanceCheckInClient } from "@/components/dashboard/AttendanceCheckInClient";
import { AttendanceQr } from "@/components/dashboard/AttendanceQr";
import type { LearnerCheckInState } from "@/lib/actions/attendance-check-in";

const trackerActions = vi.hoisted(() => ({
  markAttendance: vi.fn(),
  deleteAttendance: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  markAllPresent: vi.fn(),
}));

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  readonly unoptimized?: boolean;
};

vi.mock("next/image", () => ({
  default: ({ unoptimized, alt = "", ...props }: MockImageProps) => {
    void unoptimized;
    return createElement("img", { ...props, alt });
  },
}));

vi.mock("@/lib/actions/attendance-check-in", () => ({
  selfCheckInAttendance: vi.fn(),
  closeSessionCheckIn: vi.fn(),
  generateAttendanceCheckInCode: vi.fn(),
  updateSessionCheckInSettings: vi.fn(),
}));

vi.mock("@/lib/actions/tracker", () => trackerActions);

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual<typeof import("lucide-react")>("lucide-react");
  return actual;
});

beforeEach(() => {
  Object.values(trackerActions).forEach((mock) => mock.mockReset());
});

const longCheckInUrl =
  "http://localhost:3000/dashboard/attendance/check-in?session=session-with-a-very-long-id-for-layout&code=482193";

const readyState: LearnerCheckInState = {
  session: {
    id: "session-1",
    title: "금요 세션",
    date: "2026-06-12",
    starts_at: "2026-06-12T10:00:00.000Z",
    check_in_opens_at: "2026-06-12T09:30:00.000Z",
    check_in_closes_at: "2026-06-12T10:15:00.000Z",
    self_check_in_enabled: true,
  },
  existingLog: null,
  prefilledCode: "482193",
  classification: { kind: "ready", status: "present" },
};

describe("attendance QR responsive layout contracts", () => {
  it("keeps the shared QR card constrained when the check-in URL is long", () => {
    render(
      <AttendanceQr
        sessionId="session-with-a-very-long-id-for-layout"
        code="482193"
        checkInUrl={longCheckInUrl}
      />,
    );

    expect(screen.getByTestId("attendance-qr-card")).toHaveClass("min-w-0");
    expect(screen.getByRole("link", { name: longCheckInUrl })).toHaveClass("max-w-full", "break-all");
  });

  it("uses a full-width learner submit button on mobile and auto width on larger screens", () => {
    render(<AttendanceCheckInClient initialState={readyState} initialCode="482193" />);

    expect(screen.getByRole("button", { name: "출석 체크" })).toHaveClass(
      "w-full",
      "justify-center",
      "sm:w-auto",
    );
  });

  it("renders admin session QR controls as responsive cards instead of a mobile table", async () => {
    const { AttendanceSessionCheckInPanel } = await import("@/app/admin/attendance/AttendanceSessionCheckInPanel");

    render(
      <AttendanceSessionCheckInPanel
        sessions={[
          {
            id: "session-1",
            title: "아주 긴 이름의 금요 창업 세션",
            date: "2026-06-12",
            starts_at: "2026-06-12T10:00:00.000Z",
            check_in_opens_at: "2026-06-12T09:30:00.000Z",
            check_in_closes_at: "2026-06-12T10:15:00.000Z",
            self_check_in_enabled: true,
          },
        ]}
        checkInSettings={{
          "session-1": {
            startsAt: "2026-06-12T10:00",
            opensAt: "2026-06-12T09:30",
            closesAt: "2026-06-12T10:15",
            enabled: true,
          },
        }}
        generatedCheckIns={{
          "session-1": {
            sessionId: "session-1",
            code: "482193",
            checkInUrl: longCheckInUrl,
          },
        }}
        isPending={false}
        onCloseCheckIn={vi.fn()}
        onCopy={vi.fn()}
        onGenerateCode={vi.fn()}
        onSaveSettings={vi.fn()}
        onUpdateSetting={vi.fn()}
      />,
    );

    expect(screen.getByTestId("attendance-session-controls")).toHaveClass("grid", "lg:grid-cols-2");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    for (const name of ["저장", "재발급", "닫기", "링크 복사", "보드 열기"]) {
      expect(screen.getByRole(name === "보드 열기" ? "link" : "button", { name })).toHaveClass("whitespace-nowrap");
    }
  });

  it("keeps the desktop attendance grid columns fixed while status cells change", async () => {
    const { AttendanceClient } = await import("@/app/admin/attendance/AttendanceClient");
    trackerActions.markAttendance.mockResolvedValueOnce({
      success: true,
      data: {
        log: {
          id: "server-log-1",
          user_id: "learner-2",
          session_id: "session-1",
          status: "present",
          notes: null,
        },
      },
    });

    render(
      <AttendanceClient
        learners={[
          { id: "learner-1", name: "김스펙", role: "learner" },
          { id: "learner-2", name: "박스펙", role: "learner" },
        ]}
        sessions={[
          { id: "session-1", title: "8주차", date: "2026-06-30" },
          { id: "session-2", title: "9주차", date: "2026-06-30" },
        ]}
        logs={[
          {
            id: "server-log-existing",
            user_id: "learner-1",
            session_id: "session-1",
            status: "present",
            notes: null,
          },
        ]}
        isAdminOrPreneur
        hideHomework
      />,
    );

    const desktopGrid = screen.getByTestId("admin-attendance-desktop-grid");
    const table = within(desktopGrid).getByRole("table");
    expect(table).toHaveClass("table-fixed", "min-w-max");
    expect(table.querySelector("colgroup")).not.toBeNull();
    expect(table.querySelector("col:first-child")).toHaveClass("w-[240px]");

    const presentButtons = within(desktopGrid).getAllByRole("button", { name: /출석 처리/ });
    expect(presentButtons[0]).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(presentButtons[2]);

    expect(within(desktopGrid).getAllByRole("button", { name: /출석 처리/ })).toHaveLength(4);
    expect(presentButtons[0]).toHaveAttribute("aria-pressed", "true");
    expect(presentButtons[2]).toHaveAttribute("aria-pressed", "true");
  });
});
