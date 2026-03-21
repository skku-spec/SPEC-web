'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const mainPartners = [
  { name: '성균관대학교 RISE 사업단', logo: '/images/logos/rise.png', mobileHeight: 'h-14', desktopHeight: 'md:h-[120px]' },
  { name: '카카오모빌리티', logo: '/images/logos/kakao.svg', mobileHeight: 'h-8', desktopHeight: 'md:h-10' },
  { name: 'SL IT', logo: '/images/logos/SL_IT.svg', mobileHeight: 'h-5', desktopHeight: 'md:h-7' },
];



export default function Partners() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => {
            setIsVisible(true);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative w-full py-20 lg:py-28 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 10px, 0)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        willChange: isVisible ? 'auto' : 'transform, opacity',
      }}
    >
      <div className="mx-auto max-w-[900px] px-6">
        <p className="mb-10 text-center font-['Pretendard',sans-serif] text-sm font-semibold uppercase tracking-[0.06em] text-white/60">
          함께하는 파트너
        </p>

        <div className="flex items-center justify-center gap-6 sm:gap-14 md:gap-20">
          {mainPartners.map((partner) => (
            <Image
              key={partner.name}
              src={partner.logo}
              alt={partner.name}
              width={300}
              height={80}
              className={`${partner.mobileHeight} ${partner.desktopHeight} w-auto object-contain brightness-0 invert`}
            />
          ))}
        </div>


      </div>
    </section>
  );
}
