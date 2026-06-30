import guideContent from "../../guide/attendance-guide-content.json";
import { describe, expect, it } from "vitest";

describe("attendance admin guide content", () => {
  it("defines the operator guide structure with required screenshot slots", () => {
    expect(guideContent.title).toBe("SPEC 출석 QR/코드 운영 가이드");
    expect(guideContent.audience).toBe("비개발자 운영진");

    expect(guideContent.screenshotSlots).toEqual([
      "admin-attendance",
      "session-settings",
      "qr-board",
      "learner-check-in",
    ]);

    expect(guideContent.sections.map((section) => section.id)).toEqual([
      "overview",
      "before-session",
      "open-check-in",
      "project-qr-board",
      "learner-check-in",
      "close-and-correct",
      "troubleshooting",
    ]);

    for (const section of guideContent.sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.operatorChecklist.length).toBeGreaterThan(0);
    }
  });
});
