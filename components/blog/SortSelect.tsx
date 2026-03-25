"use client";

type SortSelectProps = {
  value: "newest" | "views";
  onChange: (value: "newest" | "views") => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        className={`font-['Pretendard',sans-serif] text-sm transition-colors ${
          value === "newest"
            ? "font-semibold text-[#16140f]"
            : "font-medium text-[#6b6b5e] hover:text-[#16140f] cursor-pointer"
        }`}
        onClick={() => onChange("newest")}
      >
        최신순
      </button>
      <span className="text-[#ddd9cc] text-sm">|</span>
      <button
        className={`font-['Pretendard',sans-serif] text-sm transition-colors ${
          value === "views"
            ? "font-semibold text-[#16140f]"
            : "font-medium text-[#6b6b5e] hover:text-[#16140f] cursor-pointer"
        }`}
        onClick={() => onChange("views")}
      >
        조회수 높은순
      </button>
    </div>
  );
}
