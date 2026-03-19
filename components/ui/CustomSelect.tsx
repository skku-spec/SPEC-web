"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Option = string | { value: string; label: string };

interface CustomSelectProps {
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

function val(opt: Option) {
  return typeof opt === "string" ? opt : opt.value;
}

function label(opt: Option) {
  return typeof opt === "string" ? opt : opt.label;
}

export default function CustomSelect({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder,
  name,
  disabled,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? "");
  const ref = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const current = isControlled ? controlledValue : internal;

  const selectedLabel = (() => {
    for (const opt of options) {
      if (val(opt) === current) return label(opt);
    }
    return null;
  })();

  const handleSelect = useCallback(
    (v: string) => {
      if (!isControlled) setInternal(v);
      onChange?.(v);
      setOpen(false);
    },
    [isControlled, onChange],
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    },
    [],
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left font-['Pretendard',sans-serif] text-sm outline-none transition-all ${
          disabled
            ? "cursor-not-allowed border-[#ddd9cc] opacity-60"
            : open
              ? "border-[#FF6C0F]/50 ring-2 ring-[#FF6C0F]/10"
              : "border-[#c6c6c6] hover:border-[#aaa]"
        }`}
      >
        <span className={selectedLabel ? "text-[#16140f]" : "text-[#16140f]/40"}>
          {selectedLabel ?? placeholder ?? "선택"}
        </span>

        <svg
          className={`h-4 w-4 shrink-0 text-[#16140f]/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#ddd9cc] bg-white py-1 shadow-lg">
          {placeholder && (
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`flex w-full items-center px-3 py-2 text-left font-['Pretendard',sans-serif] text-sm transition-colors hover:bg-[#f5f5ee] ${
                current === "" ? "font-medium text-[#FF6C0F]" : "text-[#16140f]/50"
              }`}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => {
            const v = val(opt);
            const l = label(opt);
            const isSelected = v === current;
            return (
              <button
                type="button"
                key={v}
                onClick={() => handleSelect(v)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left font-['Pretendard',sans-serif] text-sm transition-colors hover:bg-[#f5f5ee] ${
                  isSelected ? "font-medium text-[#FF6C0F]" : "text-[#16140f]"
                }`}
              >
                {l}
                {isSelected && (
                  <svg className="h-4 w-4 text-[#FF6C0F]" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
