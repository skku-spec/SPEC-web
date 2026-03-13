"use client";

import { useState } from "react";
import Link from "next/link";

type ApplyButtonSize = "sm" | "md" | "lg" | "xl";

type ApplyButtonProps = {
  href?: string;
  children?: React.ReactNode;
  size?: ApplyButtonSize;
  className?: string;
  fullWidth?: boolean;
  onClick?: () => void;
};

const sizeMap: Record<ApplyButtonSize, string> = {
  sm: "px-5 py-2 text-sm",
  md: "h-12 px-6 text-base md:h-14 md:px-8 md:text-lg",
  lg: "h-14 px-8 text-lg",
  xl: "px-14 py-5 text-xl",
};

export default function ApplyButton({
  href = "/apply",
  children = "Apply Now",
  size = "lg",
  className = "",
  fullWidth = false,
  onClick,
}: ApplyButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const classes = [
    "inline-flex items-center justify-center rounded-full bg-[#FF6C0F]",
    "font-['Source_Serif_4',serif] font-semibold italic text-white",
    "transition-all hover:brightness-[1.08] active:scale-[0.98]",
    sizeMap[size],
    fullWidth && "w-full",
    isPending && "pointer-events-none opacity-85",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    setIsPending(true);
    onClick?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={classes}
      aria-busy={isPending || undefined}
    >
      {children}
    </Link>
  );
}
