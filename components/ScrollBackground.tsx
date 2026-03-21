'use client';

import NextImage from 'next/image';
import { useEffect, useRef, useState } from 'react';

const entrepreneurImages = [
  '/images/marketing/preneur_4.jpg',
  '/images/member/spec1.jpg',
  '/images/member/spec2.jpg',
  '/images/member/spec3.jpg',
  '/images/member/spec4.png',
  '/images/member/spec5.jpg',
  '/images/member/spec6.jpg',
  '/images/member/spec7.png',
];

const specImages = [
  '/images/heroes/1.jpg',
  '/images/heroes/2.jpg',
  '/images/heroes/3.jpg',
  '/images/heroes/4.jpg',
  '/images/heroes/5.jpg',
];

const allBackgroundImages = [...entrepreneurImages, ...specImages];
const mobileBackgroundImages = [
  entrepreneurImages[0],
  entrepreneurImages[2],
  entrepreneurImages[4],
  specImages[1],
  specImages[3],
];

type BackgroundMode = 'desktop' | 'mobile' | 'static';

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
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('static');

  useEffect(() => {
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileViewportMedia = window.matchMedia('(max-width: 767px)');

    const updateMode = () => {
      if (reducedMotionMedia.matches) {
        setBackgroundMode('static');
        return;
      }

      setBackgroundMode(mobileViewportMedia.matches ? 'mobile' : 'desktop');
    };

    updateMode();
    reducedMotionMedia.addEventListener('change', updateMode);
    mobileViewportMedia.addEventListener('change', updateMode);

    return () => {
      reducedMotionMedia.removeEventListener('change', updateMode);
      mobileViewportMedia.removeEventListener('change', updateMode);
    };
  }, []);

  useEffect(() => {
    if (backgroundMode !== 'desktop') {
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

    layerA.src = entrepreneurImages[0];
    layerA.style.opacity = '0.22';
    layerB.src = entrepreneurImages[1];
    layerB.style.opacity = '0';
    activeLayer.current = 'a';
    activeSrcRef.current = entrepreneurImages[0];
    prevPhase.current = 'entrepreneur';
    prevIndex.current = 0;

    const preloadOne = (src: string) =>
      new Promise<void>((resolve) => {
        if (loadedImageSetRef.current.has(src)) {
          resolve();
          return;
        }

        const img = new window.Image();
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

    const preloadInBackground = async () => {
      for (const src of allBackgroundImages) {
        if (preloadCancelled) {
          break;
        }

        await preloadOne(src);

        await new Promise<void>((resolve) => {
          preloadTimerId = window.setTimeout(resolve, 60);
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
  }, [backgroundMode]);

  useEffect(() => {
    if (backgroundMode !== 'mobile') {
      return;
    }

    const layerA = layerARef.current;
    const layerB = layerBRef.current;
    if (!layerA || !layerB) {
      return;
    }

    let preloadCancelled = false;
    let preloadTimerId = 0;

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'opacity') {
        (e.target as HTMLElement).style.willChange = 'auto';
      }
    };
    layerA.addEventListener('transitionend', onTransitionEnd);
    layerB.addEventListener('transitionend', onTransitionEnd);

    layerA.src = mobileBackgroundImages[0];
    layerA.style.opacity = '0.18';
    layerB.src = mobileBackgroundImages[1];
    layerB.style.opacity = '0';
    activeLayer.current = 'a';
    activeSrcRef.current = mobileBackgroundImages[0];

    const preloadOne = (src: string) =>
      new Promise<void>((resolve) => {
        if (loadedImageSetRef.current.has(src)) {
          resolve();
          return;
        }

        const img = new window.Image();
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

    const preloadInBackground = async () => {
      for (const src of mobileBackgroundImages) {
        if (preloadCancelled) {
          break;
        }

        await preloadOne(src);

        await new Promise<void>((resolve) => {
          preloadTimerId = window.setTimeout(resolve, 120);
        });
      }
    };

    void preloadInBackground();

    const setDisplayedSrc = (nextSrc: string) => {
      if (nextSrc === activeSrcRef.current) {
        return;
      }

      const activeEl = activeLayer.current === 'a' ? layerA : layerB;
      const hiddenEl = activeLayer.current === 'a' ? layerB : layerA;

      const reveal = () => {
        hiddenEl.style.willChange = 'opacity';
        activeEl.style.willChange = 'opacity';
        hiddenEl.style.opacity = '0.18';
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

      hiddenEl.onload = reveal;
      hiddenEl.onerror = reveal;
    };

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('#hero, .landing-section'),
    );

    if (!targets.length) {
      return () => {
        preloadCancelled = true;
        if (preloadTimerId) {
          window.clearTimeout(preloadTimerId);
        }
      };
    }

    const ratios = new Map<HTMLElement, number>();

    const syncImageToMostVisibleSection = () => {
      let bestTarget = targets[0];
      let bestRatio = -1;

      for (const target of targets) {
        const ratio = ratios.get(target) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestTarget = target;
        }
      }

      const targetIndex = targets.indexOf(bestTarget);
      const imageIndex = Math.round(
        (targetIndex * (mobileBackgroundImages.length - 1)) /
          Math.max(targets.length - 1, 1),
      );

      setDisplayedSrc(mobileBackgroundImages[imageIndex] ?? mobileBackgroundImages[0]);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(
            entry.target as HTMLElement,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }

        syncImageToMostVisibleSection();
      },
      {
        threshold: [0.12, 0.28, 0.44, 0.6],
        rootMargin: '-8% 0px -8% 0px',
      },
    );

    targets.forEach((target, index) => {
      ratios.set(target, index === 0 ? 1 : 0);
      observer.observe(target);
    });

    syncImageToMostVisibleSection();

    return () => {
      preloadCancelled = true;
      if (preloadTimerId) {
        window.clearTimeout(preloadTimerId);
      }
      observer.disconnect();
      layerA.onload = null;
      layerA.onerror = null;
      layerB.onload = null;
      layerB.onerror = null;
      layerA.removeEventListener('transitionend', onTransitionEnd);
      layerB.removeEventListener('transitionend', onTransitionEnd);
    };
  }, [backgroundMode]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 bg-[#0a0a0a] grayscale"
    >
      {backgroundMode !== 'static' ? (
        <>
          <img
            ref={layerARef}
            src={backgroundMode === 'mobile' ? mobileBackgroundImages[0] : entrepreneurImages[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[48%_center] md:object-center"
            style={{ opacity: backgroundMode === 'mobile' ? 0.18 : 0.22, transition: 'opacity 0.65s ease-out', willChange: 'auto' }}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <img
            ref={layerBRef}
            src={backgroundMode === 'mobile' ? mobileBackgroundImages[1] : entrepreneurImages[1]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[48%_center] md:object-center"
            style={{ opacity: 0, transition: 'opacity 0.65s ease-out', willChange: 'auto' }}
            loading="lazy"
            fetchPriority="low"
            decoding="async"
          />
        </>
      ) : (
        <NextImage
          src={entrepreneurImages[0]}
          alt=""
          fill
          priority
          quality={55}
          sizes="100vw"
          className="object-cover object-[48%_center] opacity-[0.16] md:object-center"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70" />
    </div>
  );
}
