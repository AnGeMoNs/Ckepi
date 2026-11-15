import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CardboardButton } from "../components/ui/CardboardButton";
import { SHOW_AI_WATERMARKS } from "../config/aiDisclosure";
import { PaperPlanetImage } from "../components/ui/PaperPlanetImage";
import { Pictogram } from "../components/worlds/Pictograms";

/** video → fading (cross-fade into the three-worlds backdrop) → ready (doors) → leaving (chosen door zooms). */
type Phase = "video" | "ready" | "leaving";
type DoorKind = "learn" | "research";

// The cross-fade starts this many seconds before the video ends, so there is never an empty frame.
const CROSSFADE_LEAD_S = 1.2;
const CROSSFADE_S = 1.4;
// The chosen world grows and fades before the next view mounts.
const EXIT_MS = 700;
// If autoplay is blocked or the video stalls, never leave the visitor waiting.
const VIDEO_FALLBACK_MS = 12_000;

const BACKDROP = "/img/backgrounds/ckepi-que-hace-ckepi";

interface HomePageProps {
  onEnter: (target: "explore" | "app") => void;
}

const DOORS: { kind: DoorKind; target: "explore" | "app"; pictogram: "learn" | "research" }[] = [
  { kind: "learn", target: "explore", pictogram: "learn" },
  { kind: "research", target: "app", pictogram: "research" },
];

