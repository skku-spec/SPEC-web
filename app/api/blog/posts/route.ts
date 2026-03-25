import { NextRequest, NextResponse } from "next/server";
import { getBlogPosts } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tag = searchParams.get("tag") || undefined;
  const sort = (searchParams.get("sort") as "newest" | "views") || "newest";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 20;
  const search = searchParams.get("search") || undefined;

  const result = await getBlogPosts({ tag, sort, page, pageSize });

  if (search) {
    const query = search.toLowerCase();
    const filtered = result.posts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query)),
    );
    return NextResponse.json({ posts: filtered, totalCount: filtered.length });
  }

  return NextResponse.json(result);
}
