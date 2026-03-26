"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  Flame,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  Notebook,
  PartyPopper,
  Send,
  ThumbsUp,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import { createLog, deleteLog } from "@/lib/actions/spec-log";
import {
  addLogComment,
  getCommentsByLog,
  type LogCommentWithAuthor,
} from "@/lib/actions/spec-log-comments";
import { toggleLogReaction } from "@/lib/actions/spec-log-reactions";
import {
  SPEC_LOG_ENGAGE_ROLES,
  SPEC_LOG_WRITER_ROLES,
  normalizeRole,
} from "@/lib/auth-shared";
import { uploadSpecLogImage } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";

type ReactionSummary = {
  emoji: string;
  count: number;
  userIds: string[];
};

type LogEntry = {
  id: string;
  event_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { id: string; name: string };
  imageUrls: string[];
  commentCount: number;
  reactionSummary: ReactionSummary[];
};

type EventProp = {
  id: string;
  title: string;
  description: string | null;
  batch: string;
  status: string;
  start_date: string;
  end_date: string;
};

type CurrentUserProp = {
  id: string;
  name: string;
  role: string;
} | null;

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: { label: "진행 중", bg: "bg-[#E6F9E6]", text: "text-[#2f9e44]" },
  upcoming: { label: "예정", bg: "bg-[#E8F0FE]", text: "text-[#2563EB]" },
  closed: { label: "종료", bg: "bg-[#f0efe6]", text: "text-[#6b6b5e]" },
};

const REACTION_ICONS: Record<
  string,
  { icon: typeof ThumbsUp; label: string }
> = {
  "\u{1F44D}": { icon: ThumbsUp, label: "좋아요" },
  "\u{1F525}": { icon: Flame, label: "불꽃" },
  "\u{2764}\u{FE0F}": { icon: Heart, label: "하트" },
  "\u{1F389}": { icon: PartyPopper, label: "축하" },
  "\u{1F914}": { icon: CircleHelp, label: "궁금" },
  "\u{1F440}": { icon: Eye, label: "관심" },
};

