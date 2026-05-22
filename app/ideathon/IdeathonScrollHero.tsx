"use client";

import { useEffect, useRef, useState } from "react";

export function IdeathonScrollHero({ onOpenSubmitModal }: { onOpenSubmitModal: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [src, setSrc] = useState("/videos/IDEATHON.mp4");

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setTimeout(() => {
        setSrc("/videos/IDEATHON_mobile.mp4");
      }, 0);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Reset state on source change
    setTimeout(() => {
      setVideoEnded(false);
    }, 0);
    video.load();

    const handleTimeUpdate = () => {
      const limit = video.duration ? Math.min(5.0, video.duration - 0.2) : 5.0;
      if (video.currentTime >= limit || video.ended) {
        video.pause();
        setVideoEnded(true);
      }
    };

    const handleEnded = () => {
      setVideoEnded(true);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black rounded-none" style={{ backgroundColor: "#000000" }}>
      <video
        key={src}
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover bg-black rounded-none border-0 outline-none"
      />

      {/* Submit Idea overlay — fades in after video ends */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-36 md:pb-52 pointer-events-none z-20"
        style={{
          opacity: videoEnded ? 1 : 0,
          transition: "opacity 1s ease",
          pointerEvents: videoEnded ? "auto" : "none",
        }}
      >
        <div
          style={{
            transform: videoEnded ? "translateY(0)" : "translateY(15px)",
            transition: "opacity 1s ease, transform 1s ease",
          }}
          className="flex flex-col items-center gap-6 text-center px-6"
        >
          <button
            type="button"
            onClick={onOpenSubmitModal}
            className="inline-flex h-12 md:h-14 items-center justify-center rounded-md bg-white px-8 md:px-10 font-['Pretendard',sans-serif] text-sm md:text-base font-bold text-[#16140f] transition-all hover:bg-white/90 shadow-lg cursor-pointer"
          >
            Submit Idea
          </button>
        </div>
      </div>
    </div>
  );
}
