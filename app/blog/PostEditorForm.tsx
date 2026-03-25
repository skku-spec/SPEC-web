"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import BlockNoteEditor from "@/components/blog/BlockNoteEditor";
import { useUser } from "@/hooks/useUser";
import { createPost, updatePost } from "@/lib/actions/posts";
import type { BlogPost, TagInfo } from "@/lib/api";
import type { UserRole } from "@/lib/auth";
import { uploadBlogImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

/* ─── Constants & Types ─────────────────────────────────────────── */

const WRITER_ROLES: UserRole[] = ["runner", "preneur", "admin"];

type PostEditorFormProps = {
  mode: "create" | "edit";
  post?: BlogPost;
  initialTags?: TagInfo[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

/* ─── Utility Functions ─────────────────────────────────────────── */

function estimateReadingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

/* ─── SVG Icons (inline, zero-dep) ──────────────────────────────── */

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 12L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      className="mb-2 text-[#b5b2a6]"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M21 15L16.5 10L9 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 18L11 14.5L3 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M12 4L4 12M4 4L12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PostEditorForm — EO Planet-style two-column article editor
   ═══════════════════════════════════════════════════════════════════ */

export default function PostEditorForm({ mode, post, initialTags = [] }: PostEditorFormProps) {
  const router = useRouter();
  const { profile, role, isLoading, isAuthenticated } = useUser();

  /* ─── Core form state ───────────────────────────────────────── */
  const [title, setTitle] = useState(post?.title ?? "");
  const [type, setType] = useState<"blog" | "news">(post?.type ?? "blog");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [imageUrl, setImageUrl] = useState(post?.imageUrl ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(post?.tags ?? []);
  const [allTags, setAllTags] = useState<TagInfo[]>(initialTags);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ─── UI state ──────────────────────────────────────────────── */
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(mode === "edit" ? "saved" : "idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  /* ─── Refs ──────────────────────────────────────────────────── */
  const hasUnsavedChanges = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  /* ─── Derived ───────────────────────────────────────────────── */
  const isAdmin = role === "admin";
  const canWrite = isAuthenticated && WRITER_ROLES.includes(role);
  const canEditCurrentPost =
    mode === "edit" && post
      ? isAuthenticated && (isAdmin || (Boolean(post.authorId) && post.authorId === profile?.id))
      : false;

  const missingFields: string[] = [];
  if (!title.trim()) missingFields.push("제목");
  if (!excerpt.trim()) missingFields.push("요약");
  if (!content.trim()) missingFields.push("본문");

  const saveDisabled = isSubmitting || missingFields.length > 0;

  const sortedTags = useMemo(
    () => [...allTags].sort((a, b) => a.label.localeCompare(b.label, "ko")),
    [allTags],
  );

  /* ─── Auth redirect ─────────────────────────────────────────── */
  useEffect(() => {
    if (mode === "create" && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, mode, router]);

  /* ─── Fetch tags (create mode) ──────────────────────────────── */
  useEffect(() => {
    if (mode === "create" && initialTags.length > 0) {
      return;
    }

    if (mode === "create") {
      const supabase = createClient();
      void supabase
        .from("tags")
        .select("id, slug, label")
        .then(({ data }) => {
          if (!data) {
            return;
          }
          setAllTags(data);
        });
    }
  }, [initialTags, mode]);

  /* ─── beforeunload warning ──────────────────────────────────── */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  /* ─── Auto-save (edit mode) ─────────────────────────────────── */
  const performAutoSave = useCallback(async () => {
    if (mode !== "edit" || !post?.id) return;
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;

    setSaveStatus("saving");

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("type", type);
    formData.set("excerpt", excerpt.trim());
    formData.set("image_url", imageUrl.trim());
    formData.set("content", content);
    formData.set("published", String(post.published ?? false));
    selectedTags.forEach((tag) => formData.append("tags", tag));

    const result = await updatePost(post.id, formData);

    if (result.success) {
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      hasUnsavedChanges.current = false;
    } else {
      setSaveStatus("error");
    }
  }, [mode, post, title, type, excerpt, imageUrl, content, selectedTags]);

  /* Keep a ref so the debounce timer always calls the latest version */
  const performAutoSaveRef = useRef(performAutoSave);
  useEffect(() => { performAutoSaveRef.current = performAutoSave; });

  const triggerAutoSave = useCallback(() => {
    hasUnsavedChanges.current = true;

    if (mode !== "edit") return;

    setSaveStatus("idle");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void performAutoSaveRef.current();
    }, 2000);
  }, [mode]);

  /* Clean up auto-save timer on unmount */
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  /* ─── localStorage draft (create mode) ──────────────────────── */
  useEffect(() => {
    if (mode !== "create") return;
    if (!title && !content) return;

    hasUnsavedChanges.current = true;

    const draft = JSON.stringify({
      title,
      type,
      excerpt,
      imageUrl,
      content,
      selectedTags,
      savedAt: new Date().toISOString(),
    });

    try {
      localStorage.setItem("blog-draft-latest", draft);
    } catch {
      /* localStorage full or unavailable */
    }
  }, [mode, title, type, excerpt, imageUrl, content, selectedTags]);

  /* ─── Handlers ──────────────────────────────────────────────── */

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    triggerAutoSave();
  };


  const handleContentChange = (html: string) => {
    setContent(html);
    triggerAutoSave();
  };

  const handleExcerptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setExcerpt(event.target.value);
    triggerAutoSave();
  };

  const handleSelectTag = (tagSlug: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagSlug) ? prev.filter((t) => t !== tagSlug) : [...prev, tagSlug],
    );
    triggerAutoSave();
  };

  const handleCoverImageUpload = async (file: File) => {
    try {
      setErrorMessage(null);
      const uploadedUrl = await uploadBlogImage(file);
      setImageUrl(uploadedUrl);
      triggerAutoSave();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "이미지 업로드 중 문제가 발생했습니다.",
      );
    }
  };

  const handleCoverInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const target = event.target;
    await handleCoverImageUpload(file);
    target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await handleCoverImageUpload(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const removeCoverImage = () => {
    setImageUrl("");
    triggerAutoSave();
  };

  const submitForm = async (published: boolean) => {
    if (saveDisabled) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("type", type);
    formData.set("excerpt", excerpt.trim());
    formData.set("image_url", imageUrl.trim());
    formData.set("content", content);
    formData.set("published", String(published));
    selectedTags.forEach((tag) => formData.append("tags", tag));

    const result =
      mode === "create"
        ? await createPost(formData)
        : await updatePost(post?.id ?? "", formData);

    setIsSubmitting(false);

    if (!result.success || !result.slug) {
      setErrorMessage(result.error ?? "저장 중 문제가 발생했습니다.");
      return;
    }

    hasUnsavedChanges.current = false;

    if (mode === "create") {
      try {
        localStorage.removeItem("blog-draft-latest");
      } catch {
        /* ignore */
      }
    }

    router.push(`/blog/${result.slug}`);
  };

  /* ─── Save status display text ──────────────────────────────── */

  const saveStatusText = useMemo(() => {
    if (mode === "create") return "새 글";
    switch (saveStatus) {
      case "saving":
        return "저장 중...";
      case "saved":
        return lastSavedAt ? "저장됨 ✓ · 방금 전" : "저장됨 ✓";
      case "error":
        return "저장 실패";
      default:
        return "변경사항 있음";
    }
  }, [mode, saveStatus, lastSavedAt]);

  const saveStatusColor =
    saveStatus === "error"
      ? "text-[#d63a19]"
      : saveStatus === "saved"
        ? "text-[#3d8c40]"
        : "text-[#6b6b5e]";

  /* ═══ Early returns ═══════════════════════════════════════════ */

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5ee]">
        <p className="font-['Pretendard',sans-serif] text-[15px] text-[#6b6b5e]">
          사용자 정보를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  if ((mode === "create" && !canWrite) || (mode === "edit" && !canEditCurrentPost)) {
    return (
      <section className="min-h-screen bg-[#f5f5ee] px-6 py-12">
        <div className="mx-auto max-w-[800px] rounded-[10px] border border-[#ddd9cc] bg-white p-6">
          <h1 className="font-[system-ui] text-[28px] font-bold text-[#16140f]">
            권한이 없습니다
          </h1>
          <p className="mt-3 font-['Pretendard',sans-serif] text-[15px] text-[#6b6b5e]">
            {mode === "create"
              ? "글쓰기는 runner 이상 권한에서만 가능합니다."
              : "본인 글 작성자 또는 관리자만 수정할 수 있습니다."}
          </p>
          <Link
            href="/blog"
            className="mt-6 inline-flex rounded-[6px] bg-[#FF6C0F] px-4 py-2 font-['Pretendard',sans-serif] text-[14px] font-medium text-white"
          >
            블로그로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  /* ═══ Main Render ═════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#f5f5ee]">
      {/* ── Breadcrumb + Save Status ───────────────────────────── */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 pb-2 pt-6 md:px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[14px] text-[#6b6b5e] transition-colors hover:text-[#16140f]"
        >
          <ChevronLeftIcon />
          블로그
        </Link>

        <span
          className={`font-['Pretendard',sans-serif] text-[13px] ${saveStatusColor}`}
        >
          {saveStatusText}
        </span>
      </div>

      {/* ── Two-Column Body ─────────────────────────────────────── */}
      <div className="mx-auto flex max-w-[1200px] gap-8 px-4 pb-8 pt-4 md:px-6">
        {/* ── Left Column: Editor & Settings (~70%) ───────────── */}
        <div className="min-w-0 flex-1">
          {/* Title + Editor Card */}
          <div className="rounded-[12px] border border-[#ddd9cc] bg-[#fcfcf8] p-6 md:p-8">
            <input
              value={title}
              onChange={handleTitleChange}
              maxLength={60}
              placeholder="제목을 입력해주세요 (최대 60자)"
              className="mb-4 w-full bg-transparent font-[system-ui] text-[clamp(1.75rem,3.5vw,2.5rem)] font-black leading-tight text-[#16140f] placeholder:text-[#c5c2b8] focus:outline-none"
            />

            <div className="mb-4 h-px bg-[#ddd9cc]" />

            {/* Editor guide hint */}
            <p className="mb-4 font-['Pretendard',sans-serif] text-[12px] text-[#b5b2a6]">
              <kbd className="rounded border border-[#ddd9cc] bg-[#f5f5ee] px-1.5 py-0.5 font-mono text-[11px]">/</kbd> 를 입력하면 제목, 리스트, 이미지 등을 삽입할 수 있어요. 텍스트를 드래그하면 서식 도구가 나타납니다.
            </p>

            <div className="min-h-[400px]">
              <BlockNoteEditor
                initialHTML={content}
                onChange={handleContentChange}
                onWordCountChange={setWordCount}
                uploadFile={uploadBlogImage}
                placeholder="본문을 작성하세요..."
              />
            </div>
          </div>

          {/* ── Publish Settings Card ─────────────────────────── */}
          <div className="mt-6 space-y-6 rounded-[12px] border border-[#ddd9cc] bg-white p-6 md:p-8">
            <h3 className="font-['Pretendard',sans-serif] text-[16px] font-bold text-[#16140f]">
              발행 설정
            </h3>

            {/* 요약 (Excerpt) */}
            <label className="block">
              <span className="mb-1.5 block font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f]">
                요약
              </span>
              <textarea
                value={excerpt}
                onChange={handleExcerptChange}
                rows={3}
                placeholder="포스트 요약을 입력하세요"
                className="w-full rounded-[8px] border border-[#ddd9cc] px-3 py-2.5 font-['Pretendard',sans-serif] text-[14px] text-[#16140f] transition-colors focus:border-[#FF6C0F] focus:outline-none"
              />
            </label>


            {/* 포스트 유형 */}
            <fieldset>
              <legend className="mb-1.5 block font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f]">
                포스트 유형
              </legend>
              <div className="flex gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 font-['Pretendard',sans-serif] text-[14px] text-[#16140f]">
                  <input
                    type="radio"
                    checked={type === "blog"}
                    onChange={() => {
                      setType("blog");
                      triggerAutoSave();
                    }}
                    className="accent-[#FF6C0F]"
                  />
                  SPEC 블로그
                </label>
                {isAdmin && (
                  <label className="inline-flex cursor-pointer items-center gap-2 font-['Pretendard',sans-serif] text-[14px] text-[#16140f]">
                    <input
                      type="radio"
                      checked={type === "news"}
                      onChange={() => {
                        setType("news");
                        triggerAutoSave();
                      }}
                      className="accent-[#FF6C0F]"
                    />
                    SPEC 소식
                  </label>
                )}
              </div>
            </fieldset>

            {/* 카테고리 (Tags) */}
            <fieldset>
              <legend className="mb-1.5 block font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f]">
                카테고리
              </legend>
              <p className="mb-2 font-['Pretendard',sans-serif] text-[12px] text-[#6b6b5e]">
                최소 1개를 선택해주세요
              </p>
              <div className="flex flex-wrap gap-2">
                {sortedTags.map((tag) => {
                  const selected = selectedTags.includes(tag.slug);
                  return (
                    <label
                      key={tag.slug}
                      className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1 font-['Pretendard',sans-serif] text-[13px] transition-colors ${
                        selected
                          ? "border-[#FF6C0F] bg-[#FF6C0F] text-white"
                          : "border-[#ddd9cc] bg-white text-[#4a4a40] hover:border-[#FF6C0F]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleSelectTag(tag.slug)}
                        className="hidden"
                      />
                      {tag.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* 썸네일 (Cover Image) */}
            <div>
              <span className="mb-1.5 block font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f]">
                썸네일
              </span>

              {imageUrl ? (
                <div className="group relative max-w-[320px] overflow-hidden rounded-[8px]">
                  <img
                    src={imageUrl}
                    alt="썸네일 이미지"
                    className="aspect-[16/9] w-full rounded-[8px] object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-[8px] bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="rounded-[6px] bg-white/90 px-3 py-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f] backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="inline-flex items-center gap-1 rounded-[6px] bg-white/90 px-3 py-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#d63a19] backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      <CloseIcon />
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => coverInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") coverInputRef.current?.click();
                  }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex max-w-[320px] cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed px-6 py-8 transition-colors ${
                    isDraggingOver
                      ? "border-[#FF6C0F] bg-[#FF6C0F]/5"
                      : "border-[#ddd9cc] hover:border-[#FF6C0F]/50 hover:bg-[#f5f5ee]/50"
                  }`}
                >
                  <ImagePlaceholderIcon />
                  <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#6b6b5e]">
                    썸네일 이미지 (선택)
                  </span>
                  <span className="mt-1 font-['Pretendard',sans-serif] text-[12px] text-[#b5b2a6]">
                    16:9 비율로 자동 크롭 후 적용됩니다
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hidden file input for cover image */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverInputChange}
          />

          {/* Error message */}
          {errorMessage && (
            <div className="mt-4 rounded-[8px] border border-[#d63a19]/20 bg-[#d63a19]/5 px-4 py-3">
              <p className="font-['Pretendard',sans-serif] text-[13px] text-[#d63a19]">
                {errorMessage}
              </p>
            </div>
          )}

          {/* ── Action Buttons Row ────────────────────────────── */}
          <div className="mt-6 flex flex-col items-start gap-3">
            {saveDisabled && !isSubmitting && missingFields.length > 0 && (
              <p className="font-['Pretendard',sans-serif] text-[13px] text-[#d63a19]">
                {missingFields.join(", ")}을(를) 입력해주세요
              </p>
            )}

            <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
              <span className="font-['Pretendard',sans-serif] text-[13px] text-[#6b6b5e]">
                {wordCount.toLocaleString()} 단어 · ~{estimateReadingTime(wordCount)}분 읽기
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void submitForm(false)}
                  disabled={saveDisabled}
                  className="inline-flex h-[42px] items-center justify-center rounded-[8px] border border-[#ddd9cc] bg-white px-5 font-['Pretendard',sans-serif] text-[14px] font-medium text-[#6b6b5e] transition-colors hover:border-[#16140f] hover:text-[#16140f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  임시저장
                </button>
                <button
                  type="button"
                  onClick={() => void submitForm(true)}
                  disabled={saveDisabled}
                  className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-[#FF6C0F] px-6 font-['Pretendard',sans-serif] text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  발행하기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Writing Tips Sidebar (~30%) ────────── */}
        <aside className="hidden lg:block lg:w-[320px] lg:shrink-0">
          <div className="sticky top-[100px] rounded-[12px] border border-[#ddd9cc] bg-white p-6">
            <h3 className="mb-5 font-['Pretendard',sans-serif] text-[15px] font-bold text-[#16140f]">
              글쓰기 가이드
            </h3>

            <div className="mb-5">
              <p className="mb-2 font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#3d8c40]">
                이렇게 쓰면 좋아요
              </p>
              <ul className="space-y-1.5 pl-3">
                <li className="relative font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e] before:absolute before:-left-3 before:content-['·']">
                  구체적인 경험과 사례를 공유해주세요
                </li>
                <li className="relative font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e] before:absolute before:-left-3 before:content-['·']">
                  한 가지 주제에 집중하면 더 좋아요
                </li>
                <li className="relative font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e] before:absolute before:-left-3 before:content-['·']">
                  실패 경험도 가치 있는 콘텐츠입니다
                </li>
                <li className="relative font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e] before:absolute before:-left-3 before:content-['·']">
                  독자가 바로 실천할 수 있는 팁을 넣어주세요
                </li>
              </ul>
            </div>

            <div className="h-px bg-[#ddd9cc]" />

            <div className="mt-5">
              <p className="mb-2 font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#d63a19]">
                이런 글은 안돼요
              </p>
              <ul className="space-y-1.5 pl-3">
                <li className="relative font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e] before:absolute before:-left-3 before:content-['·']">
                  타인을 비방하거나 혐오하는 내용
                </li>
                <li className="relative font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e] before:absolute before:-left-3 before:content-['·']">
                  허위 정보나 과장된 내용
                </li>
                <li className="relative font-['Pretendard',sans-serif] text-[13px] leading-relaxed text-[#6b6b5e] before:absolute before:-left-3 before:content-['·']">
                  광고나 홍보 목적의 글
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
