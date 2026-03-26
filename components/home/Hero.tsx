"use client";

import { useEffect, useState } from "react";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="hero"
      className="relative -ml-[calc(50vw-50%)] w-screen overflow-hidden"
    >
      <div className="relative flex h-[85vh] md:h-[90vh] flex-col items-center justify-center px-6">
       <div
           className="flex max-w-[1200px] flex-col items-center gap-8 mx-auto"
           style={{
             opacity: mounted ? 1 : 0,
             transform: mounted ? "translateY(0)" : "translateY(20px)",
             transition: "opacity 0.6s ease, transform 0.6s ease",
           }}
         >
          {/* Batch badge */}
          <div className="relative inline-flex rounded-full p-[1.5px]" style={{ background: 'linear-gradient(135deg, #f97316 0%, rgba(255,255,255,0.4) 50%, #f97316 100%)' }}>
            <span
              className="relative inline-flex items-center gap-2 rounded-full px-5 py-2 font-['Outfit',sans-serif] text-xs uppercase tracking-[0.12em] text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(10,10,10,0.95) 60%)',
                boxShadow: '0 0 24px rgba(249,115,22,0.4), 0 0 48px rgba(249,115,22,0.15), inset 0 0 20px rgba(249,115,22,0.08)'
              }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" style={{ boxShadow: '0 0 6px #f97316' }} />
              2026 Spring · 4기 모집중
            </span>
          </div>

            {/* Main headline */}
             <h1
               className="text-center font-black uppercase leading-[0.9] tracking-[-0.03em] text-white text-[36px] sm:text-[48px] md:text-[72px] lg:text-[96px]"
               style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
             >
                EXECUTION
                <br />
                IS <span className="text-[#FF6C0F]">EVERYTHING.</span>
             </h1>

              {/* Subtext */}
               <div className="text-center mt-6 flex flex-col gap-3">
                 <p className="font-['Pretendard',sans-serif] font-semibold text-white text-base md:text-lg">
                   SKKU Prep Entrepreneurs&apos; Club
                 </p>
                 <p className="font-['MaruBuri',serif] font-normal text-white/70 text-base md:text-lg">
                   Building founders who devour markets — Korea first, then the world
                 </p>
               </div>

             {/* CTA */}
              <div className="mt-8 md:mt-10 flex flex-col items-center gap-3">
              {/* <ApplyButton href="/apply" size="lg" className="mt-16">
            4기 지원하기
          </ApplyButton>
          <p className="mt-4 font-['Pretendard',sans-serif] text-sm text-white/40">
            마감: 2026년 3월 | 성균관대 재학생 대상
          </p> */}
             </div>
        </div>

         {/* Scroll-down arrow */}
         <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-30">
           <svg
             width="20"
             height="20"
             viewBox="0 0 20 20"
             fill="none"
             xmlns="http://www.w3.org/2000/svg"
             className="text-white"
           >
             <path
               d="M6 8L10 12L14 8"
               stroke="currentColor"
               strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
             />
           </svg>
         </div>
      </div>
    </section>
  );
}
