import { describe, it, expect } from "vitest";
import { isValidUUID, requireUUID } from "@/lib/validators";

describe("isValidUUID", () => {
  it("accepts valid UUID v4", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts valid UUID v1", () => {
    expect(isValidUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("rejects random string", () => {
    expect(isValidUUID("abc")).toBe(false);
  });

  it("rejects numeric string", () => {
    expect(isValidUUID("123")).toBe(false);
  });

  it("rejects SQL injection attempt", () => {
    expect(isValidUUID("'; DROP TABLE profiles; --")).toBe(false);
  });

  it("rejects UUID-like string with wrong characters", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-44665544gggg")).toBe(false);
  });
});

describe("requireUUID", () => {
  it("returns the UUID when valid", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(requireUUID(uuid)).toBe(uuid);
  });

  it("throws on invalid input", () => {
    expect(() => requireUUID("invalid")).toThrow(
      "유효하지 않은 id 형식입니다.",
    );
  });

  it("uses custom param name in error", () => {
    expect(() => requireUUID("invalid", "postId")).toThrow(
      "유효하지 않은 postId 형식입니다.",
    );
  });
});
