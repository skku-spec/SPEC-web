import type { ReactNode } from "react";

export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5ee] text-[#16140f] [font-family:Pretendard,system-ui,sans-serif]">
      <header className="border-b border-[#ddd9cc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-['Pretendard',sans-serif] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b6b5e]">
              SPEC
            </p>
            <h1 className="font-[system-ui] text-lg font-black text-[#16140f]">Design System</h1>
          </div>
          <a
            href="/admin"
            className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f] transition-colors hover:bg-[#fcfcf8]"
          >
            관리자 센터로 돌아가기
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
