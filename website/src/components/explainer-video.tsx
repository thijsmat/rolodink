"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type Labels = {
  video: string;
  play: string;
  pause: string;
  soundOn: string;
  soundOff: string;
};

type Captions = {
  src: string;
  lang: string;
  label: string;
};

type Props = Readonly<{
  src: string;
  poster: string;
  captions: Captions;
  labels: Labels;
}>;

// De uitlegvideo op de homepage. Hij speelt gedempt zodra hij grotendeels in beeld
// is en pauzeert als hij uit beeld raakt; wie minder beweging wil
// (prefers-reduced-motion) start hem zelf. De hele video is de afspeel- en
// pauzeknop. Het geluid gaat alleen op verzoek aan, en de eerste keer begint de
// video dan vooraan, zodat je het hele verhaal hoort. Er wordt niet gesproken; de
// ondertiteling beschrijft het geluid, voor wie ondertiteling aan heeft staan.
export function ExplainerVideo({ src, poster, captions, labels }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const pausedByVisitor = useRef(false);
  const soundStarted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.muted = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
        else if (!pausedByVisitor.current && !reducedMotion.matches) el.play().catch(() => {});
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const el = video.current;
    if (!el) return;
    pausedByVisitor.current = !el.paused;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const toggleSound = () => {
    const el = video.current;
    if (!el) return;
    const nextMuted = !el.muted;
    el.muted = nextMuted;
    setMuted(nextMuted);
    if (nextMuted) return;
    if (!soundStarted.current) {
      soundStarted.current = true;
      el.currentTime = 0;
    }
    pausedByVisitor.current = false;
    el.play().catch(() => {});
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-azure/10 bg-[#F7F5F0] shadow-xl sm:rounded-2xl sm:shadow-2xl">
      <video
        ref={video}
        className="absolute inset-0 h-full w-full"
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload="none"
        aria-label={labels.video}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <track kind="captions" src={captions.src} srcLang={captions.lang} label={captions.label} />
      </video>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? labels.pause : labels.play}
        className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold"
      >
        <span
          className={cn(
            "grid h-14 w-14 place-items-center rounded-full bg-[#1B2951]/80 text-white shadow-lg backdrop-blur transition-opacity sm:h-16 sm:w-16",
            playing && "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
        </span>
      </button>
      <button
        type="button"
        onClick={toggleSound}
        className="absolute bottom-2 right-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1B2951]/80 px-3 text-xs font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-[#1B2951] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:bottom-5 sm:right-5 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
      >
        {muted ? <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        {muted ? labels.soundOn : labels.soundOff}
      </button>
    </div>
  );
}
