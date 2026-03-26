import type { Metadata } from "next";
import { getBlogPosts, getBlogTags, getTrendingPosts } from "@/lib/api";

import BlogPageClient from "./BlogPageClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "블로그 | SPEC",
};

export default async function BlogPage() {
  const [{ posts, totalCount }, tags, trendingPosts] = await Promise.all([
    getBlogPosts(),
    getBlogTags(),
    getTrendingPosts(),
  ]);

  return (
    <BlogPageClient
      posts={posts}
      totalCount={totalCount}
      tags={tags}
      trendingPosts={trendingPosts}
    />
  );
}