export function HomePage({ onEnter }: HomePageProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<Phase>(reduceMotion ? "ready" : "video");
  const [chosen, setChosen] = useState<DoorKind | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const firstDoorRef = useRef<HTMLButtonElement | null>(null);

  // Decode the backdrop while the video plays, so the cross-fade never shows a blank frame.
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const img = new Image();
    img.src = `${BACKDROP}-${mobile ? "mobile" : "desktop"}.webp`;
    img.decode().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (phase !== "video") return;
    const video = videoRef.current;
    video?.play().catch(() => setPhase("ready"));
    const timer = window.setTimeout(() => setPhase("ready"), VIDEO_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "ready") return;
    const timer = window.setTimeout(
      () => firstDoorRef.current?.focus({ preventScroll: true }),
      reduceMotion ? 0 : CROSSFADE_S * 1000
    );
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  const startCrossfade = () => setPhase((current) => (current === "video" ? "ready" : current));

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    if (video.currentTime >= video.duration - CROSSFADE_LEAD_S) startCrossfade();
  };

  const skip = () => {
    videoRef.current?.pause();
    startCrossfade();
  };

  const replay = () => {
    const video = videoRef.current;
    if (video) video.currentTime = 0;
    setChosen(null);
    setPhase("video");
  };

  const choose = (kind: DoorKind, target: "explore" | "app") => {
    if (phase === "leaving") return;
    setChosen(kind);
    setPhase("leaving");
    window.setTimeout(() => onEnter(target), reduceMotion ? 150 : EXIT_MS);
  };

  const showVideo = !reduceMotion && phase === "video";
  const showDoors = phase !== "video";

  return (
    <main
      id="main-content"
      className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-ckepi-space text-ckepi-paper"
    >
      {/* Layer 1: the three-worlds paper backdrop, mounted from the start under the video. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        initial={false}
        animate={showDoors ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
        transition={{ duration: reduceMotion ? 0.2 : CROSSFADE_S, ease: "easeOut" }}
      >
        <picture>
          <source media="(max-width: 767px)" srcSet={`${BACKDROP}-mobile.webp`} type="image/webp" />
          <img
            src={`${BACKDROP}-desktop.webp`}
            alt=""
            width={2560}
            height={1440}
            decoding="async"
            className="h-full w-full object-cover object-top md:object-center"
          />
        </picture>
      </motion.div>
      {/* Legibility veil: darker where the text and the doors sit. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-ckepi-space/30 via-ckepi-space/45 to-ckepi-space/85" />

      {/* Layer 2: the intro video fades out over the backdrop instead of cutting. */}
      {!reduceMotion && (
        <motion.video
          ref={videoRef}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          poster="/media/ckepi-home-poster.jpg"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: showVideo ? 1 : 0 }}
          transition={{ duration: CROSSFADE_S, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (!showVideo) videoRef.current?.pause();
          }}
          onTimeUpdate={handleTimeUpdate}
          onEnded={startCrossfade}
          onError={startCrossfade}
        >
          <source src="/media/ckepi-home.webm" type="video/webm" />
          <source src="/media/ckepi-home.mp4" type="video/mp4" />
        </motion.video>
      )}

      {/* Mid-fade veil: bridges the charcoal of the video's last frame and the night blue backdrop. */}
      <AnimatePresence>
        {!reduceMotion && phase === "ready" && (
          <motion.div
            key="bridge"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 bg-ckepi-space"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{ duration: CROSSFADE_S, times: [0, 0.5, 1], ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Top bar: skip / replay, always reachable. */}
      <div className="relative z-10 flex justify-end p-4 sm:p-6">
        {phase === "video" ? (
          <CardboardButton onClick={skip} className="text-sm">
            <Pictogram name="skip" className="h-5 w-5" />
            {t("home.skip")}
          </CardboardButton>
        ) : (
          !reduceMotion &&
          phase === "ready" && (
            <CardboardButton onClick={replay} className="text-sm">
              <Pictogram name="replay" className="h-5 w-5" />
              {t("home.replay")}
            </CardboardButton>
          )
        )}
      </div>

      {/* Layer 3: only the two worlds, centred, as the two ways in. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 md:pt-[16svh]">
        <AnimatePresence>
          {showDoors && (
            <motion.div
              key="intro"
              className="flex w-full max-w-5xl flex-col items-center text-center"
              exit={{ opacity: 0 }}
            >
              {/* No visible title: only the two worlds. The heading stays for screen readers. */}
              <h1 className="sr-only">{t("entry.challenge")}</h1>

              <ul className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:gap-10" aria-label={t("entry.choose")}>
                {DOORS.map(({ kind, target, pictogram }, i) => {
                  const isChosen = chosen === kind;
                  const leaving = phase === "leaving";
                  return (
                    <motion.li
                      key={kind}
                      className="flex justify-center"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 18 }}
                      animate={
                        leaving
                          ? isChosen
                            ? { opacity: 0, scale: reduceMotion ? 1 : 2.4, y: 0 }
                            : { opacity: 0, scale: 0.9, y: 0 }
                          : { opacity: 1, scale: 1, y: 0 }
                      }
                      transition={
                        leaving
                          ? { duration: reduceMotion ? 0.15 : EXIT_MS / 1000, ease: "easeIn" }
                          : { type: "spring", stiffness: 140, damping: 13, delay: reduceMotion ? 0 : 0.85 + i * 0.15 }
                      }
                    >
                      <motion.button
                        ref={i === 0 ? firstDoorRef : undefined}
                        type="button"
                        onClick={() => choose(kind, target)}
                        aria-label={t(kind === "learn" ? "entry.learnAria" : "entry.researchAria")}
                        disabled={leaving}
                        className="group flex flex-col items-center rounded-[2rem] p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ckepi-copper"
                        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      >
                        <span className="relative grid place-items-center">
                          {/* Soft halo that breathes behind the world (opacity/scale only). */}
                          <motion.span
                            aria-hidden="true"
                            className={`absolute inset-[8%] rounded-full blur-2xl ${kind === "learn" ? "bg-ckepi-sulfur/25" : "bg-ckepi-copper/25"}`}
                            animate={reduceMotion ? undefined : { opacity: [0.5, 1, 0.5], scale: [0.92, 1.06, 0.92] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
                          />
                          <motion.span
                            className="relative block"
                            animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: kind === "learn" ? [0, -3, 0] : [0, 3, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: i * 1.2 }}
                          >
                            <PaperPlanetImage planet={kind === "learn" ? "steam" : "science"} className="h-36 w-36 sm:h-56 sm:w-56 lg:h-64 lg:w-64" />
                          </motion.span>
                        </span>
                        <span className="ckepi-cardboard mt-1 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-base font-bold sm:px-5 sm:text-xl">
                          <Pictogram name={pictogram} className="h-6 w-6 sm:h-7 sm:w-7" />
                          {t(kind === "learn" ? "entry.learn" : "entry.research")}
                        </span>
                      </motion.button>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: the AI label always matches what is on screen (video, then the illustration). */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-2 px-4 pb-4 text-xs text-ckepi-paper/80 sm:px-6 sm:text-sm">
        {SHOW_AI_WATERMARKS ? (
          <span className="rounded bg-ckepi-space/80 px-2 py-1 font-semibold uppercase tracking-wide">
            {showVideo ? t("home.aiBadge") : t("home.aiImageBadge")}
          </span>
        ) : (
          <span />
        )}
        <span className="max-w-md text-right">{t("home.credits")}</span>
      </div>
    </main>
  );
}
