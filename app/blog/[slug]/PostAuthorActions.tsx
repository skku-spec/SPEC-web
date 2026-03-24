"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useUser } from "@/hooks/useUser";
import { deletePost, togglePublished } from "@/lib/actions/posts";

type PostAuthorActionsProps = {
  slug: string;
  authorId?: string;
  postId: string;
  published?: boolean;
};

export default function PostAuthorActions({
  slug,
  authorId,
  postId,
  published,
}: PostAuthorActionsProps) {
  const { profile, role, isAuthenticated } = useUser();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const canEdit =
    isAuthenticated && (role === "admin" || (Boolean(authorId) && profile?.id === authorId));

  if (!canEdit) {
    return null;
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deletePost(postId);
      if (result.success) {
        router.push("/blog");
      } else {
        alert(`삭제 실패: ${result.error || "알 수 없는 오류가 발생했습니다."}`);
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublished = async () => {
    setIsToggling(true);
    try {
      const result = await togglePublished(postId);
      if (result.success) {
      } else {
        alert(`발행 상태 변경 실패: ${result.error || "알 수 없는 오류가 발생했습니다."}`);
      }
    } catch {
      alert("발행 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div data-can-edit={canEdit} className="mt-6 flex gap-2">
      <Link
        href={`/blog/edit/${slug}`}
        className="inline-flex items-center rounded-[6px] border border-[#ddd9cc] px-3 py-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f] transition-colors hover:border-[#FF6C0F] hover:text-[#FF6C0F]"
      >
        수정하기
      </Link>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center rounded-[6px] border border-red-300 px-3 py-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-red-600 transition-colors hover:border-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? "삭제 중..." : "삭제하기"}
      </button>

      <button
        onClick={handleTogglePublished}
        disabled={isToggling}
        className="inline-flex items-center rounded-[6px] border border-[#ddd9cc] px-3 py-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f] transition-colors hover:border-[#FF6C0F] hover:text-[#FF6C0F] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isToggling ? "처리 중..." : published ? "발행 취소" : "발행하기"}
      </button>
    </div>
  );
}
