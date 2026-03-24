"use client";

import ApplyButton from "@/components/ui/ApplyButton";
export default function Hero() {
  return (
    <section
      id="hero"
      className="relative -ml-[calc(50vw-50%)] w-screen overflow-hidden"
    >
      <div className="relative flex h-[85vh] md:h-[90vh] flex-col items-center justify-center px-6">
       <div className="flex max-w-[1200px] flex-col items-center gap-8 mx-auto">
            {/* Main headline */}
             <h1
               className="text-center font-black uppercase leading-[0.9] tracking-[-0.03em] text-white text-[36px] sm:text-[48px] md:text-[72px] lg:text-[96px]"
               style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
             >
                <span className="text-[#FF6C0F]">EXECUTION</span>
                <br />
                Over EVERYTHING.
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
