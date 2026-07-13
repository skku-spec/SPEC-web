import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "뉴스레터 구독 | SPEC",
  description: "SPEC 소식을 받아보세요",
};

const pClass =
  "mb-6 font-['Pretendard',sans-serif] font-normal text-[18px] leading-[1.7] text-[#16140f] last:mb-0";

export default function SubscribePage() {
  return (
    <main className="flex-1 px-4 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-[720px] text-center">
        <PageHeader title="Newsletter" align="center" />
      </div>

      <article className="mx-auto max-w-[720px] text-center">
        <section className="mb-10">
          <p className={pClass}>
            SPEC의 최신 소식, 창업 인사이트, 이벤트 정보를 이메일로 받아보세요.
          </p>

           <div className="my-8">
             <div className="inline-flex min-h-12 items-center justify-center rounded-md bg-black px-6 pb-1 font-['MaruBuri',serif] text-xl font-normal italic tracking-[0.015rem] text-[#f5f5ee] transition-opacity sm:h-16 sm:px-8 sm:text-[1.5rem] md:h-20 md:px-10 md:text-[1.75rem]">
               Coming Soon
             </div>
           </div>

          <p className={pClass}>
            곧 뉴스레터 구독 기능이 시작됩니다. SPEC 소식을 받으려면 인스타그램이나 이메일로 연락 주세요.
          </p>
        </section>
      </article>
    </main>
  );
}
