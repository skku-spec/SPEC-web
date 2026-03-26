/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef } from 'react';

const entrepreneurImages = [
  '/images/marketing/preneur_4.jpg',
  '/images/heroes/jobs1.jpg',
  '/images/heroes/elon1.jpg',
  '/images/heroes/jensen2.jpg',
  '/images/heroes/elon3.jpg',
  '/images/heroes/jobs3.jpg',
  '/images/heroes/elon2.jpg',
  '/images/heroes/jensen1.jpeg',
];

const specImages = [
  '/images/heroes/1.jpg',
  '/images/heroes/2.jpg',
  '/images/heroes/3.jpg',
  '/images/heroes/4.jpg',
  '/images/heroes/5.jpg',
];

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

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const layerA = layerARef.current;
    const layerB = layerBRef.current;
    if (!layerA || !layerB) {
      return;
    }

    const updateMetrics = () => {
      maxScrollRef.current = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };

    const setActiveImage = (phase: string, index: number) => {
      const images = phase === 'spec' ? specImages : entrepreneurImages;
      const nextSrc = images[index] ?? images[0];

      if (nextSrc === activeSrcRef.current) {
        return;
      }

      const activeEl = activeLayer.current === 'a' ? layerA : layerB;
      const hiddenEl = activeLayer.current === 'a' ? layerB : layerA;

      const reveal = () => {
        hiddenEl.style.opacity = '0.25';
        activeEl.style.opacity = '0';
        activeLayer.current = activeLayer.current === 'a' ? 'b' : 'a';
        activeSrcRef.current = nextSrc;
      };

      hiddenEl.src = nextSrc;
      if (hiddenEl.complete) {
        reveal();
        return;
      }

      hiddenEl.onload = reveal;
      hiddenEl.onerror = reveal;
    };

    const tick = () => {
      const scrollY = window.scrollY;
      const progress = scrollY / maxScrollRef.current;

      const isSpec = progress >= 0.5;
      const phase = isSpec ? 'spec' : 'entrepreneur';
      const images = isSpec ? specImages : entrepreneurImages;
      const phaseProgress = isSpec
        ? (progress - 0.5) / 0.5
        : progress / 0.5;
      const clamped = Math.max(0, Math.min(1, phaseProgress));
      const index = Math.floor(clamped * images.length) % images.length;

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

    updateMetrics();
    setActiveImage('entrepreneur', 0);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateMetrics, { passive: true });
    tick();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateMetrics);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      layerA.onload = null;
      layerA.onerror = null;
      layerB.onload = null;
      layerB.onerror = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none bg-[#0a0a0a]"
    >
      <img
        ref={layerARef}
        src={entrepreneurImages[0]}
        alt=""
        className="absolute inset-0 h-full w-full object-cover grayscale"
        style={{ opacity: 0.25, transition: 'opacity 0.8s ease-out', willChange: 'opacity' }}
        loading="eager"
        decoding="async"
      />
      <img
        ref={layerBRef}
        src={entrepreneurImages[1]}
        alt=""
        className="absolute inset-0 h-full w-full object-cover grayscale"
        style={{ opacity: 0, transition: 'opacity 0.8s ease-out', willChange: 'opacity' }}
        loading="lazy"
        decoding="async"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
}
