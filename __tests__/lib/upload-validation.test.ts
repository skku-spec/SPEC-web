import { describe, it, expect } from "vitest";
import { validateMagicBytes } from "@/lib/upload-validation";

function toBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array([...bytes, ...new Array(12 - bytes.length).fill(0)])
    .buffer;
}

describe("validateMagicBytes", () => {
  it("accepts valid JPEG header", () => {
    const buffer = toBuffer([0xff, 0xd8, 0xff, 0xe0]);
    expect(validateMagicBytes(buffer, "image/jpeg")).toBe(true);
  });

  it("accepts valid PNG header", () => {
    const buffer = toBuffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateMagicBytes(buffer, "image/png")).toBe(true);
  });

  it("accepts valid GIF header", () => {
    const buffer = toBuffer([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(validateMagicBytes(buffer, "image/gif")).toBe(true);
  });

  it("accepts valid WebP header", () => {
    const buffer = toBuffer([0x52, 0x49, 0x46, 0x46]);
    expect(validateMagicBytes(buffer, "image/webp")).toBe(true);
  });

  it("rejects mismatched MIME (PNG bytes + JPEG MIME)", () => {
    const buffer = toBuffer([0x89, 0x50, 0x4e, 0x47]);
    expect(validateMagicBytes(buffer, "image/jpeg")).toBe(false);
  });

  it("rejects empty buffer", () => {
    const buffer = new ArrayBuffer(0);
    expect(validateMagicBytes(buffer, "image/jpeg")).toBe(false);
  });

  it("rejects text file with image MIME", () => {
    const encoder = new TextEncoder();
    const buffer = encoder.encode("Hello World!").buffer;
    expect(validateMagicBytes(buffer, "image/png")).toBe(false);
  });

  it("rejects HTML file with image MIME", () => {
    const encoder = new TextEncoder();
    const buffer = encoder.encode("<html><body>").buffer;
    expect(validateMagicBytes(buffer, "image/jpeg")).toBe(false);
  });

  it("rejects unsupported MIME type", () => {
    const buffer = toBuffer([0xff, 0xd8, 0xff]);
    expect(validateMagicBytes(buffer, "application/pdf")).toBe(false);
  });
});
