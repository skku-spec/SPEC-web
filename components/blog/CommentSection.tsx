"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { addComment, deleteComment, type CommentWithAuthor } from "@/lib/actions/comments";
import { useUser } from "@/hooks/useUser";
import { BLOG_WRITER_ROLES, normalizeRole } from "@/lib/auth-shared";
import { formatKoreanDate } from "@/lib/utils/koreanDate";

type CommentSectionProps = {
  postId: string;
  initialComments: CommentWithAuthor[];
};

type ThreadNode = CommentWithAuthor & {
  replies: CommentWithAuthor[];
};

function formatDate(value: string): string {
  return formatKoreanDate(value, {
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

function ReplyForm({
  replyDraft,
  onChangeDraft,
  onSubmit,
  onCancel,
  isPending,
}: {
  replyDraft: string;
  onChangeDraft: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="mt-3">
      <textarea
        value={replyDraft}
        onChange={(e) => onChangeDraft(e.target.value)}
        rows={3}
        placeholder="답글을 남겨주세요"
        className="w-full resize-y rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
        disabled={isPending}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] disabled:opacity-50"
          onClick={onCancel}
          disabled={isPending}
        >
          취소
        </button>
        <button
          type="button"
          className="h-8 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onSubmit}
          disabled={isPending || replyDraft.trim().length === 0}
        >
          등록
        </button>
      </div>
    </div>
  );
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const { user, profile, role, isLoading, isAuthenticated } = useUser();
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ targetId: string; parentId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const normalizedRole = normalizeRole(role);
  const isAdmin = profile?.is_admin === true;
  const canWrite = isAuthenticated && BLOG_WRITER_ROLES.includes(normalizedRole);
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
    });
  };

  return (
    <section className="mt-10 border-t border-[#ddd9cc] pt-8">
      <h2 className="mb-4 font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">
        댓글 {comments.length > 0 && comments.length}
      </h2>

      {error && (
        <p className="mb-4 font-['Pretendard',sans-serif] text-sm text-[#b42318]">{error}</p>
      )}

      {!isLoading && !isAuthenticated && (
        <p className="py-5 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
          <Link href="/login" className="font-semibold text-[#FF6C0F] hover:underline">
            로그인
          </Link>
          {" "}후 댓글을 남길 수 있어요
        </p>
      )}

      {canWrite && (
        <div className="mb-6">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder="댓글을 남겨주세요"
            className="w-full resize-y rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
            disabled={isPending}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="h-8 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={submitTopLevelComment}
              disabled={isPending || draft.trim().length === 0}
            >
              {isPending ? "등록 중..." : "댓글 작성"}
            </button>
          </div>
        </div>
      )}

      <div>
        {thread.length === 0 && (
          <p className="py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            아직 댓글이 없습니다.
          </p>
        )}

        {thread.map((comment) => {
          const canDelete = user?.id === comment.author.id || isAdmin;

          return (
            <article key={comment.id} className="border-b border-[#ece8db] py-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
                  {getInitial(comment.author.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {comment.author.name}
                    </span>
                    <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#4a4a40]">
                    {comment.content}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    {canWrite && (
                      <button
                        type="button"
                        className="font-['Pretendard',sans-serif] text-xs font-medium text-[#FF6C0F] hover:underline disabled:opacity-50"
                        onClick={() => {
                          const isSameTarget = replyTarget?.targetId === comment.id;
                          setReplyTarget(isSameTarget ? null : { targetId: comment.id, parentId: comment.id });
                          setReplyDraft("");
                        }}
                        disabled={isPending}
                      >
                        답글
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] hover:underline disabled:opacity-50"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isPending}
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  {canWrite && replyTarget?.targetId === comment.id && (
                    <ReplyForm
                      replyDraft={replyDraft}
                      onChangeDraft={setReplyDraft}
                      onSubmit={submitReply}
                      onCancel={() => {
                        setReplyTarget(null);
                        setReplyDraft("");
                      }}
                      isPending={isPending}
                    />
                  )}

                  {comment.replies.length > 0 && (
                    <div className="mt-4 ml-10 space-y-0 border-l-2 border-[#ece8db] pl-4">
                      {comment.replies.map((reply) => {
                        const canDeleteReply = user?.id === reply.author.id || isAdmin;

                        return (
                          <div key={reply.id} className="py-3">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-xs font-semibold text-[#4a4a40]">
                                {getInitial(reply.author.name)}
                              </div>
                              <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                                {reply.author.name}
                              </span>
                              <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#4a4a40]">
                              {reply.content}
                            </p>

                            <div className="mt-2 flex items-center gap-3">
                              {canWrite && (
                                <button
                                  type="button"
                                  className="font-['Pretendard',sans-serif] text-xs font-medium text-[#FF6C0F] hover:underline disabled:opacity-50"
                                  onClick={() => {
                                    const isSameTarget = replyTarget?.targetId === reply.id;
                                    setReplyTarget(isSameTarget ? null : { targetId: reply.id, parentId: comment.id });
                                    setReplyDraft("");
                                  }}
                                  disabled={isPending}
                                >
                                  답글
                                </button>
                              )}

                              {canDeleteReply && (
                                <button
                                  type="button"
                                  className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318] hover:underline disabled:opacity-50"
                                  onClick={() => handleDelete(reply.id)}
                                  disabled={isPending}
                                >
                                  삭제
                                </button>
                              )}
                            </div>

                            {canWrite && replyTarget?.targetId === reply.id && (
                              <ReplyForm
                                replyDraft={replyDraft}
                                onChangeDraft={setReplyDraft}
                                onSubmit={submitReply}
                                onCancel={() => {
                                  setReplyTarget(null);
                                  setReplyDraft("");
                                }}
                                isPending={isPending}
                              />
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
