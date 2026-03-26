import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { getLogById } from "@/lib/actions/spec-log";

import LogDetailClient from "./LogDetailClient";

const getCachedLogById = cache(getLogById);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string; logId: string }>;
}): Promise<Metadata> {
  const { logId } = await params;
  const result = await getCachedLogById(logId);
  if (!result.success || !result.data) return { title: "SPEC 로그" };

  const { log, author, event, images } = result.data;
  const contentPreview =
    log.content.slice(0, 100) + (log.content.length > 100 ? "..." : "");
  const ogImage = images[0]?.image_url;

  return {
    title: `${author.name}의 로그 | ${event.title} | SPEC`,
    description: contentPreview,
    openGraph: {
      title: `${author.name}의 로그 — ${event.title}`,
      description: contentPreview,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
      type: "article",
      siteName: "SKKU SPEC",
      locale: "ko_KR",
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: `${author.name}의 로그 — ${event.title}`,
      description: contentPreview,
    },
  };
}

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; logId: string }>;
}) {
  const { eventId, logId } = await params;

  const [logResult, auth] = await Promise.all([
    getCachedLogById(logId),
    getCurrentUser().catch(() => ({ user: null, profile: null })),
  ]);

  if (!logResult.success || !logResult.data) {
    notFound();
  }

  if (logResult.data.event.id !== eventId) {
    notFound();
  }

  const currentUser =
    auth.user && auth.profile
      ? {
          id: auth.user.id,
          name: auth.profile.name ?? "",
          role: auth.profile.role ?? "outsider",
        }
      : null;

  return <LogDetailClient data={logResult.data} currentUser={currentUser} />;
}