const REACTION_KEYS = [
  "\u{1F44D}",
  "\u{1F525}",
  "\u{2764}\u{FE0F}",
  "\u{1F389}",
  "\u{1F914}",
  "\u{1F440}",
] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${m}`;
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function groupLogsByDate(logs: LogEntry[]): Map<string, LogEntry[]> {
  const groups = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const dateKey = log.created_at.split("T")[0];
    const existing = groups.get(dateKey) ?? [];
    existing.push(log);
    groups.set(dateKey, existing);
  }
  return groups;
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
        {images.map((img, i) => (
          <button
            key={`${img}-${i}`}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`이미지 ${i + 1} 크게 보기`}
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
      {images.map((img, i) => (
        <button
          key={`${img}-${i}`}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={`이미지 ${i + 1} 크게 보기`}
          className={`block overflow-hidden rounded-lg border border-[#ece8db] ${i === 0 && images.length === 3 ? "col-span-2" : ""}`}
        >
          <img
            src={img}
            alt=""
            className={`w-full object-contain ${i === 0 && images.length === 3 ? "max-h-[280px]" : "max-h-[200px]"}`}
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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
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

function ReactionBar({
  logId,
  reactionSummary,
  currentUserId,
  currentUserRole,
}: {
  logId: string;
  reactionSummary: ReactionSummary[];
  currentUserId: string | null;
  currentUserRole: string | null;
}) {
  const router = useRouter();
  const summaryMap = new Map(reactionSummary.map((r) => [r.emoji, r]));
  const canEngage =
    currentUserRole !== null &&
    SPEC_LOG_ENGAGE_ROLES.includes(normalizeRole(currentUserRole));

  const handleToggle = (emoji: string) => {
    if (!currentUserId || !canEngage) return;
    startTransition(async () => {
      await toggleLogReaction(logId, emoji);
      router.refresh();
    });
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {REACTION_KEYS.map((key) => {
        const summary = summaryMap.get(key);
        const count = summary?.count ?? 0;
        const isActive = currentUserId
          ? (summary?.userIds.includes(currentUserId) ?? false)
          : false;
        const config = REACTION_ICONS[key];
        const Icon = config.icon;
        const isEmpty = count === 0 && !isActive;

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleToggle(key)}
            disabled={!currentUserId || !canEngage}
            title={config.label}
            aria-pressed={isActive}
            aria-label={`${config.label} ${count}`}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-['Pretendard',sans-serif] text-xs transition-colors ${
              isActive
                ? "border-[#FF6C0F] bg-[#FFF0E5] text-[#FF6C0F]"
                : "border-[#ddd9cc] bg-[#f5f5ee] text-[#6b6b5e]"
            } ${isEmpty ? "opacity-50" : ""} ${!currentUserId ? "cursor-default" : ""}`}
          >
            <Icon
              className="h-3.5 w-3.5"
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="min-w-[1ch] font-semibold">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function CommentThread({
  logId,
  commentCount,
  currentUserId,
  currentUserRole,
}: {
  logId: string;
  commentCount: number;
  currentUserId: string | null;
  currentUserRole: string | null;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<LogCommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayCount, setDisplayCount] = useState(commentCount);
  const canEngage =
    currentUserRole !== null &&
    SPEC_LOG_ENGAGE_ROLES.includes(normalizeRole(currentUserRole));

  const handleToggle = async () => {
    if (!isExpanded && comments.length === 0) {
      setIsLoading(true);
      const result = await getCommentsByLog(logId);
      setComments(result);
      setIsLoading(false);
    }
    setIsExpanded(!isExpanded);
  };

  const handleSubmit = () => {
    if (!commentText.trim() || !currentUserId || !canEngage || isSubmitting) return;
    setIsSubmitting(true);
    startTransition(async () => {
      const result = await addLogComment(logId, commentText.trim());
      if (result.success) {
        setCommentText("");
        const refreshed = await getCommentsByLog(logId);
        setComments(refreshed);
        setDisplayCount(refreshed.length);
        router.refresh();
      }
      setIsSubmitting(false);
    });
  };

  if (displayCount === 0 && !currentUserId) return null;

  return (
    <div className="mt-3 border-t border-[#ece8db] pt-3">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-xs font-medium text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
      >
        <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
        {displayCount > 0
          ? `댓글 ${displayCount}개${isExpanded ? " 접기" : " 보기"}`
          : "댓글"}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3 border-l-2 border-[#ece8db] pl-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6b6b5e]" />
              <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                불러오는 중...
              </span>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id}>
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
            ))
          )}

          {currentUserId && canEngage && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="댓글을 남겨보세요..."
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!commentText.trim() || isSubmitting}
                aria-label="댓글 등록"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#16140f] text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LogCard({
  log,
  currentUser,
  onImageOpen,
  onToast,
}: {
  log: LogEntry;
  currentUser: CurrentUserProp;
  onImageOpen: (images: string[], index: number) => void;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [log.content]);

  const canDelete =
    currentUser &&
    (log.author_id === currentUser.id ||
      normalizeRole(currentUser.role) === "preneur");

  const handleDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteLog(log.id);
      if (result.success) {
        router.refresh();
      }
      setIsDeleting(false);
    });
  };

  return (
    <article className="rounded-lg border border-[#ddd9cc] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
            {getInitial(log.author.name)}
          </div>
          <div>
            <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              {log.author.name}
            </span>
            <span className="ml-2 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              {formatTime(log.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const shareUrl = `${window.location.origin}/spec-log/${log.event_id}/${log.id}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: "SPEC 로그", url: shareUrl });
                  return;
                } catch {}
              }
              try {
                await navigator.clipboard.writeText(shareUrl);
                onToast("링크가 복사되었습니다");
              } catch {}
            }}
            aria-label="로그 공유"
            className="text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="로그 삭제"
              className="text-[#b42318] transition-colors hover:text-[#b42318]/70 disabled:opacity-40"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p
          ref={contentRef}
          className={`whitespace-pre-wrap font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#4a4a40] ${!isContentExpanded ? "line-clamp-6" : ""}`}
        >
          {log.content}
        </p>
        {isClamped && !isContentExpanded && (
          <button
            type="button"
            onClick={() => setIsContentExpanded(true)}
            className="mt-1 inline-flex items-center gap-0.5 font-['Pretendard',sans-serif] text-xs font-medium text-[#FF6C0F] transition-colors hover:text-[#FF6C0F]/80"
          >
            더 보기
            <ChevronDown className="h-3 w-3" strokeWidth={2} />
          </button>
        )}
      </div>

      <ImageGallery
        images={log.imageUrls}
        onOpen={(i) => onImageOpen(log.imageUrls, i)}
      />

      <ReactionBar
        logId={log.id}
        reactionSummary={log.reactionSummary}
        currentUserId={currentUser?.id ?? null}
        currentUserRole={currentUser?.role ?? null}
      />

      <CommentThread
        logId={log.id}
        commentCount={log.commentCount}
        currentUserId={currentUser?.id ?? null}
        currentUserRole={currentUser?.role ?? null}
      />
    </article>
  );
}

