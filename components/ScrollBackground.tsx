'use client';

import { useEffect, useRef } from 'react';

const entrepreneurImages = [
  '/member/spec1.jpg',
  '/member/spec2.jpg',
  '/member/spec3.jpg',
  '/member/spec4.png',
  '/member/spec5.jpg',
  '/member/spec6.jpg',
  '/member/spec7.png',
];

const specImages = [
  '/heroes/1.jpg',
  '/heroes/2.jpg',
  '/heroes/3.jpg',
  '/heroes/4.jpg',
  '/heroes/5.jpg',
];

const allBackgroundImages = [...entrepreneurImages, ...specImages];

export default function ScrollBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerARef = useRef<HTMLImageElement>(null);
  const layerBRef = useRef<HTMLImageElement>(null);
  const rafId = useRef(0);
  const maxScrollRef = useRef(1);
  const prevPhase = useRef('entrepreneur');
  const prevIndex = useRef(0);
  const activeLayer = useRef<'a' | 'b'>('a');
  const activeSrcRef = useRef(entrepreneurImages[0]);
  const loadedImageSetRef = useRef<Set<string>>(new Set([entrepreneurImages[0], entrepreneurImages[1]]));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const layerA = layerARef.current;
    const layerB = layerBRef.current;
    if (!layerA || !layerB) {
      return;
    }

    // Release GPU layer after opacity transition completes
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'opacity') {
        (e.target as HTMLElement).style.willChange = 'auto';
      }
    };
    layerA.addEventListener('transitionend', onTransitionEnd);
    layerB.addEventListener('transitionend', onTransitionEnd);
    const updateMetrics = () => {
      maxScrollRef.current = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };

    let preloadCancelled = false;
    let preloadTimerId = 0;

    const preloadOne = (src: string) =>
      new Promise<void>((resolve) => {
        if (loadedImageSetRef.current.has(src)) {
          resolve();
          return;
        }

        const img = new Image();
        img.decoding = 'async';
        img.setAttribute('fetchpriority', 'low');
        img.onload = () => {
          loadedImageSetRef.current.add(src);
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = src;
      });

    const preloadSources = isMobileViewport
      ? [entrepreneurImages[0], entrepreneurImages[1], entrepreneurImages[2], specImages[0], specImages[1]]
      : allBackgroundImages;

    const preloadInBackground = async () => {
      for (const src of preloadSources) {
        if (preloadCancelled) {
          break;
        }

        await preloadOne(src);

        await new Promise<void>((resolve) => {
          preloadTimerId = window.setTimeout(resolve, isMobileViewport ? 120 : 60);
        });
      }
    };

    void preloadInBackground();

    const setActiveImage = (phase: string, index: number) => {
      const images = phase === 'spec' ? specImages : entrepreneurImages;
      const nextSrc = images[index] ?? images[0];

      if (nextSrc === activeSrcRef.current) {
        return;
      }

      const activeEl = activeLayer.current === 'a' ? layerA : layerB;
      const hiddenEl = activeLayer.current === 'a' ? layerB : layerA;

      const reveal = () => {
        // Promote layers to GPU only during transition
        hiddenEl.style.willChange = 'opacity';
        activeEl.style.willChange = 'opacity';
        hiddenEl.style.opacity = '0.25';
        activeEl.style.opacity = '0';
        activeLayer.current = activeLayer.current === 'a' ? 'b' : 'a';
        activeSrcRef.current = nextSrc;
        loadedImageSetRef.current.add(nextSrc);
      };

      if (hiddenEl.getAttribute('src') === nextSrc && hiddenEl.complete) {
        reveal();
        return;
      }

      hiddenEl.onload = null;
      hiddenEl.onerror = null;
      hiddenEl.src = nextSrc;
      if (hiddenEl.complete) {
        reveal();
        return;
      }

      // Use decode() for off-main-thread image decoding when available
      if (typeof hiddenEl.decode === 'function') {
        hiddenEl.decode().then(reveal, reveal);
      } else {
        hiddenEl.onload = reveal;
        hiddenEl.onerror = reveal;
      }
    };

    const tick = () => {
      const scrollY = window.scrollY;
      const progress = scrollY / maxScrollRef.current;

      const isSpec =
        prevPhase.current === 'spec'
          ? progress >= 0.48
          : progress >= 0.52;
      const phase = isSpec ? 'spec' : 'entrepreneur';
      const images = isSpec ? specImages : entrepreneurImages;
      const phaseProgress = isSpec
        ? (progress - 0.5) / 0.5
        : progress / 0.5;
      const clamped = Math.max(0, Math.min(1, phaseProgress));
      const index = Math.min(
        images.length - 1,
        Math.floor(clamped * images.length),
      );

      if (phase === prevPhase.current && index === prevIndex.current) return;

      prevPhase.current = phase;
      prevIndex.current = index;

      setActiveImage(phase, index);
    };

    const onScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = 0;
        tick();
      });
    };

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(document.documentElement);

    updateMetrics();
    setActiveImage('entrepreneur', 0);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateMetrics, { passive: true });
    tick();

    return () => {
      preloadCancelled = true;
      if (preloadTimerId) {
        window.clearTimeout(preloadTimerId);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateMetrics);
      resizeObserver.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
      layerA.onload = null;
      layerA.onerror = null;
      layerB.onload = null;
      layerB.onerror = null;
      layerA.removeEventListener('transitionend', onTransitionEnd);
      layerB.removeEventListener('transitionend', onTransitionEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none bg-[#0a0a0a] grayscale"
    >
      <img
        ref={layerARef}
        src={entrepreneurImages[0]}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[48%_center] md:object-center"
        style={{ opacity: 0.25, transition: 'opacity 0.65s ease-out', willChange: 'auto' }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <img
        ref={layerBRef}
        src={entrepreneurImages[1]}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[48%_center] md:object-center"
        style={{ opacity: 0, transition: 'opacity 0.65s ease-out', willChange: 'auto' }}
        loading="lazy"
        fetchPriority="low"
        decoding="async"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
}
