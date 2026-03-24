import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import ScrollBackground from "@/components/ScrollBackground";
import Hero from "@/components/Hero";
import RecruitmentCard from "@/components/RecruitmentCard";
import Partners from "@/components/Partners";

const Philosophy = dynamic(() => import("@/components/Philosophy"));
const Manifesto = dynamic(() => import("@/components/Manifesto"));
const TwoTracks = dynamic(() => import("@/components/TwoTracks"));
const CurriculumRoadmap = dynamic(() => import("@/components/CurriculumRoadmap"));
const AlumniGrid = dynamic(() => import("@/components/AlumniGrid"));
const CTA = dynamic(() => import("@/components/CTA"));

export const metadata: Metadata = {
  title: "SKKU SPEC | 성균관대학교 창업 학회",
  description:
    "Execution over everything. SPEC은 30주 안에 진짜 매출을 만드는 성균관대학교 창업 프로그램입니다.",
};

export default function Home() {
  return (
    <div className="dark-theme min-h-screen">
      <ScrollBackground />

      <div className="relative z-10">
        <div className="mx-auto max-w-[960px]">
          <Hero />
        </div>
      </div>

      <div className="landing-section relative z-10 py-16 md:py-32">
        <div className="mx-auto max-w-[960px] px-6">
          <Philosophy />
        </div>
      </div>

      <div className="landing-section relative z-10 py-12 md:py-20">
        <div className="mx-auto max-w-[960px] px-6">
          <Suspense>
            <Partners />
          </Suspense>
        </div>
      </div>

      <div className="landing-section relative z-10 py-16 md:py-32">
        <div className="mx-auto max-w-[960px] px-6">
          <TwoTracks />
        </div>
      </div>

      <div className="landing-section relative z-10 py-16 md:py-32">
        <div className="mx-auto max-w-[960px] px-6">
          <CurriculumRoadmap />
        </div>
      </div>

      <div className="landing-section relative z-10 py-16 md:py-32">
        <div className="mx-auto max-w-[960px] px-6">
          <Manifesto />
        </div>
      </div>

      <div className="landing-section relative z-10 py-8 md:py-16">
        <div className="mx-auto max-w-[960px] px-6">
          <RecruitmentCard />
        </div>
      </div>

      <div className="landing-section relative z-10 py-16 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <AlumniGrid />
        </div>
      </div>

      <div className="landing-section relative z-10 py-14 md:py-24">
        <div className="mx-auto max-w-[640px] px-6">
          <CTA />
        </div>
      </div>
    </div>
  );
}
