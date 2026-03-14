import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const boardId = req.nextUrl.searchParams.get("board_id");
  if (!boardId) {
    return NextResponse.json({ error: "board_id is required" }, { status: 400 });
  }

  const apiKey = process.env.PADLET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Padlet API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.padlet.dev/v1/boards/${boardId}?include=posts,sections`,
      {
        headers: {
          "x-api-key": apiKey,
          "Accept": "application/json",
        },
        // Cache for 60 seconds to reduce API calls
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Padlet API error: ${res.status}`, detail: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
