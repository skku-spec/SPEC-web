import type { Metadata } from "next";
import TagsClient from "@/app/admin/tags/TagsClient";
import { getTagsWithPostCount } from "@/lib/actions/tags";

export const metadata: Metadata = {
  title: "태그 관리 | SPEC Admin",
};

export default async function AdminTagsPage() {
  const tags = await getTagsWithPostCount();

  return <TagsClient initialTags={tags} />;
}
