/**
 * WARNING: This component contains PLACEHOLDER data from Y Combinator's website.
 * The companies listed (OpenAI, Airbnb, Stripe, etc.) are NOT affiliated with SPEC.
 * DO NOT use this component on any public-facing page until replaced with real SPEC data.
 * Images are hotlinked from bookface-static.ycombinator.com — do not deploy.
 */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const companies = [
  {
    name: "OpenAI",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/openai-batch-2-bd451c2a6d1966e17822ce4a22aeaec5167daad588cf0a99a9a68c563b6b4028.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/openai-now-1-14b338a4c66a1ad05c34b311d1d4c1b535cb960ef24109be329fe552358ebba9.jpg",
    duringText: "Sam was part of SPEC's inaugural batch in 1기 and founded OpenAI as SPEC Research in 2015.",
    nowText: "Sam built OpenAI into a $500B company.",
  },
  {
    name: "Airbnb",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/airbnb-batch-2-a1df9c49bacc25254fe05a3bac4921eff5ac37109de97b1d2337f6fd86a488be.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/airbnb-now-1-26d764d24e2486fd91a902dbd06b7bb05a3613e5af6273baffecf6f24090f6d1.jpg",
    duringText: "Brian, Joe, and Nate did SPEC in 2기.",
    nowText: "Airbnb went public in 2020 at an over $100B valuation.",
  },
  {
    name: "Stripe",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/stripe-batch-2-60e80fb0b35bee455d46fafcd3b175126ae5fce3e397e94a919b968a832d6107.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/stripe-now-1-4fc6337a8f67eadec8f2f1e6b72dc008fb646e670d0336caa16902f51602aa85.jpg",
    duringText: "The Collison brothers did SPEC twice—first in 1기 and then in 2기, when they started Stripe.",
    nowText: "Stripe is now the internet\u2019s $107B payments backbone.",
  },
  {
    name: "Coinbase",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/coinbase-batch-1-d0d5c84104f9f9578d888d283099ee17b47731e6301304faf9d1109b38e4d177.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/coinbase-now-1d5b1a7aa6aaa70d84f4e77bcc5d35e63a9cedbb9dcb849ab946d1c274b6e47e.jpg",
    duringText: "Fred and Brian met on Reddit and did SPEC in 3기.",
    nowText: "Coinbase went public in 2021 at a $86B valuation.",
  },
  {
    name: "DoorDash",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/doordash-batch-2-dd602f0734e6093e3d306eb0f7de4fad730cc6d357f478a769c97d0e50c5ceb2.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/doordash-now-331fd1df377dabb40264bb83071545d114a7a9fb024f152a8098c98c2fcab3f7.jpg",
    duringText: "Andy, Stanley, Tony, and Evan did SPEC in 3기.",
    nowText: "DoorDash went public in 2020 at a valuation of $39B.",
  },
  {
    name: "Scale AI",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/scale-ai-batch3-cac949deabf5b818c3f3f2c49d9e2d194227ec90dab863ac2ab636dbb870cd19.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/scaleai-now-1-225d65a5b18021eeaa18fe4eadb83f9cd4ea5abffe8dbac6c51f87866dd5cd37.jpg",
    duringText: "Alexandr and Lucy did SPEC 4기 and pivoted during the batch.",
    nowText: "In 2025, Meta acquired 49% of Scale for over $14B.",
  },
  {
    name: "Dropbox",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/dropbox-batch-7f8ebe6bc34eb91cd5103055679597bd7b6628c50ed447b7d6a33c1fda872223.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/dropbox-now-64142144a6030372b92accc4e8531ead60eea517d9a24230c30371c7358a206b.jpg",
    duringText: "Arash and Drew started Dropbox at MIT and did SPEC in 1기.",
    nowText: "Dropbox had the biggest tech IPO of 2018 at a $9B valuation.",
  },
  {
    name: "Reddit",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/reddit-batch-a4d08a9bbb466f39806eab735405aea784f6b39f22c9af07f697fe8c323cdc2e.png",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/reddit-now-f6838bd6494ed8a21e646d7ee4a79c0f12f684e8842cd7c53612c5f31d7aa0eb.jpg",
    duringText: "Alexis and Steve were in the inaugural SPEC batch in 1기.",
    nowText: "Reddit went public in 2024 at a $6.4B valuation.",
  },
  {
    name: "Instacart",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/instacart-batch-2-c4d5c8eea73e1c85e472b9b3fa9f91488ca278f2f2bf258d30166c61847a3c43.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/instacart-now-2-296ed5ff821bb577b68429995747f9251c1d02bb7ceb4d52e727db3f2d295332.jpg",
    duringText: "Apoorva, Max, and Brandon did SPEC in 3기.",
    nowText: "Instacart went public in 2023 at a $10B valuation.",
  },
  {
    name: "GitLab",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/gitlab-batch-1-858c18e16366d3344abd06cec9ad5f6440f1395086e96fc733baf2a927645e4e.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/gitlab-now-2-1c6a0934f16b0f8d84d0fc90ffa92d8c11f7fb7ca40d44b9e6d4627b620edcba.jpg",
    duringText: "Sid and Dmytro did SPEC in 3기.",
    nowText: "GitLab went public in 2021 at an $11B valuation.",
  },
  {
    name: "Kalshi",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/kalshi-batch-1-12c1828169bef411e3f7910f0b7e48f8e5fb4d1f7eafee50926c933b55b324d5.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/kalshi-now-1-3affaf3dd1e1259afd5d1f72f1b0331818f9ed44454d1820b20b01c58771495b.jpg",
    duringText: "Tarek and Luana did SPEC in 4기.",
    nowText: "Kalshi reached an $11B valuation in 2025.",
  },
  {
    name: "Replit",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/replit-batch-1-1fa8581e2ab474b5475f0ba9ef36c5eebbecfe58a82759ca1cdb6ee45f64c38c.jpg",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/replit-now-2-fd3ed60ec6667405527c1cd0324299871b46a21e47eff54ef367609f76718309.jpg",
    duringText: "Amjad and Haya interviewing for the SPEC 4기 batch.",
    nowText: "Replit became a leading AI coding platform valued at over $3B.",
  },
  {
    name: "Twitch",
    duringImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/twitch-batch-3714c0d71b6d4d29c573e59b5b2b165dc6b78f3f837af6ad49149152a62208fe.png",
    nowImg: "https://bookface-static.ycombinator.com/assets/ycdc/beforevsnow/twitch-now-2-9f9f4f8fa6f4e70b792332cb296e107391771cf947aae6c1e8fc2967d0836bfb.jpg",
    duringText: "Michael, Justin, Kyle, and Emmett in SPEC 1기.",
    nowText: "Twitch was acquired by Amazon for nearly $1B.",
  },
];

