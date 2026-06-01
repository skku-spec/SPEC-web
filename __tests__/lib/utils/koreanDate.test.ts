import { describe, expect, it } from "vitest";

import { formatKoreanDate } from "@/lib/utils/koreanDate";

describe("formatKoreanDate", () => {
  it("formats UTC timestamps using the Korea timezone", () => {
    const lateUtcTimestamp = "2026-03-15T16:10:00.000Z";

    expect(
      formatKoreanDate(lateUtcTimestamp, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    ).toBe("2026년 3월 16일");
  });

  it("formats date and time using the Korea timezone", () => {
    const lateUtcTimestamp = "2026-03-15T16:10:00.000Z";

    expect(
      formatKoreanDate(lateUtcTimestamp, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    ).toBe("2026. 03. 16. 오전 01:10");
  });
});
