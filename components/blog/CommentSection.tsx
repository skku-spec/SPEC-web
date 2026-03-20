"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { addComment, deleteComment, type CommentWithAuthor } from "@/lib/actions/comments";
import { useUser } from "@/hooks/useUser";
import type { UserRole } from "@/lib/auth";

type CommentSectionProps = {
  postId: string;
  initialComments: CommentWithAuthor[];
};

type ThreadNode = CommentWithAuthor & {
  replies: CommentWithAuthor[];
};

const WRITER_ROLES = new Set<UserRole>(["runner", "preneur", "admin"]);

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitial(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

function buildThread(comments: CommentWithAuthor[]): ThreadNode[] {
  const sorted = [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const nodes = new Map<string, ThreadNode>();

  for (const comment of sorted) {
    nodes.set(comment.id, {
      ...comment,
      replies: [],
    });
  }

  const roots: ThreadNode[] = [];

  for (const comment of sorted) {
    const node = nodes.get(comment.id);
    if (!node) {
      continue;
    }

    if (!comment.parentId) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(comment.parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    if (parent.parentId) {
      roots.push(node);
      continue;
    }

    parent.replies.push(comment);
  }

  return roots;
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const { user, role, isLoading, isAuthenticated } = useUser();
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ targetId: string; parentId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const canWrite = isAuthenticated && WRITER_ROLES.has(role);
  const thread = useMemo(() => buildThread(comments), [comments]);

  const submitTopLevelComment = () => {
    const content = draft.trim();
    if (!content) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addComment(postId, content);
      if (!result.success) {
        setError(result.error ?? "댓글을 등록하지 못했습니다.");
        return;
      }

      setDraft("");
      router.refresh();
    });
  };

  const submitReply = () => {
    if (!replyTarget) {
      return;
    }

    const content = replyDraft.trim();
    if (!content) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addComment(postId, content, replyTarget.parentId);
      if (!result.success) {
        setError(result.error ?? "답글을 등록하지 못했습니다.");
        return;
      }

      setReplyDraft("");
      setReplyTarget(null);
      router.refresh();
    });
  };

  const handleDelete = (commentId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (!result.success) {
        setError(result.error ?? "댓글을 삭제하지 못했습니다.");
        return;
      }

      setComments((current) => current.filter((comment) => comment.id !== commentId && comment.parentId !== commentId));
      router.refresh();
    });
  };

  return (
    <section
      className="mt-8 rounded-xl border px-4 py-8 md:px-6"
      style={{
        backgroundColor: "#f5f5ee",
        borderColor: "#ddd9cc",
        color: "#16140f",
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      <h2 className="mb-4 text-[20px] font-semibold text-[#16140f]">댓글</h2>

      {error && <p className="mb-4 text-[14px] text-[#FF6C0F]">{error}</p>}

      {!isLoading && !isAuthenticated && (
        <p className="mb-5 text-[14px] text-[#6b6b5e]">
          <Link href="/login" className="font-medium text-[#FF6C0F] hover:opacity-80">
            Login to comment
          </Link>
        </p>
      )}

      {canWrite && (
        <div className="mb-6 rounded-lg border border-[#ddd9cc] bg-white p-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder="댓글을 남겨주세요"
            className="w-full resize-y rounded-md border border-[#ddd9cc] bg-[#f5f5ee] px-3 py-2 text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F]"
            disabled={isPending}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-full bg-[#FF6C0F] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={submitTopLevelComment}
              disabled={isPending || draft.trim().length === 0}
            >
              {isPending ? "등록 중..." : "댓글 작성"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {thread.length === 0 && <p className="text-[14px] text-[#6b6b5e]">아직 댓글이 없습니다.</p>}

        {thread.map((comment) => {
          const canDelete = user?.id === comment.author.id || role === "admin";

          return (
            <article key={comment.id} className="rounded-lg border border-[#ddd9cc] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6C0F] text-[13px] font-semibold text-white">
                  {getInitial(comment.author.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-[#16140f]">{comment.author.name}</p>
                    <p className="text-[12px] text-[#6b6b5e]">{formatDate(comment.createdAt)}</p>
                  </div>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#16140f]">{comment.content}</p>

                  <div className="mt-3 flex items-center gap-3">
                    {canWrite && (
                      <button
                        type="button"
                        className="text-[13px] font-medium text-[#FF6C0F] hover:opacity-80"
                        onClick={() => {
                          const isSameTarget = replyTarget?.targetId === comment.id;
                          setReplyTarget(isSameTarget ? null : { targetId: comment.id, parentId: comment.id });
                          setReplyDraft("");
                        }}
                        disabled={isPending}
                      >
                        Reply
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="text-[13px] font-medium text-[#6b6b5e] hover:text-[#16140f]"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {canWrite && replyTarget?.targetId === comment.id && (
                    <div className="mt-3 rounded-md border border-[#ddd9cc] bg-[#f5f5ee] p-3">
                      <textarea
                        value={replyDraft}
                        onChange={(event) => setReplyDraft(event.target.value)}
                        rows={3}
                        placeholder="답글을 남겨주세요"
                        className="w-full resize-y rounded-md border border-[#ddd9cc] bg-white px-3 py-2 text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F]"
                        disabled={isPending}
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-[#ddd9cc] px-3 py-1.5 text-[12px] text-[#6b6b5e]"
                          onClick={() => {
                            setReplyTarget(null);
                            setReplyDraft("");
                          }}
                          disabled={isPending}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-[#FF6C0F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={submitReply}
                          disabled={isPending || replyDraft.trim().length === 0}
                        >
                          등록
                        </button>
                      </div>
                    </div>
                  )}

                  {comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 border-l border-[#ddd9cc] pl-4">
                      {comment.replies.map((reply) => {
                        const canDeleteReply = user?.id === reply.author.id || role === "admin";

                        return (
                          <div key={reply.id} className="rounded-md border border-[#ddd9cc] bg-[#f5f5ee] p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6C0F] text-[11px] font-semibold text-white">
                                {getInitial(reply.author.name)}
                              </div>
                              <p className="text-[13px] font-semibold text-[#16140f]">{reply.author.name}</p>
                              <p className="text-[12px] text-[#6b6b5e]">{formatDate(reply.createdAt)}</p>
                            </div>
                            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#16140f]">{reply.content}</p>

                            <div className="mt-2 flex items-center gap-3">
                              {canWrite && (
                                <button
                                  type="button"
                                  className="text-[12px] font-medium text-[#FF6C0F] hover:opacity-80"
                                  onClick={() => {
                                    const isSameTarget = replyTarget?.targetId === reply.id;
                                    setReplyTarget(isSameTarget ? null : { targetId: reply.id, parentId: comment.id });
                                    setReplyDraft("");
                                  }}
                                  disabled={isPending}
                                >
                                  Reply
                                </button>
                              )}

                              {canDeleteReply && (
                                <button
                                  type="button"
                                  className="text-[12px] font-medium text-[#6b6b5e] hover:text-[#16140f]"
                                  onClick={() => handleDelete(reply.id)}
                                  disabled={isPending}
                                >
                                  Delete
                                </button>
                              )}
                            </div>

                            {canWrite && replyTarget?.targetId === reply.id && (
                              <div className="mt-3 rounded-md border border-[#ddd9cc] bg-white p-3">
                                <textarea
                                  value={replyDraft}
                                  onChange={(event) => setReplyDraft(event.target.value)}
                                  rows={3}
                                  placeholder="답글을 남겨주세요"
                                  className="w-full resize-y rounded-md border border-[#ddd9cc] bg-[#f5f5ee] px-3 py-2 text-[14px] text-[#16140f] outline-none transition-colors focus:border-[#FF6C0F]"
                                  disabled={isPending}
                                />
                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    className="rounded-full border border-[#ddd9cc] px-3 py-1.5 text-[12px] text-[#6b6b5e]"
                                    onClick={() => {
                                      setReplyTarget(null);
                                      setReplyDraft("");
                                    }}
                                    disabled={isPending}
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full bg-[#FF6C0F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={submitReply}
                                    disabled={isPending || replyDraft.trim().length === 0}
                                  >
                                    등록
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
