import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";

import "./blog-post-content.css";

import { getCurrentUser } from "@/lib/auth";
import { getCommentsByPost } from "@/lib/actions/comments";
import { getReactionsByPost } from "@/lib/actions/reactions";
import { incrementViewCount } from "@/lib/actions/views";
import {
  getBlogPostBySlug,
  getBlogPostsByAuthorId,
  getBlogTags,
  getRelatedPosts,
} from "@/lib/api";
import { getPublicAuthorHref } from "@/lib/public-profile";

import AuthorBio from "@/components/blog/AuthorBio";
import CopyLinkButton from "./CopyLinkButton";
import InteractiveSection from "./InteractiveSection";
import PostAuthorActions from "./PostAuthorActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "SPEC Blog | SPEC",
    description: "SPEC 팀의 인사이트와 소식을 전합니다.",
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const currentUserPromise = getCurrentUser().catch(() => ({
    user: null,
    profile: null,
  }));

  const [post, related, tags] = await Promise.all([
    getBlogPostBySlug(slug),
    getRelatedPosts(slug, 3),
    getBlogTags(),
  ]);

  const currentUser = await currentUserPromise;

  if (!post) {
    notFound();
  }

  if (!post.id) {
    notFound();
  }

  incrementViewCount(post.id).catch(() => {});

  const otherArticles = post.authorId
    ? (await getBlogPostsByAuthorId(post.authorId))
        .filter((p) => p.slug !== post.slug)
        .slice(0, 3)
    : [];

  let comments: Awaited<ReturnType<typeof getCommentsByPost>> = [];
  let reactions: Awaited<ReturnType<typeof getReactionsByPost>> = [];
  try {
    [comments, reactions] = await Promise.all([
      getCommentsByPost(post.id),
      getReactionsByPost(post.id),
    ]);
  } catch {
    // Comments/reactions failure should not crash the page
  }

  const tagLabelBySlug = new Map((tags ?? []).map((tag) => [tag.slug, tag.label]));
  const sanitizedContent = (post.content ?? "")
    .replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"')
    .replace(/<img(?![^>]*\bdecoding=)/gi, '<img decoding="async"');
  const authorName = post.author?.trim() || "SPEC";
  const authorInitials = authorName
    .split(" ")
    .map((name) => name[0] ?? "")
    .join("")
    .slice(0, 2) || "S";
  const authorHref = getPublicAuthorHref({
    slug: post.authorSlug,
    role: post.authorRole,
  });

  return (
    <section className="min-h-screen pb-24">
      <div className="mx-auto max-w-[720px] px-4 pt-14 md:pt-20">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 font-['Pretendard',sans-serif] text-[14px] text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
        >
          <ArrowLeftIcon />
          SPEC 소식
        </Link>

        <article>
          <header className="mb-8">
            {post.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
                {post.tags.map((tagSlug) => (
                  <Link
                    key={tagSlug}
                    href={`/blog/tag/${tagSlug}`}
                    className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#FF6C0F] hover:underline"
                  >
                    # {tagLabelBySlug.get(tagSlug) ?? tagSlug}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="font-[system-ui] text-[clamp(2rem,4vw,3rem)] font-black leading-[1.15] tracking-tight text-[#16140f]">
              {post.title}
            </h1>

            <div className="mt-4 flex items-center gap-4 font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
              <span>{post.date}</span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" strokeWidth={1.5} />
                {new Intl.NumberFormat("ko-KR").format(post.viewCount)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6C0F] font-['Pretendard',sans-serif] text-[14px] font-semibold text-white">
                {authorInitials}
              </div>
              <div>
                {authorHref ? (
                  <Link
                    href={authorHref}
                    className="font-['Pretendard',sans-serif] text-[14px] font-medium text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                  >
                    {authorName}
                  </Link>
                ) : (
                  <p className="font-['Pretendard',sans-serif] text-[14px] font-medium text-[#16140f]">
                    {authorName}
                  </p>
                )}
                <p className="font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
                  {new Date(post.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            <PostAuthorActions slug={post.slug} authorId={post.authorId} postId={post.id} published={post.published} />
          </header>

          {post.imageUrl && (
            <div className="mb-10 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.title}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="aspect-[16/9] h-auto w-full object-cover"
              />
            </div>
          )}

          <div
            className="prose-content mb-10"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          <div className="flex items-center gap-3 mt-8">
            <CopyLinkButton />
          </div>

          <AuthorBio
            name={authorName}
            company={post.authorCompany}
            jobTitle={post.authorJobTitle}
            bio={post.authorBio}
            avatarUrl={post.authorAvatarUrl}
            profileHref={post.authorSlug ? `/founders/${post.authorSlug}` : undefined}
          />

          {otherArticles.length > 0 && (
            <div className="mt-6 mb-8">
              <h3 className="mb-3 font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
                {authorName} 님이 작성한 다른 아티클
              </h3>
              <div className="space-y-1">
                {otherArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="block py-1 font-['Pretendard',sans-serif] text-sm text-[#4a4a40] transition-colors hover:text-[#FF6C0F]"
                  >
                    {article.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <InteractiveSection
            postId={post.id}
            comments={comments}
            reactions={reactions}
            userId={currentUser.user?.id}
          />
        </article>
      </div>

      {related.length > 0 && (
        <div className="border-t border-[#ddd9cc]">
          <div className="mx-auto max-w-[960px] px-4 pt-10 md:px-8">
            <h3 className="mb-6 font-[system-ui] text-[22px] font-black text-[#16140f]">
              더 많은 SPEC 소식 보기
            </h3>
            <div className="grid gap-5 md:grid-cols-3">
              {related.map((relatedPost) => (
                <article
                  key={relatedPost.slug}
                  className="rounded-lg border border-[#ddd9cc] bg-white p-5"
                >
                  <Link
                    href={`/blog/${relatedPost.slug}`}
                    className="mb-1 block font-[system-ui] text-[16px] font-black leading-snug text-[#16140f] transition-colors hover:text-[#FF6C0F]"
                  >
                    {relatedPost.title}
                  </Link>
                  <p className="mb-2 font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
                    {relatedPost.author} &middot; {relatedPost.date}
                  </p>
                  <p className="mb-3 font-['Pretendard',sans-serif] text-[13px] font-normal leading-relaxed text-[#4a4a40] line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <Link
                    href={`/blog/${relatedPost.slug}`}
                    className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
                  >
                    Read More <ArrowIcon />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
