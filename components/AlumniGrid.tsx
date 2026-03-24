'use client';

import Image from 'next/image';
import { startTransition, useEffect, useRef, useState } from 'react';

const alumni = [
  {
    name: '이송목', batch: 'SPEC 창립자, 초대 회장', photo: '/images/member/이송목.png',
    quote: '창업에서 가장 중요한 SPEC',
    shortQuote: '창업에서 가장 중요한 SPEC',
    longQuote: '저희 SPEC은 성균관대학교 창업 생태계에 기여하기 위해 만들어졌습니다. 여러분들에게 도움이 되면 좋겠습니다.',
  },
  {
    name: '장지민', batch: '2기', photo: '/images/member/장지민.png',
    quote: '사업계획서 100장보다 고객 한 명이 더 무섭다는 걸 배웠다.',
    shortQuote: '사업계획서 100장보다 고객 한 명이 더 무섭다는 걸 배웠다.',
    longQuote: '완벽한 사업계획서를 쓰는 데 몇 주를 썼다. 그런데 첫 고객 미팅 10분 만에 모든 가정이 틀렸다는 걸 알았다. SPEC은 그 불편한 진실을 빠르게 마주하게 해줬다.',
  },
  {
    name: '전도현', batch: '3, 4기 회장', photo: '/images/member/전도현1.png',
    quote: '30주 동안 실패를 두려워하지 않는 법을 배웠다.',
    shortQuote: '30주 동안 실패를 두려워하지 않는 법을 배웠다.',
    longQuote: '회장으로서 두 기수를 이끌며 깨달은 건, 실패는 피하는 게 아니라 빠르게 통과하는 것이라는 점이다. SPEC의 매주 데모는 그 훈련장이었다.',
  },
  {
    name: '김주현', batch: '2기', photo: '/images/member/김주현.png',
    quote: '매주 매출 보드 앞에 서는 게 제일 성장시켜줬다.',
    shortQuote: '매주 매출 보드 앞에 서는 게 제일 성장시켜줬다.',
    longQuote: '숫자는 거짓말을 하지 않는다. 매주 팀 앞에서 매출을 공개하는 그 순간이 가장 두렵고, 가장 성장하는 순간이었다. 그 압박이 나를 실행하는 사람으로 만들었다.',
  },
  {
    name: '서원준', batch: '2기', photo: '/images/member/서원준1.png',
    quote: 'AI 시대, 많이 경험한 한 사람이 곧 하나의 팀이 됩니다.',
    shortQuote: 'AI 시대, 많이 경험한 한 사람이 곧 하나의 팀이 됩니다.',
    longQuote: 'AI가 도구의 장벽을 허물면서, 다양한 경험을 가진 사람일수록 더 많은 것을 혼자서도 만들어낼 수 있는 시대가 되었습니다. 기획, 개발, 마케팅, 디자인을 직접 해온 경험이 지금 이 흐름 위에서 창업의 가장 큰 무기가 되고 있습니다.',
  },
  {
    name: '신지은', batch: '2, 3기', photo: '/images/member/신지은1.png',
    quote: '무엇을 쫓고 싶은지 알게 해준 SPEC',
    shortQuote: '무엇을 쫓고 싶은지 알게 해준 SPEC',
    longQuote: '왔지만, 밤을 새워 함께 몰입하고 세상의 변화를 고민하다 보니 나에게 중요한 것이 무엇인지, 무엇을 쫓고 싶은지 알게 되었습니다.',
  },
  {
    name: '전선희', batch: '2기', photo: '/images/member/전선희.png',
    quote: 'SPEC 없었으면 창업은 평생 \'언젠가\'로 남았을 거다.',
    shortQuote: 'SPEC 없었으면 창업은 평생 \'언젠가\'로 남았을 거다.',
    longQuote: '\'언젠가 창업해야지\'라는 말을 몇 년째 했다. SPEC은 그 언젠가를 지금으로 당겨줬다. 30주가 지나고 나서야 나는 창업자가 되어 있었다.',
  },
  {
    name: '김동인', batch: '3기', photo: '/images/member/김동인1.png',
    quote: '이전에는 단순히 창업을 하고 싶었다.',
    shortQuote: '이전에는 단순히 창업을 하고 싶었다.',
    longQuote: '이전에는 단순히 창업을 하고 싶었다. SPEC에서의 다양한 경험, SPEC에서 만난 사람들 덕분에 이제는 창업이 아니면 안된다.',
  },
  {
    name: '최윤정', batch: '3기', photo: '/images/member/최윤정1.png',
    quote: '완벽한 제품보다 중요한 것은, 문제를 겪고 있는 \'사람\'에게 먼저 닿는 것이다.',
    shortQuote: '완벽한 제품보다 중요한 것은, 문제를 겪고 있는 \'사람\'에게 먼저 닿는 것이다.',
    longQuote: '책상 앞에 앉아 기능을 고도화하는 것보다 고객의 목소리를 직접 듣는 것이 성장의 본질임을 깨달았다. 결국 비즈니스의 핵심은 기술적 완성이 아니라, 누군가의 절실한 불편함을 해결해 주는 파트너가 되는 것에 있기 때문이다.',
  },
];

