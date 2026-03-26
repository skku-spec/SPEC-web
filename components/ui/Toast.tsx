"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function Toast({
  message,
  isVisible,
}: {
  message: string;
  isVisible: boolean;
}) {
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#16140f] px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-white transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {message}
    </div>
  );
}

export function useToast(duration = 2000) {
  const [state, setState] = useState<{
    message: string;
    isVisible: boolean;
  }>({ message: "", isVisible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback(
    (message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState({ message, isVisible: true });
      timerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isVisible: false }));
        timerRef.current = null;
      }, duration);
    },
    [duration],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const ToastComponent = useCallback(
    () => <Toast message={state.message} isVisible={state.isVisible} />,
    [state.message, state.isVisible],
  );

  return { toast, ToastComponent };
}
