"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import ApplyButton from "@/components/ui/ApplyButton";

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => {
            setVisible(true);
          });
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

   return (
     <section ref={sectionRef} className="pb-8 pt-0 bg-transparent">
       <div
         className="mx-auto flex max-w-4xl flex-col items-center px-6 transition-opacity duration-500 ease-in-out"
         style={{
           opacity: visible ? 1 : 0,
         }}
       >
         <h2 className="text-center text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] font-black uppercase leading-[1.1] text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            It&apos;s never too early
            <br />
            to <span className="text-[#FF6C0F]">execute.</span>
          </h2>

           <p className="mx-auto mt-8 max-w-lg text-center font-['MaruBuri',serif] text-base sm:text-lg md:text-xl leading-relaxed text-white/70">
             완벽한 사업계획서도, 완성된 프로덕트도, 검증된 아이디어도 필요 없습니다.
             <br className="hidden md:block" />
             필요한 건 단 하나 — <span className="font-semibold text-white">실행할 의지.</span>
           </p>

          {/* <ApplyButton href="/apply" size="lg" className="mt-16">
            4기 지원하기
          </ApplyButton>

           <p className="mt-4 font-['Pretendard',sans-serif] text-sm text-white/40">
              마감: 2026년 3월 | 성균관대 재학생 대상
           </p> */}
       </div>
     </section>
   );
}
