import TagsClient from "@/app/admin/tags/TagsClient";
import { getTagsWithPostCount } from "@/lib/actions/tags";

export default async function AdminTagsPage() {
  const tags = await getTagsWithPostCount();

  return <TagsClient initialTags={tags} />;
}
