"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";

type PartnerData = {
  name: string;
  logo: string;
  website_url?: string | null;
};

type PartnersContentProps = {
  partners: PartnerData[];
};

export default function PartnersContent({ partners }: PartnersContentProps) {
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
      { threshold: 0.15 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-20 lg:py-28"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 10px, 0)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        willChange: isVisible ? "auto" : "transform, opacity",
      }}
    >
      <div className="mx-auto max-w-[900px] px-6">
        <p className="mb-10 text-center font-['Pretendard',sans-serif] text-sm font-semibold uppercase tracking-[0.06em] text-white/60">
          함께하는 파트너
        </p>

        <div className="flex items-center justify-center gap-6 sm:gap-14 md:gap-20">
          {partners.map((partner) => {
            const img = (
              <Image
                key={partner.name}
                src={partner.logo}
                alt={partner.name}
                width={300}
                height={80}
                className="h-8 w-auto object-contain brightness-0 invert md:h-14"
              />
            );

            if (partner.website_url) {
              return (
                <a
                  key={partner.name}
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {img}
                </a>
              );
            }

            return img;
          })}
        </div>
      </div>
    </section>
  );
}