const duringLogos = [
  { name: "Stripe", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/stripe-logo-transparent-85c767ab1ed5ba6d984910431da37aa11f0e491bbb5893620aeb9139112bc870.png" },
  { name: "Front", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/front-logo-transparent-9ba8a5084ef12b32d43f520435b87587c06f7de8f960d24787aa37623768e13e.png" },
  { name: "Instacart", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/instacart-logo-transparent-bd83ae5639098d164490c7c243fd295a25e8a54b3db1404d3c1a1242c3daaf11.png" },
  { name: "Rippling", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/rippling-logo-transparent-491cdc4a31bbb5e0accd6699f3f3e38e1c8990b002db2dca9ee9c060a58b667f.png" },
  { name: "Deel", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/deel-logo-transparent-016c7a0ae619ae0d52d1c3306dc9658c1eb888ee8b92ec175cd0788ca7411d18.png" },
  { name: "OpenAI", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/openai-logo-transparent-c650fb6bfd7073c21245510b8860f3d3d72fcf7a1ca3deed267af5a97f24616e.png" },
  { name: "Flexport", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/flexport-logo-transparent-b17c1ec27aec0ff9ebb9d5d87bedd929a8cd5b18428a1b4a9ddb5d5624966068.png" },
  { name: "Dropbox", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/dropbox-logo-transparent-d71a0aef6f61ba8756ef651e12c67df97641df132f8cd501b58265ae92638bed.png" },
  { name: "Zapier", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/zapier-logo-transparent-28db2da0f6c807eec75f63ceb6a642e87692ebe6ee86a403ed66a476ba0a8b95.png" },
  { name: "Gusto", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/gusto-logo-transparent-dd645cd073cb1f896ea2ddc36927c3e75e02b71d7a9f1d470e18938056cba5ef.png" },
  { name: "Replit", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/replit-logo-transparent-62c8eebb524c82f17ba61a383bc839f3808eda0897fb4450a6d68522aa462803.png" },
  { name: "PagerDuty", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/pagerduty-logo-transparent-8d295666277bddf8a5abd759fe8c3cb253b8b5cc86bab538da9b094ae9f3a63c.png" },
  { name: "Reddit", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/reddit-logo-transparent-6500aa21285663238fa33f87739492e31c4f024a537f4d03b31b2c1386d8d0b7.png" },
  { name: "Kalshi", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/kalshi-logo-transparent-36e6c9f8ee1e946f00b6b14673c650a37861975e75d7b85f57393c67376bc273.png" },
  { name: "Zepto", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/zepto-logo-transparent-336ddf8fd31feb260971797b3da907ec01cffe83b3a2b647ebb1e5a4a66ec3cd.png" },
  { name: "Stoke Space", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/stoke-logo-transparent-1d2a6fa290452a93e41fb5422a38ba14adfcc51108f7ae1d88dffabaecec0733.png" },
];

const nowLogos = [
  { name: "Scale AI", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/scaleai-logo-transparent-0bfe7bf608b76a652394725da3ae8bac8bbf79eab414df52388e755bee9e8a6a.png" },
  { name: "Ironclad", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/ironclad-logo-transparent-0d5f5cdbd3dcecaf95d1aef019a5ebee3122d169eaa68cec9258d6ead676eeff.png" },
  { name: "Faire", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/faire-logo-transparent-5c0990582c0111c1bf5066c1b05c2081635e2d240633bf65cdd27b74a633c501.png" },
  { name: "PostHog", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/posthog-logo-transparent-b066a8e28cc4bf30df2a8acb15871d6f78c0d4068c5b061656ab36f4594c582f.png" },
  { name: "DoorDash", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/doordash-logo-transparent-04e06210d2557e90b9dd0617712d2e47cd0506a5ab327a19ba367976e5cb828e.png" },
  { name: "Twitch", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/twitch-logo-transparent-b8560e630f4d259e1c9fb3a84b26ffc5ff215fe3bb475d10c830e5239678008f.png" },
  { name: "GitLab", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/gitlab-logo-transparent-516e84f6570b67d86d0d59ea30b99735485cfba89551e00e45a2d93dda23f492.png" },
  { name: "Rappi", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/rappi-logo-transparent-e4900ae32175ac32d7d00cd19fd65f765fab3675f81e787b38b9578a2fb78886.png" },
  { name: "Docker", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/docker-logo-transparent-f9e9d5e42c317cd822c926117d02d536746ed2cf0962b04ea0e8a5497e5fa740.png" },
  { name: "Substack", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/substack-logo-transparent-b9d1facb0945fc7b4557df87807c714d4c638a09df59c438dde8ded273d7523b.png" },
  { name: "Benchling", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/benchling-logo-transparent-e466c10b7e0a257a150ec9e8558b5190838891b627a96cd5d4c4b4d3cb11142b.png" },
  { name: "Coinbase", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/coinbase-logo-transparent-884b707305fbf3cc64e2fd880312ac0e30310b68b831c61bc47446daec352d28.png" },
  { name: "Vanta", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/vanta-logo-transparent-5af5e89861aa0cd7c488869819380e748e7eb96c8ef9545bc55a083dfd07896f.png" },
  { name: "Brex", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/brex-logo-transparent-f779de40bd5826f5c0d80e4950ccfa85adef25429efe89f63c519ebbe31478a0.png" },
  { name: "Flock Safety", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/flock-safety-logo-transparent-a7e730e830c2fa2cdc8a0806f584414d4e616c90ea78f3bbe987826e3a760311.png" },
  { name: "Airbnb", src: "https://bookface-static.ycombinator.com/assets/ycdc/logos/airbnb-logo-transparent-51af28d59ce97220921890c77b96fee285b06c09facec62a8678cac4e446718a.png" },
];

/* ───────────────────── Component ───────────────────── */

export default function CompanyShowcase() {
  /* ── Desktop scroll state ── */
  const sectionRef = useRef<HTMLElement>(null);
  const nameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [pastCompanies, setPastCompanies] = useState(false);

  /* ── Mobile click state ── */
  const [mobileIndex, setMobileIndex] = useState(0);
  const mobileCompany = companies[mobileIndex];

  /* ── IntersectionObserver: track section visibility ── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSectionVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  /* ── Scroll handler: detect nearest company to viewport center ── */
  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionRect = section.getBoundingClientRect();
      const viewportH = window.innerHeight;

      if (sectionRect.bottom < viewportH * 0.3 || sectionRect.top > viewportH * 0.7) {
        setActiveIndex(-1);
        setSectionVisible(false);
        setPastCompanies(false);
        return;
      }

      if (!sectionVisible) setSectionVisible(true);

      const viewportCenter = viewportH / 2;
      let closestIdx = -1;
      let closestDist = Infinity;

      nameRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const dist = Math.abs(elCenter - viewportCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });

      setActiveIndex(closestDist > 200 ? -1 : closestIdx);

      // Only show logos in the narrow window after last company, before section exits
      const lastEl = nameRefs.current[companies.length - 1];
      if (lastEl) {
        const lastRect = lastEl.getBoundingClientRect();
        const isPastLastCompany = lastRect.bottom < viewportCenter;
        const sectionStillInView = sectionRect.bottom > viewportH * 0.45;
        setPastCompanies(isPastLastCompany && sectionStillInView);
      }
    });
  }, [sectionVisible]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

   const showLogos = (activeIndex === -1 && pastCompanies) || activeIndex === companies.length;

  /* ── Render helpers ── */
  const renderCard = (
    company: (typeof companies)[number],
    index: number,
    side: "during" | "now",
  ) => {
    const isActive = activeIndex === index;
    const img = side === "during" ? company.duringImg : company.nowImg;
    const text = side === "during" ? company.duringText : company.nowText;
    const label = side === "during" ? "During SPEC" : "Now";

    return (
      <div
        key={`${side}-${company.name}`}
        className="pointer-events-none absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-opacity duration-300 ease-in-out"
        style={{ opacity: isActive ? 1 : 0, zIndex: 1 }}
      >
        <div className="relative flex w-full flex-col items-center">
          <div className={side === "during" 
            ? "mb-1.5 text-center font-['Source_Serif_4',serif] text-base font-normal italic text-[#16140f] lg:mb-2 lg:text-lg xl:text-xl"
            : "mb-1.5 text-center font-['Outfit',sans-serif] text-[11.2px] font-medium text-[#16140f] lg:mb-2"
          }>
            {label}
          </div>
          <img
            src={img}
               alt={`${company.name} during SPEC`}
            className="block aspect-square w-full rounded-xl object-cover shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
         <p className="absolute left-1/2 top-full m-0 mt-3 w-[90%] -translate-x-1/2 text-left font-['Outfit',sans-serif] text-[14px] font-light leading-[1.5] text-white lg:text-sm">
           {text}
         </p>
      </div>
    );
  };

  const renderLogoGrid = (
    logos: typeof duringLogos,
    side: "during" | "now",
  ) => (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2"
      style={{ zIndex: 1 }}
    >
      <div className="mx-auto grid w-full grid-cols-4 gap-x-0.5 gap-y-0">
        {logos.map((logo, i) => (
          <div
            key={`${side}-logo-${logo.name}`}
             className="flex h-[90px] items-center justify-center overflow-hidden bg-transparent p-0 transition-transform duration-300"
            style={{
              opacity: showLogos ? 1 : 0,
              transition: showLogos
                ? `opacity 0.1s ease-out ${i * 50}ms`
                : "opacity 0.1s ease-out",
            }}
          >
             <img
               src={logo.src}
               alt={logo.name}
               className="h-[90px] w-[80%] object-contain object-center"
               loading="lazy"
             />
          </div>
        ))}
      </div>
    </div>
  );

  const chevronSvg = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ml-1"
    >
      <path
        d="M6 3L11 8L6 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <>
      {/* ═══════════ DESKTOP LAYOUT (lg+) ═══════════ */}
      <section
        ref={sectionRef}
        className="relative box-border hidden w-full max-w-[100vw] justify-center overflow-hidden bg-[#f5f5ee] px-20 py-[60px] pb-[120px] lg:flex lg:max-xl:px-[60px]"
      >
         {/* ── Left Fixed Panel (During SPEC) ── */}
        <div
          className="pointer-events-none fixed left-[4%] top-1/2 z-10 flex h-0 w-[30%] -translate-y-1/2 flex-col gap-5 xl:left-[5%] xl:w-[32%] xl:gap-6 2xl:left-[6%] 2xl:w-[34%] 2xl:gap-7"
          style={{
            opacity: sectionVisible ? 1 : 0,
            visibility: sectionVisible ? "visible" : "hidden",
            transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
          }}
        >
          {companies.map((c, i) => renderCard(c, i, "during"))}
          {renderLogoGrid(duringLogos, "during")}
        </div>

        {/* ── Center Column (scrollable company names) ── */}
        <div className="relative flex min-w-[250px] flex-col text-center lg:min-w-[300px] xl:min-w-[350px] 2xl:min-w-[400px]">
          {companies.map((company, index) => (
            <div
              key={`name-${company.name}`}
              ref={(el) => {
                nameRefs.current[index] = el;
              }}
                className={`flex cursor-pointer flex-col items-center gap-0 py-2.5 font-['Source_Serif_4',serif] text-[2rem] tracking-[-0.02em] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:py-3.5 lg:py-[18px] lg:text-[2.5rem] xl:py-5 xl:text-[3rem] 2xl:py-[22px] 2xl:text-[3.5rem] ${
                 activeIndex === index
                   ? "font-[500] text-[#16140F] opacity-100"
                   : "font-normal text-[#8a8575] opacity-[0.15]"
                }`}
            >
              {company.name}
            </div>
          ))}

           {/* $1.3 Trillion */}
           <div
             ref={(el) => {
               nameRefs.current[companies.length] = el;
             }}
              className={`mt-12 flex cursor-pointer flex-col items-center gap-0 py-2.5 font-['Source_Serif_4',serif] text-[2rem] tracking-[-0.02em] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:py-3.5 lg:mt-16 lg:py-[18px] lg:text-[2.5rem] xl:py-5 xl:text-[3rem] 2xl:py-[22px] 2xl:text-[3.5rem] ${
                activeIndex === companies.length
                  ? "font-[500] text-[#16140F] opacity-100"
                  : "font-normal text-[#8a8575] opacity-[0.15]"
              }`}
           >
             $1.3 Trillion
             <span className="block text-[0.6rem] font-[350] italic tracking-normal lg:text-[0.95rem] xl:text-base 2xl:text-xl">
               in combined valuation
             </span>
           </div>

           {/* All companies link */}
           <a
             href="https://www.ycombinator.com/companies"
             target="_blank"
             rel="noopener noreferrer"
              className={`mt-4 inline-flex h-[52px] cursor-pointer items-center justify-center gap-1.5 self-center rounded-full border-none bg-transparent px-8 font-['Source_Serif_4',serif] text-[17px] font-normal italic text-[#16140F] underline decoration-[rgba(22,20,15,0.35)] underline-offset-[3px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-transparent hover:text-[#16140F] hover:decoration-[rgba(22,20,15,1)] hover:opacity-100 ${
                activeIndex === companies.length ? "opacity-100" : "opacity-30"
              }`}
           >
             All companies
             {chevronSvg}
           </a>
        </div>

        {/* ── Right Fixed Panel (Now) ── */}
        <div
          className="pointer-events-none fixed right-[4%] top-1/2 z-10 flex h-0 w-[30%] -translate-y-1/2 flex-col gap-5 xl:right-[5%] xl:w-[32%] xl:gap-6 2xl:right-[6%] 2xl:w-[34%] 2xl:gap-7"
          style={{
            opacity: sectionVisible ? 1 : 0,
            visibility: sectionVisible ? "visible" : "hidden",
            transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
          }}
        >
          {companies.map((c, i) => renderCard(c, i, "now"))}
          {renderLogoGrid(nowLogos, "now")}
        </div>
      </section>

      {/* ═══════════ MOBILE LAYOUT (<lg) ═══════════ */}
      <section className="relative box-border w-full max-w-[100vw] overflow-hidden bg-[#f5f5ee] px-5 py-10 lg:hidden">
        <div className="flex flex-col items-center">
          {/* Company Cards - During & Now stacked */}
          <div className="flex w-full max-w-md flex-col gap-8">
           {/* During SPEC Card */}
             <div className="flex w-full flex-col items-center">
               <span className="mb-2 text-center font-['Source_Serif_4',serif] text-base font-normal italic text-[#16140f]">
                 During SPEC
               </span>
              <div className="relative w-full">
                <img
                  src={mobileCompany.duringImg}
                   alt={`${mobileCompany.name} during SPEC`}
                  className="block aspect-square w-full rounded-xl object-cover shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
                />
                <p className="mt-3 text-center font-['Outfit',sans-serif] text-[13px] font-light leading-[1.5] text-[#16140f] opacity-90">
                  {mobileCompany.duringText}
                </p>
              </div>
            </div>

            {/* Now Card */}
            <div className="flex w-full flex-col items-center">
               <span className="mb-2 text-center font-['Source_Serif_4',serif] text-base font-normal italic text-[#16140f]">
                Now
              </span>
              <div className="relative w-full">
                <img
                  src={mobileCompany.nowImg}
                  alt={`${mobileCompany.name} now`}
                  className="block aspect-square w-full rounded-xl object-cover shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
                />
                <p className="mt-3 text-center font-['Outfit',sans-serif] text-[13px] font-light leading-[1.5] text-[#16140f] opacity-90">
                  {mobileCompany.nowText}
                </p>
              </div>
            </div>
          </div>

          {/* Horizontal Scrollable Pill Buttons */}
          <div className="mt-8 w-full overflow-x-auto pb-2">
            <div className="flex gap-2 px-2">
              {companies.map((company, index) => (
                <button
                  key={`pill-${company.name}`}
                  onClick={() => setMobileIndex(index)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-['Source_Serif_4',serif] text-sm transition-all duration-300 ${
                    index === mobileIndex
                      ? "bg-[#16140f] text-white"
                      : "border border-[#16140f]/20 bg-transparent text-[#16140f]"
                  }`}
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>

          {/* $1.3 Trillion Pill */}
          <div className="mt-6 flex flex-col items-center">
            <div className="rounded-full border border-[#16140f]/20 px-6 py-3 text-center font-['Source_Serif_4',serif] text-lg font-normal text-[#16140f]">
              $1.3 Trillion
              <span className="ml-1 text-sm font-light italic">
                in combined valuation
              </span>
            </div>
          </div>

          {/* All companies link */}
          <a
            href="https://www.ycombinator.com/companies"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1 font-['Source_Serif_4',serif] text-base font-normal italic text-[#16140F] underline decoration-[rgba(22,20,15,0.3)] underline-offset-[3px] transition-all duration-300 hover:decoration-[rgba(22,20,15,1)]"
          >
            All companies
            {chevronSvg}
          </a>

          {/* Mobile Logo Grids */}
          <div className="mt-10 w-full">
            <div className="grid grid-cols-4 gap-1">
              {duringLogos.slice(0, 8).map((logo) => (
                <div
                  key={`mobile-logo-${logo.name}`}
                  className="flex h-16 items-center justify-center overflow-hidden"
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-[60px] w-[80%] object-contain object-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
