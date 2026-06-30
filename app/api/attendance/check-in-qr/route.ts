import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

import { buildAttendanceCheckInUrl, normalizeAttendanceCode } from "@/lib/attendance-check-in-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session")?.trim();
  const code = normalizeAttendanceCode(request.nextUrl.searchParams.get("code") ?? "");

  if (!sessionId || code.length !== 6) {
    return new NextResponse("Invalid QR payload", { status: 400 });
  }

  const targetUrl = buildAttendanceCheckInUrl(request.nextUrl.origin, sessionId, code);
  const svg = await QRCode.toString(targetUrl, {
    type: "svg",
    margin: 1,
    width: 240,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
