import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { HexField } from "../components/home/HexField";

type Phase = "video" | "ready" | "leaving";

// Hero fades first, then the hex wave (0.5 s spread + 0.55 s per cell) uncovers the app.
const EXIT_MS = 1050;
// If autoplay is blocked or the video stalls, never leave the visitor waiting.
const VIDEO_FALLBACK_MS = 12_000;

interface HomePageProps {
  onEnter: () => void;
}

export function HomePage({ onEnter }: HomePageProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<Phase>(reduceMotion ? "ready" : "video");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ctaRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (phase !== "video") return;
    const video = videoRef.current;
    video?.play().catch(() => setPhase("ready"));
    const timer = window.setTimeout(() => setPhase("ready"), VIDEO_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "ready") ctaRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const handleEnter = () => {
    setPhase("leaving");
    window.setTimeout(onEnter, reduceMotion ? 150 : EXIT_MS);
  };

  const replay = () => {
    const video = videoRef.current;
    if (video) video.currentTime = 0;
    setPhase("video");
  };

  return (
    <main
      id="main-content"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-ckepi-space text-ckepi-paper"
    >
      {/* Layer 1: the intro video. It stays on its last frame under the hex field. */}
      {!reduceMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          poster="/media/ckepi-home-poster.jpg"
          aria-hidden="true"
          onEnded={() => setPhase((current) => (current === "video" ? "ready" : current))}
          onError={() => setPhase("ready")}
        >
          <source src="/media/ckepi-home.webm" type="video/webm" />
          <source src="/media/ckepi-home.mp4" type="video/mp4" />
        </video>
      )}
      {reduceMotion && (
        <img
          src="/media/ckepi-home-end.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Layer 2: the paper hex grid takes over from the video's final frame. */}
      <AnimatePresence>
        {phase !== "video" && (
          <motion.div
            key="hex-field"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
          >
            <HexField state={phase === "leaving" ? "exit" : "idle"} reduceMotion={reduceMotion} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar: skip / replay, always reachable. */}
      <div className="relative z-10 flex justify-end p-4 sm:p-6">
        {phase === "video" ? (
          <button
            type="button"
            onClick={() => setPhase("ready")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ckepi-paper/30 bg-ckepi-space/60 px-4 text-sm font-medium backdrop-blur-sm transition hover:bg-ckepi-space/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ckepi-mars"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            {t("home.skip")}
          </button>
        ) : (
          !reduceMotion &&
          phase === "ready" && (
            <button
              type="button"
              onClick={replay}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ckepi-paper/20 bg-ckepi-space/60 px-4 text-sm text-ckepi-paper/80 backdrop-blur-sm transition hover:text-ckepi-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ckepi-mars"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("home.replay")}
            </button>
          )
        )}
      </div>

      {/* Layer 3: brand, promise and the single action. */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10">
        <AnimatePresence>
          {phase === "ready" && (
            <motion.div
              key="hero"
              className="flex max-w-2xl flex-col items-center rounded-3xl bg-ckepi-space/75 px-5 py-8 text-center backdrop-blur-sm sm:px-10"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 160, damping: 24, delay: reduceMotion ? 0 : 0.35 }}
            >
              <h1 className="w-full max-w-md">
                <img
                  src="/img/ckepi/svg/ckepi-horizontal-color-dark.svg"
                  alt="CKEPI"
                  width={900}
                  height={280}
                  className="h-auto w-full drop-shadow-ckepi-logo"
                />
              </h1>
              <p className="mt-4 text-lg font-semibold sm:text-2xl">{t("home.tagline")}</p>
              <p className="mt-2 text-base text-ckepi-paper/80 sm:text-lg">{t("home.question")}</p>
              <button
                ref={ctaRef}
                type="button"
                onClick={handleEnter}
                className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-ckepi-mars px-7 text-base font-bold text-ckepi-space shadow-ckepi-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ckepi-paper/70 sm:text-lg"
              >
                {t("home.cta")}
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </button>
              <p className="mt-6 max-w-lg text-xs text-ckepi-paper/70 sm:text-sm">{t("home.dataNote")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: AI watermark (required while the generated video is visible) and credits. */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-2 px-4 pb-4 text-[11px] text-ckepi-paper/70 sm:px-6 sm:text-xs">
        {/* The AI watermark must be visible whenever AI-generated footage is on screen. */}
        {phase === "video" || reduceMotion ? (
          <span className="rounded bg-ckepi-space/70 px-2 py-1 font-semibold uppercase tracking-wide">
            {t("home.aiBadge")}
          </span>
        ) : (
          <span />
        )}
        <span className="max-w-md text-right">{t("home.credits")}</span>
      </div>
    </main>
  );
}
