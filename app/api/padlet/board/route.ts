import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

type JsonApiResource = {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: { type: string; id: string } | null }>;
};

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // Rate limiting
  const rl = rateLimit(`padlet:${user.id}`, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  let boardId = req.nextUrl.searchParams.get("board_id");
  if (!boardId) {
    return NextResponse.json({ error: "board_id is required" }, { status: 400 });
  }

  // SSRF validation
  if (!/^[a-zA-Z0-9_-]+$/.test(boardId)) {
    return NextResponse.json({ error: "잘못된 board_id입니다." }, { status: 400 });
  }

  // Robust parsing: If boardId looks like a URL, extract the last part
  // e.g., https://padlet.com/user/12345678 -> 12345678
  if (boardId.includes("padlet.com/")) {
    const parts = boardId.split("/");
    boardId = parts[parts.length - 1] || boardId;
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
          "X-Api-Key": apiKey,
          // Padlet API v1 uses JSON:API spec — must use vnd.api+json, NOT application/json
          "Accept": "application/vnd.api+json",
        },
        cache: "no-store", // Ensure we fetch fresh data from Padlet every time
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Padlet API error: ${res.status}`, detail: errText },
        { status: res.status }
      );
    }

    // JSON:API response shape:
    // { data: {...}, included: [ {type, id, attributes, relationships}, ... ] }
    const json = await res.json() as { data: JsonApiResource; included?: JsonApiResource[] };
    const included: JsonApiResource[] = json.included || [];

    // Build a lookup map: "type:id" -> resource
    const resourceMap = new Map<string, JsonApiResource>();
    for (const r of included) {
      resourceMap.set(`${r.type}:${r.id}`, r);
    }

    // Normalize sections
    const sections = included
      .filter((r) => r.type === "section")
      .map((r) => ({
        id: r.id,
        title: (r.attributes?.title as string) || "(섹션 없음)",
      }));

    // Normalize posts — author can be in attributes OR via relationships -> user in included
    const posts = included
      .filter((r) => r.type === "post")
      .map((r) => {
        // Try attributes.author first (if Padlet embeds it directly)
        let authorName: string | undefined;
        let authorEmail: string | undefined;
        let authorUsername: string | undefined;

        const attrAuthor = r.attributes?.author as Record<string, unknown> | undefined;
        if (attrAuthor) {
          // Padlet embedded author info often uses fullName or name
          authorName = (attrAuthor.fullName as string) || (attrAuthor.name as string) || (attrAuthor.shortName as string);
          authorEmail = attrAuthor.email as string | undefined;
          authorUsername = attrAuthor.username as string | undefined;
        } else {
          // Fallback: look up the author via relationships -> user resource in included
          const authorRel = r.relationships?.author?.data as { type: string; id: string } | undefined;
          if (authorRel) {
            const authorResource = resourceMap.get(`${authorRel.type}:${authorRel.id}`);
            if (authorResource) {
              const attrs = authorResource.attributes || {};
              authorName = (attrs.fullName as string) || (attrs.name as string) || (attrs.display_name as string);
              authorEmail = attrs.email as string | undefined;
              authorUsername = attrs.username as string | undefined;
            }
          }
        }

        // Section relationship
        const sectionRel = r.relationships?.section?.data as { type: string; id: string } | undefined;
        const sectionId = sectionRel?.id;

        return {
          id: r.id,
          author: authorName || authorEmail || authorUsername
            ? { name: authorName, email: authorEmail, username: authorUsername }
            : undefined,
          section_id: sectionId,
          title: r.attributes?.title as string | undefined, // Added title
          body: r.attributes?.body as string | undefined,  // Added body
        };
      });

    return NextResponse.json({ sections, posts });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
