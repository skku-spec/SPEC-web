"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="h-8 rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] hover:border-[#FF6C0F] hover:text-[#FF6C0F] transition-colors flex items-center gap-1.5"
    >
      <Link2 className="h-3.5 w-3.5" />
      {copied ? "복사됨!" : "링크 복사"}
    </button>
  );
}
