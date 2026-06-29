"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Paperclip, MessageCircle, Share2, SmilePlus } from "lucide-react";

import type { FeedPost } from "@/app/team-building-2026/TeamBuildingCommunity";

function renderRichText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-[#1A1A1A]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`} className="rounded bg-[#f0efe6] px-1.5 py-0.5 text-sm text-[#16140f]">{part.slice(1, -1)}</code>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderMarkdown(text: string, keyPrefix: string) {
  const lines = text.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  function flushList(index: number) {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`${keyPrefix}-list-${index}`} className="list-disc space-y-1 pl-5">
        {listItems.map((item, itemIndex) => <li key={`${keyPrefix}-li-${index}-${itemIndex}`}>{renderRichText(item)}</li>)}
      </ul>,
    );
    listItems = [];
  }

  function flushCode(index: number) {
    if (codeLines.length === 0) return;
    nodes.push(
      <pre key={`${keyPrefix}-code-${index}`} className="overflow-x-auto rounded-xl bg-[#16140f] p-4 text-sm leading-6 text-white">
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
  }

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        flushCode(index);
        inCode = false;
      } else {
        flushList(index);
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    const listMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList(index);
    if (!line.trim()) {
      nodes.push(<div key={`${keyPrefix}-space-${index}`} className="h-2" />);
    } else {
      const imageMatch = line.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
      if (imageMatch) {
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`${keyPrefix}-${index}`} src={imageMatch[1]} alt="" className="max-h-96 w-full rounded-xl border border-[#ece8db] object-cover" />,
        );
        return;
      }
    }

    if (!line.trim()) {
      return;
    } else if (line.startsWith("### ")) {
      nodes.push(<h4 key={`${keyPrefix}-${index}`} className="text-base font-black text-[#1A1A1A]">{renderRichText(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      nodes.push(<h3 key={`${keyPrefix}-${index}`} className="text-lg font-black text-[#1A1A1A]">{renderRichText(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      nodes.push(<h2 key={`${keyPrefix}-${index}`} className="text-xl font-black text-[#1A1A1A]">{renderRichText(line.slice(2))}</h2>);
    } else if (line.startsWith("> ")) {
      nodes.push(<blockquote key={`${keyPrefix}-${index}`} className="border-l-4 border-[#FF6C0F] pl-3 text-[#6b6b5e]">{renderRichText(line.slice(2))}</blockquote>);
    } else {
      nodes.push(<p key={`${keyPrefix}-${index}`}>{renderRichText(line)}</p>);
    }
  });

  flushList(lines.length);
  flushCode(lines.length);
  return nodes;
}

export default function FeedCard({ post }: { post: FeedPost }) {
  const [expanded, setExpanded] = useState(false);
  const hasBlocks = Boolean(post.contentBlocks?.length);
  const isLong = !hasBlocks && (post.paragraphs.length > 1 || post.paragraphs.join(" ").length > 180);
  const visibleParagraphs = useMemo(() => (expanded || !isLong ? post.paragraphs : post.paragraphs.slice(0, 1)), [expanded, isLong, post.paragraphs]);

  return (
    <article className="rounded-lg border border-[#ddd9cc] bg-white p-5 shadow-[0_1px_0_rgba(22,20,15,0.04)] sm:p-6">
      <header className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8e6dc] text-sm font-black text-[#16140f]">
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatarUrl} alt={post.author.name} className="h-full w-full object-cover" />
          ) : (
            post.author.fallback ?? post.author.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate text-sm font-bold text-[#1A1A1A]">{post.author.name}</h2>
            <span className="text-xs text-[#6b6b5e]">{post.date}</span>
          </div>
          <p className="mt-1 truncate text-xs text-[#6b6b5e]">{post.author.meta}</p>
        </div>
      </header>

      <div className="mt-5">
        <h3 className="text-lg font-bold leading-snug text-[#1A1A1A]">{post.title}</h3>
        {post.kind === "kpi" ? <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[#6b6b5e]">
            <span>KPI achievement</span>
            <span className="font-bold text-[#16140f]">{post.isMeasured ? `${post.achievementRate}%` : "Not measured"}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0efe6]">
            <div className="h-full rounded-full bg-[#FF6C0F]" style={{ width: `${post.isMeasured ? Math.min(post.achievementRate, 100) : 0}%` }} />
          </div>
        </div> : null}
        {!hasBlocks && post.linkedKpis && post.linkedKpis.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.linkedKpis.map((kpi) => (
              <span key={kpi.id} className="rounded-full bg-[#FFF0E5] px-3 py-1 text-xs font-bold text-[#b45309]">
                {kpi.title} · {kpi.isMeasured ? `${kpi.achievementRate}%` : "Not measured"}
              </span>
            ))}
          </div>
        ) : null}
        {!hasBlocks && post.imageUrls && post.imageUrls.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {post.imageUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={`${post.title} attachment`} className="max-h-80 w-full rounded-xl border border-[#ece8db] object-cover" />
            ))}
          </div>
        ) : null}
        {!hasBlocks && post.fileAttachments && post.fileAttachments.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.fileAttachments.map((file) => (
              <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-[#ddd9cc] px-3 py-1.5 text-xs font-bold text-[#4a4a40] hover:border-[#FF6C0F]">
                <Paperclip className="h-3.5 w-3.5" strokeWidth={2} />
                {file.name}
              </a>
            ))}
          </div>
        ) : null}
        {hasBlocks ? (
          <div className="mt-4 space-y-4">
            {post.contentBlocks!.map((block, index) => {
              if (block.type === "text") {
                if (block.variant === "heading1") {
                  return <h2 key={`${post.id}-block-${index}`} className="rounded-xl bg-[#f5f5ee] px-4 py-3 text-3xl font-black leading-tight text-[#1A1A1A]">{renderRichText(block.text)}</h2>;
                }
                if (block.variant === "heading2") {
                  return <h3 key={`${post.id}-block-${index}`} className="rounded-xl bg-[#f5f5ee] px-4 py-3 text-2xl font-black leading-tight text-[#1A1A1A]">{renderRichText(block.text)}</h3>;
                }
                if (block.variant === "heading3") {
                  return <h4 key={`${post.id}-block-${index}`} className="rounded-xl bg-[#f5f5ee] px-4 py-3 text-xl font-black leading-tight text-[#1A1A1A]">{renderRichText(block.text)}</h4>;
                }
                return <div key={`${post.id}-block-${index}`} className="space-y-2 text-[15px] leading-7 text-[#4a4a40]">{renderMarkdown(block.text, `${post.id}-block-${index}`)}</div>;
              }
              if (block.type === "blocknote") {
                return (
                  <div key={`${post.id}-block-${index}`} className="space-y-3 text-[15px] leading-7 text-[#4a4a40]">
                    {renderMarkdown(block.markdown ?? "", `${post.id}-blocknote-${index}`)}
                  </div>
                );
              }
              if (block.type === "kpi") {
                return (
                  <div key={`${post.id}-block-${index}`} className="rounded-xl border border-[#ddd9cc] bg-[#fbfaf4] p-3">
                    <p className="text-xs font-bold text-[#6b6b5e]">Linked KPI</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="font-bold text-[#1A1A1A]">{block.title ?? "KPI"}</p>
                      <span className="rounded-full bg-[#FFF0E5] px-2.5 py-1 text-xs font-bold text-[#b45309]">
                        {block.isMeasured ? `${block.achievementRate ?? 0}%` : "Not measured"}
                      </span>
                    </div>
                  </div>
                );
              }
              if (block.type === "image") {
                return (
                  <div key={`${post.id}-block-${index}`} style={{ width: `${block.width ?? 100}%` }} className="max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.url} alt={`${post.title} image`} className="max-h-96 w-full rounded-xl border border-[#ece8db] object-cover" />
                  </div>
                );
              }
              return (
                <a key={`${post.id}-block-${index}`} href={block.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#ddd9cc] px-3 py-2 text-sm font-bold text-[#4a4a40] hover:border-[#FF6C0F]">
                  <Paperclip className="h-4 w-4" strokeWidth={2} />
                  {block.name}
                </a>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-[15px] leading-7 text-[#4a4a40]">
            {visibleParagraphs.map((paragraph, index) => (
              <p key={`${post.id}-${index}`}>{renderRichText(paragraph)}</p>
            ))}
          </div>
        )}
        {isLong ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-3 text-sm font-semibold text-[#FF6C0F] transition-colors hover:text-[#16140f]"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[#ece8db] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className="text-sm font-semibold text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]">
          {post.translateLabel}
        </button>
        <div className="flex flex-wrap items-center gap-1 text-[#6b6b5e]">
          <button type="button" className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm transition-colors hover:bg-[#f0efe6] hover:text-[#16140f]" aria-label="React">
            <SmilePlus className="h-4 w-4" strokeWidth={2} />
            {post.reactionCount}
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm transition-colors hover:bg-[#f0efe6] hover:text-[#16140f]" aria-label="Comment">
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            {post.commentCount}
          </button>
          <button type="button" className="inline-flex h-9 items-center justify-center rounded-md px-2 transition-colors hover:bg-[#f0efe6] hover:text-[#16140f]" aria-label="Share">
            <Share2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}
