import { describe, expect, it, vi } from "vitest";

import {
  prepareIdeathonProfileImageForUpload,
  type ImagePreparationRuntime,
} from "@/app/ideathon/ideathon-team-profile-form-utils";

type ResizeCall = {
  readonly width: number;
  readonly height: number;
  readonly quality: number;
};

function makeImageFile(byteLength: number, name = "profile.png"): File {
  return new File([new Uint8Array(byteLength)], name, {
    type: "image/png",
    lastModified: 1234,
  });
}

describe("prepareIdeathonProfileImageForUpload", () => {
  it("returns a smaller jpeg file when browser preprocessing succeeds", async () => {
    const original = makeImageFile(4096);
    const close = vi.fn();
    let resizeCall: ResizeCall | null = null;
    const runtime: ImagePreparationRuntime = {
      decode: async () => ({
        width: 4000,
        height: 2000,
        close,
        toJpegBlob: async (width, height, quality) => {
          resizeCall = { width, height, quality };
          return new Blob([new Uint8Array(1024)], { type: "image/jpeg" });
        },
      }),
    };

    const result = await prepareIdeathonProfileImageForUpload(original, runtime);

    expect(result).not.toBe(original);
    expect(result.name).toBe("profile.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBe(1024);
    expect(result.lastModified).toBe(1234);
    expect(resizeCall).toEqual({ width: 1280, height: 640, quality: 0.82 });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("keeps the original file when preprocessing is not smaller", async () => {
    const original = makeImageFile(1024);
    const close = vi.fn();
    const runtime: ImagePreparationRuntime = {
      decode: async () => ({
        width: 800,
        height: 800,
        close,
        toJpegBlob: async () => new Blob([new Uint8Array(1024)], { type: "image/jpeg" }),
      }),
    };

    const result = await prepareIdeathonProfileImageForUpload(original, runtime);

    expect(result).toBe(original);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("keeps the original file when preprocessing fails", async () => {
    const original = makeImageFile(2048);
    const close = vi.fn();
    const runtime: ImagePreparationRuntime = {
      decode: async () => ({
        width: 800,
        height: 800,
        close,
        toJpegBlob: async () => {
          throw new Error("canvas failed");
        },
      }),
    };

    const result = await prepareIdeathonProfileImageForUpload(original, runtime);

    expect(result).toBe(original);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
