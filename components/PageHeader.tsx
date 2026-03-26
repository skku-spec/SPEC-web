interface PageHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  align = "center",
  dark = false,
  className = "",
  children,
}: PageHeaderProps) {
  const textColor = dark ? "text-white" : "text-[#16140f]";
  const subtitleColor = dark ? "text-white/60" : "text-[#6b6b5e]";

  return (
    <div
      className={`mb-10 md:mb-14 ${align === "center" ? "text-center" : ""} ${className}`}
    >
      <h1
        className={`text-[clamp(2rem,4vw,2.75rem)] font-black ${textColor}`}
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className={`mt-3 font-['Pretendard',sans-serif] text-sm font-normal leading-[1.7] ${subtitleColor} ${align === "left" ? "max-w-[640px]" : ""}`}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
