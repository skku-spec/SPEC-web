"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  Flame,
  Heart,
  Loader2,
  PartyPopper,
  Send,
  ThumbsUp,
  X,
} from "lucide-react";

import { addLogComment } from "@/lib/actions/spec-log-comments";
import { toggleLogReaction } from "@/lib/actions/spec-log-reactions";
import { SPEC_LOG_ENGAGE_ROLES, normalizeRole } from "@/lib/auth-shared";

type ReactionSummary = {
  emoji: string;
  count: number;
  userIds: string[];
};

type LogDetailData = {
  log: {
    id: string;
    event_id: string;
    author_id: string;
    content: string;
    created_at: string;
    updated_at: string;
  };
  author: { id: string; name: string };
  event: {
    id: string;
    title: string;
    description: string | null;
    batch: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  images: { id: string; image_url: string; sort_order: number }[];
  comments: {
    id: string;
    content: string;
    created_at: string;
    author: { id: string; name: string };
    parent_id: string | null;
  }[];
  reactionSummary: ReactionSummary[];
};

type CurrentUserProp = {
  id: string;
  name: string;
  role: string;
} | null;

const REACTION_ICONS: Record<
  string,
  { icon: typeof ThumbsUp; label: string }
> = {
  "👍": { icon: ThumbsUp, label: "좋아요" },
  "🔥": { icon: Flame, label: "불꽃" },
  "❤️": { icon: Heart, label: "하트" },
  "🎉": { icon: PartyPopper, label: "축하" },
  "🤔": { icon: CircleHelp, label: "궁금" },
  "👀": { icon: Eye, label: "관심" },
};

const REACTION_KEYS = ["👍", "🔥", "❤️", "🎉", "🤔", "👀"] as const;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${m}`;
}

function getInitial(name: string): string {
  return name.charAt(0);
}

function ImageGallery({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => onOpen(0)}
          aria-label="이미지 크게 보기"
          className="block w-full overflow-hidden rounded-lg border border-[#ece8db]"
        >
          <img
            src={images[0]}
            alt=""
            className="max-h-[400px] w-full object-contain"
            loading="lazy"
          />
        </button>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {images.map((img, index) => (
          <button
            key={`${img}-${index}`}
            type="button"
            onClick={() => onOpen(index)}
            aria-label={`이미지 ${index + 1} 크게 보기`}
            className="block overflow-hidden rounded-lg border border-[#ece8db]"
          >
            <img
              src={img}
              alt=""
              className="max-h-[280px] w-full object-contain"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {images.map((img, index) => (
        <button
          key={`${img}-${index}`}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={`이미지 ${index + 1} 크게 보기`}
          className={`block overflow-hidden rounded-lg border border-[#ece8db] ${index === 0 ? "col-span-2" : ""}`}
        >
          <img
            src={img}
            alt=""
            className={`w-full object-contain ${index === 0 ? "max-h-[280px]" : "max-h-[200px]"}`}
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 뷰어"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="이전 이미지"
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="다음 이미지"
            className="absolute right-14 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt={`이미지 ${index + 1} / ${images.length}`}
        className="mx-16 max-h-[70vh] max-w-3xl rounded-lg object-contain"
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 font-['Pretendard',sans-serif] text-sm text-white/60">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

export default function LogDetailClient({
  data,
  currentUser,
}: {
  data: LogDetailData;
  currentUser: CurrentUserProp;
}) {
  const router = useRouter();
  const [reactions, setReactions] = useState<ReactionSummary[]>(data.reactionSummary);
  const [comments, setComments] = useState(data.comments);
  const [commentText, setCommentText] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(
    null,
  );

  useEffect(() => {
    setReactions(data.reactionSummary);
    setComments(data.comments);
  }, [data.reactionSummary, data.comments]);

  const currentRole = currentUser ? normalizeRole(currentUser.role) : null;
  const canEngage =
    currentRole !== null && SPEC_LOG_ENGAGE_ROLES.includes(currentRole);
  const imageUrls = useMemo(() => data.images.map((image) => image.image_url), [data.images]);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage = useCallback(
    () =>
      setLightbox((prev) =>
        prev
          ? {
              ...prev,
              index: (prev.index - 1 + prev.images.length) % prev.images.length,
            }
          : null,
      ),
    [],
  );
  const nextImage = useCallback(
    () =>
      setLightbox((prev) =>
        prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null,
      ),
    [],
  );

  const handleToggleReaction = (emoji: string) => {
    if (!currentUser || !canEngage || pendingEmoji) return;

    setPendingEmoji(emoji);
    startTransition(async () => {
      const result = await toggleLogReaction(data.log.id, emoji);
      if (result.success) {
        setReactions((prev) => {
          const next = prev.map((item) => ({ ...item, userIds: [...item.userIds] }));
          const target = next.find((item) => item.emoji === emoji);
          const hasReacted =
            target?.userIds.includes(currentUser.id) ?? false;

          if (hasReacted) {
            if (!target) return prev;
            target.count -= 1;
            target.userIds = target.userIds.filter((id) => id !== currentUser.id);
            return next.filter((item) => item.count > 0);
          }

          if (target) {
            target.count += 1;
            target.userIds.push(currentUser.id);
            return next;
          }

          return [...next, { emoji, count: 1, userIds: [currentUser.id] }];
        });
      }
      setPendingEmoji(null);
      router.refresh();
    });
  };

  const handleCommentSubmit = () => {
    if (!currentUser || !canEngage || !commentText.trim() || isCommentSubmitting) {
      return;
    }

    setIsCommentSubmitting(true);
    startTransition(async () => {
      const result = await addLogComment(data.log.id, commentText.trim());
      if (result.success) {
        setCommentText("");
      }
      setIsCommentSubmitting(false);
      router.refresh();
    });
  };

  const reactionMap = new Map(reactions.map((reaction) => [reaction.emoji, reaction]));

  return (
    <>
      <div className="mx-auto max-w-[960px] px-6 py-10 sm:py-16">
        <Link
          href={`/spec-log/${data.event.id}`}
          className="mb-6 inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-sm font-medium text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          {data.event.title}
        </Link>

        <article className="rounded-lg border border-[#ddd9cc] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
              {getInitial(data.author.name)}
            </div>
            <div>
              <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                {data.author.name}
              </span>
              <span className="ml-2 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                {formatTime(data.log.created_at)}
              </span>
              {data.log.updated_at !== data.log.created_at && (
                <span className="ml-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                  (수정됨)
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 whitespace-pre-wrap font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#4a4a40]">
            {data.log.content}
          </p>

          <ImageGallery
            images={imageUrls}
            onOpen={(index) => setLightbox({ images: imageUrls, index })}
          />

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {REACTION_KEYS.map((key) => {
              const summary = reactionMap.get(key);
              const count = summary?.count ?? 0;
              const isActive = currentUser
                ? (summary?.userIds.includes(currentUser.id) ?? false)
                : false;
              const { icon: Icon, label } = REACTION_ICONS[key];
              const isEmpty = count === 0 && !isActive;
              const isDisabled = !currentUser || !canEngage || pendingEmoji !== null;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleToggleReaction(key)}
                  disabled={isDisabled}
                  aria-label={`${label} ${count}`}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-['Pretendard',sans-serif] text-xs transition-colors ${
                    isActive
                      ? "border-[#FF6C0F] bg-[#FFF0E5] text-[#FF6C0F]"
                      : "border-[#ddd9cc] bg-[#f5f5ee] text-[#6b6b5e]"
                  } ${isEmpty ? "opacity-50" : ""} ${
                    !currentUser ? "cursor-default" : ""
                  } ${pendingEmoji === key ? "opacity-70" : ""}`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="min-w-[1ch] font-semibold">{count}</span>
                </button>
              );
            })}
          </div>

          <section className="mt-4 border-t border-[#ece8db] pt-4">
            <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              댓글 {comments.length}개
            </h2>

            {comments.length === 0 ? (
              <p className="mt-2 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                아직 댓글이 없습니다.
              </p>
            ) : (
              <div className="mt-2">
                {comments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className={`${index === 0 ? "" : "border-t border-[#ece8db]"} py-3`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#4a4a40]">
                        {getInitial(comment.author.name)}
                      </div>
                      <span className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">
                        {comment.author.name}
                      </span>
                      <span className="font-['Pretendard',sans-serif] text-[11px] text-[#6b6b5e]">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 pl-8 font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#4a4a40]">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {currentUser && canEngage && (
              <div className="mt-2 flex items-center gap-2 border-t border-[#ece8db] pt-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  placeholder="댓글을 남겨보세요..."
                  disabled={isCommentSubmitting}
                  className="flex-1 rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || isCommentSubmitting}
                  aria-label="댓글 등록"
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-40"
                >
                  {isCommentSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Send className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  등록
                </button>
              </div>
            )}
          </section>
        </article>

        <Link
          href={`/spec-log/${data.event.id}`}
          className="mt-5 inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-sm font-medium text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
        >
          이벤트 전체 보기
        </Link>
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
}
