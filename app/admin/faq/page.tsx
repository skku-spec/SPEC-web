import type { Metadata } from "next";
import { getAllFaqItems } from "@/lib/actions/faq";
import FaqClient from "./FaqClient";

export const metadata: Metadata = {
  title: "FAQ 관리 | SPEC Admin",
};

export default async function AdminFaqPage() {
  const result = await getAllFaqItems();
  return <FaqClient initialItems={result.data ?? []} />;
}
