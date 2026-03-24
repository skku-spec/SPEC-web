import { getAllFaqItems } from "@/lib/actions/faq";
import FaqClient from "./FaqClient";

export default async function AdminFaqPage() {
  const result = await getAllFaqItems();
  return <FaqClient initialItems={result.data ?? []} />;
}