export default function AlumniGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotionInBrowser =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isVisible, setIsVisible] = useState(false);
  const [isMarqueeRunning, setIsMarqueeRunning] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => {
            setIsVisible(true);
          });
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMarqueeRunning(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const marqueeCards = [...alumni, ...alumni].map((person, i) => ({
    person,
    index: i,
    isClone: i >= alumni.length,
  }));

  return (
    <section className="relative w-full py-16 md:py-24 lg:py-32 bg-transparent">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6">
        <div className="mb-8 md:mb-16 text-center">
          <span
            className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-white/50"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Alumni
          </span>

          <h2
            className="mb-4 text-3xl sm:text-4xl md:text-5xl font-black uppercase text-white lg:text-6xl"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}
          >
            WE ARE SPEC.
          </h2>

          <p
            className="text-xl text-white/50"
            style={{ fontFamily: "'Pretendard', sans-serif" }}
          >
            이전 기수들이 만들어온 이야기
          </p>
        </div>

        {/* ── Desktop: grid (md+) ── */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alumni.map((person, i) => (
            <div
              key={`${person.name}-${person.batch}`}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08]"
              style={{
                aspectRatio: '3 / 4',
                opacity: reducedMotionInBrowser || isVisible ? 1 : 0,
                transform: reducedMotionInBrowser || isVisible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.6s ease ${i * 0.07}s, transform 0.6s ease ${i * 0.07}s`,
              }}
            >
              <Image
                src={person.photo}
                alt={person.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />

              <div
                className="absolute inset-0 transition-all duration-500"
                style={{
                  background: `linear-gradient(to top, rgba(0,0,0,${Math.min(0.6 + i * 0.05, 1)}) 0%, rgba(0,0,0,${Math.min(0.1 + i * 0.03, 0.6)}) 50%, transparent 100%)`,
                }}
              />

              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              />

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 transition-opacity duration-300 group-hover:opacity-0">
                <p
                  className="text-2xl font-black text-white md:text-3xl"
                  style={{ fontFamily: "'Pretendard', sans-serif" }}
                >
                  {person.name}
                </p>
                <p
                  className="mt-1 text-base text-white/60 md:text-lg"
                  style={{ fontFamily: "'Pretendard', sans-serif" }}
                >
                  {person.batch}
                </p>
                <p
                  className="mt-2 text-sm italic leading-snug text-white/70 md:text-base"
                  style={{ fontFamily: "'MaruBuri', serif" }}
                >
                  &ldquo;{person.shortQuote}&rdquo;
                </p>
              </div>

              <div className="absolute inset-0 hidden items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:flex">
                <p
                  className="text-center text-base italic leading-relaxed text-white/90 md:text-lg lg:text-xl"
                  style={{ fontFamily: "'MaruBuri', serif" }}
                >
                  &ldquo;{person.longQuote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: lightweight marquee (<md) ── */}
      <div className="scrollbar-none md:hidden overflow-hidden px-6 pb-2">
        <div
          className="flex w-max gap-4"
          style={{
            animation:
              !reducedMotionInBrowser && isVisible && isMarqueeRunning
                ? 'alumni-marquee 30s linear infinite'
                : 'none',
            opacity: reducedMotionInBrowser || isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            willChange:
              !reducedMotionInBrowser && isVisible && isMarqueeRunning
                ? 'transform'
                : 'auto',
          }}
        >
          {marqueeCards.map(({ person, index, isClone }) => (
            <div
              key={`m-${person.name}-${index}`}
              className="group relative w-[62vw] max-w-[244px] shrink-0 overflow-hidden rounded-xl border border-white/[0.08]"
              style={{
                aspectRatio: '3 / 4',
                transform: reducedMotionInBrowser || isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `transform 0.45s ease ${index * 0.04}s`,
              }}
              aria-hidden={isClone}
            >
              <Image
                src={person.photo}
                alt={person.name}
                fill
                className="object-cover"
                sizes="62vw"
                loading={isClone ? 'lazy' : index < 2 ? 'eager' : 'lazy'}
                priority={!isClone && index === 0}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                }}
              />

              {/* 호버/탭 시 어두움 */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              />

              {/* 기본 하단 텍스트 — 호버/탭 시 사라짐 */}
              <div className="absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 group-hover:opacity-0">
                <p
                  className="text-2xl font-black text-white"
                  style={{ fontFamily: "'Pretendard', sans-serif" }}
                >
                  {person.name}
                </p>
                <p
                  className="mt-1 text-base text-white/60"
                  style={{ fontFamily: "'Pretendard', sans-serif" }}
                >
                  {person.batch}
                </p>
                <p
                  className="mt-2 text-sm italic leading-snug text-white/70"
                  style={{ fontFamily: "'MaruBuri', serif" }}
                >
                  &ldquo;{person.shortQuote}&rdquo;
                </p>
              </div>

              {/* 호버/탭 시 longQuote */}
              <div className="absolute inset-0 flex items-center justify-center p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p
                  className="text-center text-sm italic leading-relaxed text-white/90"
                  style={{ fontFamily: "'MaruBuri', serif" }}
                >
                  &ldquo;{person.longQuote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes alumni-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(calc(-50% - 8px), 0, 0); }
        }
      `}</style>
    </section>
  );
}
