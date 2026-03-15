import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

export const alt = "SPEC - Execution Over Everything";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bgData = readFileSync(
    join(process.cwd(), "public/member/spec1.jpg"),
  );
  const bgBase64 = `data:image/jpeg;base64,${bgData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgBase64}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.2,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.2), rgba(0,0,0,0.7))",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(249,115,22,0.4)",
              borderRadius: 9999,
              padding: "6px 20px",
              marginBottom: 32,
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              2026 Spring &middot; 4기 추가 모집
            </span>
          </div>

          <span
            style={{
              color: "#FF6C0F",
              fontSize: 100,
              fontWeight: 900,
              lineHeight: 0.95,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
            }}
          >
            EXECUTION
          </span>

          <span
            style={{
              color: "white",
              fontSize: 100,
              fontWeight: 900,
              lineHeight: 0.95,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              marginTop: 8,
            }}
          >
            OVER EVERYTHING.
          </span>

          <span
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: 600,
              marginTop: 40,
            }}
          >
            SKKU Prep Entrepreneurs&apos; Club
          </span>

          <span
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 18,
              marginTop: 10,
            }}
          >
            Building founders who devour markets — Korea first, then the world
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
