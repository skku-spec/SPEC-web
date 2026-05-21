"use client";

import { useEffect, useRef, useState } from "react";

export function IdeathonScrollHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= 6.5) {
        video.pause();
        video.currentTime = 6.5;
        setVideoEnded(true);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: "#000000" }}>
      <video
        ref={videoRef}
        src="/videos/IDEATHON.mp4"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Submit Idea overlay — fades in after video ends */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          opacity: videoEnded ? 1 : 0,
          transition: "opacity 1s ease",
          pointerEvents: videoEnded ? "auto" : "none",
        }}
      >
        <div
          style={{
            transform: videoEnded ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 1s ease, transform 1s ease",
          }}
          className="flex flex-col items-center gap-6 text-center px-6"
        >
          <a
            href="#submit"
            className="inline-flex h-14 items-center justify-center rounded-md bg-white px-10 font-['Pretendard',sans-serif] text-base font-bold text-[#16140f] transition-all hover:bg-white/90 shadow-lg mt-24"
          >
            Submit Idea
          </a>
        </div>
      </div>
    </div>
  );
}
