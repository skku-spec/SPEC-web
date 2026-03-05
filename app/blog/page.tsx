import { getBlogPosts, getBlogTags } from "@/lib/api";

import BlogPageClient from "./BlogPageClient";

export const revalidate = 3600;

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([getBlogPosts(), getBlogTags()]);

  return <BlogPageClient posts={posts} tags={tags} />;
}
