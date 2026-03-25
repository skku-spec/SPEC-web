"use client";

import { useState } from "react";
import { deleteApplication } from "@/lib/actions/applications";
import { useRouter } from "next/navigation";

type DeleteApplicationButtonProps = {
  id: string;
  applicantName: string;
};

export default function DeleteApplicationButton({ id, applicantName }: DeleteApplicationButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`${applicantName}님의 지원서를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteApplication(id);
      if (result.error) {
        alert(result.error);
      } else {
        if (typeof window !== "undefined" && window.location.pathname.includes("/admin/applications/")) {
          router.push("/admin/applications");
        }
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#f5c6c6] bg-white px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#c53030] hover:bg-[#fff5f5] disabled:opacity-50 transition-colors"
    >
      {isDeleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
