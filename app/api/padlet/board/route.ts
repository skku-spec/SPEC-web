import { NextRequest, NextResponse } from "next/server";

type JsonApiResource = {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: { type: string; id: string } | null }>;
};

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
          // Padlet API v1 uses JSON:API spec — must use vnd.api+json, NOT application/json
          "Accept": "application/vnd.api+json",
        },
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

        const attrAuthor = r.attributes?.author as Record<string, string> | undefined;
        if (attrAuthor) {
          authorName = attrAuthor.name;
          authorEmail = attrAuthor.email;
        } else {
          // Fallback: look up the author via relationships -> user resource in included
          const authorRel = r.relationships?.author?.data;
          if (authorRel) {
            const authorResource = resourceMap.get(`${authorRel.type}:${authorRel.id}`);
            if (authorResource) {
              authorName = (authorResource.attributes?.name as string) ||
                           (authorResource.attributes?.display_name as string);
              authorEmail = authorResource.attributes?.email as string | undefined;
            }
          }
        }

        // Section relationship
        const sectionRel = r.relationships?.section?.data;
        const sectionId = sectionRel?.id;

        return {
          id: r.id,
          author: authorName || authorEmail
            ? { name: authorName, email: authorEmail }
            : undefined,
          section_id: sectionId,
        };
      });

    return NextResponse.json({ sections, posts });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
