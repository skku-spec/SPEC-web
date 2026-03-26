/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function Knowledge() {
  const videoArticles = [
    {
      title: "How to Find Startup Ideas",
      thumbnail:
        "https://bookface-static.ycombinator.com/assets/ycdc/knowledge/andrej-karpathy-startupschool-thumbnail-f31a834fbaf0754bca88d153f588af4e58a192f388a8dfad1d6e7b8d80fd9ddc.jpg",
    },
    {
      title: "Building the Future: Founder Interview",
      thumbnail:
        "https://bookface-static.ycombinator.com/assets/ycdc/knowledge/sam-altman-htbtf-thumbnail-1ac3d5f7e9b2c4d6a8f0e2b4d6c8a0f2e4b6d8c0a2f4e6b8d0c2a4f6e8b0d2c4.jpg",
    },
    {
      title: "SPEC Mentor Office Hours",
      thumbnail:
        "https://bookface-static.ycombinator.com/assets/ycdc/knowledge/office-hours-thumbnail-b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4.jpg",
    },
  ];

  const startupNews = [
    "Spring 2026 Applications Open",
    "Demo Day Fall 2025: 12 Teams Presented",
    "SPEC x Samsung Partnership",
    "SpecAI Raises Seed Round",
    "Triple Win at Startup Competition",
  ];

  const essayTopics = [
    "Do Things That Don't Scale",
    "How to Get Startup Ideas",
    "The Importance of MVP",
    "Team Building Guide",
    "The Art of Pivoting",
  ];

  return (
    <section className="py-[120px] bg-transparent">
      <div className="mx-auto max-w-6xl px-6">
        <h2 
          className="mb-[60px] text-center text-5xl font-black uppercase tracking-tight text-white"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Knowledge & News
        </h2>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="flex flex-col gap-8 lg:w-2/3">
            <div className="flex flex-col gap-4 sm:flex-row">
              {videoArticles.map((article, index) => (
                <Link
                  key={index}
                  href="/blog"
                  className="group flex flex-col gap-3"
                >
                  <div className="aspect-video overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-80"
                    />
                  </div>
                  <h3 className="font-['Pretendard',sans-serif] text-base font-light text-white/90">
                    {article.title}
                  </h3>
                </Link>
              ))}
            </div>

            <Link href="/blog" className="group flex flex-col gap-6 sm:flex-row">
              <div className="aspect-video overflow-hidden rounded-xl sm:w-1/2 border border-white/10">
                <img
                  src="https://bookface-static.ycombinator.com/assets/ycdc/knowledge/contrarian-bets-thumbnail-7338837a6c93d5ad4e5132173591a960a893ee96d2ba82617be6cab60aa20898.jpg"
                  alt="인기 없는 아이디어가 성공하는 이유"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-80"
                />
              </div>
              <div className="flex flex-col justify-center gap-3 sm:w-1/2">
                <span 
                  className="text-[11px] font-bold uppercase tracking-widest text-[#FF6C0F]"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  SPEC PODCAST
                </span>
                <h3 
                  className="text-[22px] font-bold text-white"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  Why Unpopular Ideas Win
                </h3>
                <p className="font-['Pretendard',sans-serif] text-sm font-light text-white/70 leading-[1.6]">
                  How ideas that seemed crazy at first became successful startups,
                  and why the best opportunities often look bad initially.
                </p>
              </div>
            </Link>
          </div>

          <div className="flex flex-col gap-10 lg:w-1/3">
            <div className="flex flex-col gap-4">
              <h4 
                className="text-[13px] font-bold uppercase tracking-widest text-white/70"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                LATEST NEWS
              </h4>
               <div className="flex flex-col gap-3">
                 {startupNews.map((news, index) => (
                   <Link
                     key={index}
                     href="/blog"
                     className="group flex items-center justify-between font-['Pretendard',sans-serif] text-sm font-light text-white/80 transition-colors hover:text-[#FF6C0F]"
                   >
                     <span>{news}</span>
                     <span className="ml-2 transition-transform group-hover:translate-x-1">
                       ›
                     </span>
                   </Link>
                 ))}
               </div>
            </div>

            <div className="flex flex-col gap-4">
              <h4 
                className="text-[13px] font-bold uppercase tracking-widest text-white/70"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                MUST READ
              </h4>
               <div className="flex flex-col gap-3">
                 {essayTopics.map((essay, index) => (
                   <Link
                     key={index}
                      href="/blog"
                     className="group flex items-center justify-between font-['Pretendard',sans-serif] text-sm font-light text-white/80 transition-colors hover:text-[#FF6C0F]"
                   >
                     <span>{essay}</span>
                     <span className="ml-2 transition-transform group-hover:translate-x-1">
                       ›
                     </span>
                   </Link>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