function LogComposer({
  eventId,
  currentUser,
}: {
  eventId: string;
  currentUser: CurrentUserProp;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const canWrite = SPEC_LOG_WRITER_ROLES.includes(normalizeRole(currentUser.role));
  if (!canWrite) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setImageFiles((prev) => [...prev, ...files]);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    startTransition(async () => {
      try {
        let imageUrls: string[] = [];
        if (imageFiles.length > 0) {
          setUploadProgress("이미지 업로드 중...");
          imageUrls = await Promise.all(
            imageFiles.map((file) => uploadSpecLogImage(file)),
          );
        }
        setUploadProgress("기록 저장 중...");
        const result = await createLog(eventId, content.trim(), imageUrls);
        if (result.success) {
          setContent("");
          setImageFiles([]);
          setImagePreviews([]);
          router.refresh();
        }
      } finally {
        setIsSubmitting(false);
        setUploadProgress(null);
      }
    });
  };

  return (
    <div className="mb-8 rounded-lg border border-[#ddd9cc] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FF6C0F]/10 font-['Pretendard',sans-serif] text-sm font-semibold text-[#FF6C0F]">
          {getInitial(currentUser.name)}
        </div>
        <div className="min-w-0 flex-1">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="무엇을 기록할까요?"
            disabled={isSubmitting}
            className="w-full resize-none rounded-lg border border-[#ddd9cc] bg-[#f5f5ee] px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6C0F]/10 disabled:opacity-50"
          />

          {imagePreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePreviews.map((preview, i) => (
                <div key={`preview-${i}`} className="group relative">
                  <img
                    src={preview}
                    alt=""
                    className="h-16 w-16 rounded-lg border border-[#ece8db] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="이미지 제거"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#16140f] text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadProgress && (
            <div className="mt-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF6C0F]" />
              <span className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                {uploadProgress}
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#6b6b5e] transition-colors hover:bg-[#f0efe6] disabled:opacity-40"
            >
              <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
              이미지 추가
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="h-8 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-colors hover:bg-[#16140f]/90 disabled:opacity-40"
            >
              기록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventFeedClient({
  event,
  initialLogs,
  currentUser,
}: {
  event: EventProp;
  initialLogs: LogEntry[];
  currentUser: CurrentUserProp;
}) {
  const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.closed;
  const logGroups = groupLogsByDate(initialLogs);
  const { toast, ToastComponent } = useToast();

  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const openLightbox = (images: string[], index: number) =>
    setLightbox({ images, index });

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const prevImage = useCallback(
    () =>
      setLightbox((prev) =>
        prev
          ? {
              ...prev,
              index:
                (prev.index - 1 + prev.images.length) % prev.images.length,
            }
          : null,
      ),
    [],
  );

  const nextImage = useCallback(
    () =>
      setLightbox((prev) =>
        prev
          ? { ...prev, index: (prev.index + 1) % prev.images.length }
          : null,
      ),
    [],
  );

  return (
    <>
      <div className="mx-auto max-w-[960px] px-6 py-10 sm:py-16">
        <Link
          href="/spec-log"
          className="mb-6 inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-sm font-medium text-[#6b6b5e] transition-colors hover:text-[#FF6C0F]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          SPEC 로그
        </Link>

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2.5">
            <h1 className="font-[system-ui] text-[clamp(1.5rem,3vw,2rem)] font-black text-[#16140f]">
              {event.title}
            </h1>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
          {event.description && (
            <p className="mb-2 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">
              {event.description}
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
            {formatDate(event.start_date)} ~ {formatDate(event.end_date)}
          </span>
        </div>

        <LogComposer eventId={event.id} currentUser={currentUser} />

        {initialLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Notebook
              className="h-8 w-8 text-[#6b6b5e]"
              strokeWidth={1.5}
            />
            <p className="mt-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              아직 기록이 없습니다
            </p>
            <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              첫 번째 기록을 남겨보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(logGroups.entries()).map(([dateKey, logs]) => (
              <div key={dateKey}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#ece8db]" />
                  <span className="shrink-0 font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">
                    {formatDateHeader(logs[0].created_at)}
                  </span>
                  <div className="h-px flex-1 bg-[#ece8db]" />
                </div>

                <div className="space-y-3">
                  {logs.map((log) => (
                    <LogCard
                      key={log.id}
                      log={log}
                      currentUser={currentUser}
                      onImageOpen={openLightbox}
                      onToast={toast}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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

      <ToastComponent />
    </>
  );
}
