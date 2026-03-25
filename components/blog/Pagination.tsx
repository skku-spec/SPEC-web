"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Calculate visible page numbers (max 5 page numbers shown)
  const getVisiblePages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      // Show all pages if <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Case 1: First 5 pages or earlier
      if (currentPage <= 5) {
        pages.push(1, 2, 3, 4, 5);
        pages.push("...");
        pages.push(totalPages);
      }
      // Case 2: Last 5 pages or later
      else if (currentPage > totalPages - 5) {
        pages.push(1);
        pages.push("...");
        pages.push(
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      }
      // Case 3: Middle pages
      else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        className="hidden md:grid h-8 w-8 rounded-md border border-[#ddd9cc] place-items-center text-[#16140f] hover:bg-[#e8e6dc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      </button>

      <div className="hidden md:flex items-center gap-1.5">
        {visiblePages.map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] px-1"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              className={`h-8 w-8 rounded-md grid place-items-center transition-colors font-['Pretendard',sans-serif] text-xs ${
                currentPage === page
                  ? "bg-[#16140f] font-semibold text-white"
                  : "border border-[#ddd9cc] font-medium text-[#16140f] hover:bg-[#e8e6dc]"
              }`}
              onClick={() => onPageChange(page as number)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        className="hidden md:grid h-8 w-8 rounded-md border border-[#ddd9cc] place-items-center text-[#16140f] hover:bg-[#e8e6dc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </button>

      <div className="md:hidden flex items-center gap-1.5">
        <button
          className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#e8e6dc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          이전
        </button>
        <button
          className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:bg-[#e8e6dc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          다음
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
