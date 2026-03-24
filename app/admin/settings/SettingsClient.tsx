"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { Save } from "lucide-react";

import { updateSettings } from "@/lib/actions/site-settings";
import type { SiteSetting } from "@/lib/actions/site-settings";

const CATEGORY_LABELS: Record<string, string> = {
  contact: "연락처",
  social: "소셜 미디어",
  general: "일반",
};

const CATEGORY_ORDER = ["contact", "social", "general"];

function inputTypeFor(valueType: string): string {
  switch (valueType) {
    case "email":
      return "email";
    case "url":
      return "url";
    default:
      return "text";
  }
}

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: SiteSetting[];
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of initialSettings) map[s.key] = s.value;
    return map;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, SiteSetting[]>();
    for (const s of initialSettings) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    const sorted = new Map<string, SiteSetting[]>();
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) sorted.set(cat, map.get(cat)!);
    }
    for (const [cat, list] of map) {
      if (!sorted.has(cat)) sorted.set(cat, list);
    }
    return sorted;
  }, [initialSettings]);

  const changedKeys = useMemo(() => {
    const keys: string[] = [];
    for (const s of initialSettings) {
      if (values[s.key] !== s.value) keys.push(s.key);
    }
    return keys;
  }, [initialSettings, values]);

  const hasChanges = changedKeys.length > 0;

  const handleChange = useCallback(
    (key: string, value: string, valueType: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));

      if (valueType === "email" && value) {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        setErrors((prev) => {
          if (!valid) return { ...prev, [key]: "올바른 이메일 형식이 아닙니다." };
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else if (valueType === "url" && value) {
        try {
          new URL(value);
          setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        } catch {
          setErrors((prev) => ({ ...prev, [key]: "올바른 URL 형식이 아닙니다." }));
        }
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [],
  );

  const showToast = useCallback((message: string, type: "success" | "error") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = useCallback(() => {
    if (!hasChanges) return;

    const hasValidationErrors = changedKeys.some((k) => errors[k]);
    if (hasValidationErrors) {
      showToast("입력값을 확인해주세요.", "error");
      return;
    }

    const updates = changedKeys.map((key) => ({ key, value: values[key] }));

    startTransition(async () => {
      const result = await updateSettings(updates);
      if (result.success) {
        showToast("설정이 저장되었습니다.", "success");
      } else {
        showToast(result.error ?? "저장 중 오류가 발생했습니다.", "error");
      }
    });
  }, [hasChanges, changedKeys, errors, values, showToast]);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "border border-[#2f9e44]/20 bg-[#E6F9E6] text-[#2f9e44]"
              : "border border-[#b42318]/20 bg-[#FEE2E2] text-[#b42318]"
          }`}
        >
          {toast.message}
        </div>
      )}

      {Array.from(grouped).map(([category, settings]) => (
        <div
          key={category}
          className="rounded-lg border border-[#ddd9cc] bg-white p-6"
        >
          <h2 className="mb-5 font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
            {CATEGORY_LABELS[category] ?? category}
          </h2>

          <div className="space-y-5">
            {settings.map((setting) => {
              const error = errors[setting.key];
              const isChanged = values[setting.key] !== setting.value;

              return (
                <div key={setting.key}>
                  <label
                    htmlFor={`setting-${setting.key}`}
                    className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]"
                  >
                    {setting.label}
                  </label>

                  {setting.description && (
                    <p className="mb-1.5 font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
                      {setting.description}
                    </p>
                  )}

                  <input
                    id={`setting-${setting.key}`}
                    type={inputTypeFor(setting.value_type)}
                    value={values[setting.key] ?? ""}
                    onChange={(e) =>
                      handleChange(setting.key, e.target.value, setting.value_type)
                    }
                    className={`w-full rounded-lg border bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm text-[#16140f] placeholder:text-[#16140f]/40 transition-colors focus:outline-none focus:ring-2 ${
                      error
                        ? "border-[#b42318] focus:border-[#b42318]/50 focus:ring-[#b42318]/10"
                        : isChanged
                          ? "border-[#FF6C0F]/50 focus:border-[#FF6C0F]/50 focus:ring-[#FF6C0F]/10"
                          : "border-[#ddd9cc] focus:border-[#FF6C0F]/50 focus:ring-[#FF6C0F]/10"
                    }`}
                  />

                  {error && (
                    <p className="mt-1 font-['Pretendard',sans-serif] text-xs text-[#b42318]">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {initialSettings.length === 0 && (
        <div className="rounded-lg border border-[#ddd9cc] bg-white py-12 text-center">
          <p className="font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
            등록된 설정이 없습니다.
          </p>
        </div>
      )}

      {initialSettings.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className="flex h-8 items-center gap-1.5 rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white transition-opacity disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2} />
            {isPending ? "저장 중…" : "저장"}
          </button>
        </div>
      )}
    </div>
  );
}
