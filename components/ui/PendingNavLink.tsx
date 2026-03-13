"use client";

import { useState } from "react";
import Link from "next/link";

export default function PendingNavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => setIsPending(true)}
      className={`${className} ${isPending ? "pointer-events-none opacity-70" : ""}`}
      aria-busy={isPending || undefined}
    >
      {children}
    </Link>
  );
}
