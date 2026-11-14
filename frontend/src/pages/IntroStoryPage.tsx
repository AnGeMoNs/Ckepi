import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { PaperCutBackground, type PaperCutScene } from "../components/ui/PaperCutBackground";

const STEPS: { key: string; scene: PaperCutScene }[] = [
  { key: "problem", scene: "el-problema" },
  { key: "whatItDoes", scene: "que-hace-ckepi" },
  { key: "finding", scene: "el-hallazgo" },
  { key: "limits", scene: "el-limite-honesto" },
];

interface IntroStoryPageProps {
  onEnter: () => void;
}

export function IntroStoryPage({ onEnter }: IntroStoryPageProps) {
  const { t, i18n } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [index, canSpeak]);

  useEffect(() => () => {
    if (canSpeak) window.speechSynthesis.cancel();
  }, [canSpeak]);

  const go = (next: number) => {
    if (next < 0 || next >= STEPS.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const toggleSpeech = () => {
    if (!canSpeak) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = [t(`story.${step.key}.title`), t(`story.${step.key}.body`)].join(". ");
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = i18n.language.slice(0, 2);
    utterance.lang = lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-CL";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  };

  const offset = reduceMotion ? 0 : 48;

  return (
    <main
      id="main-content"
      onKeyDown={onKeyDown}
      className="relative min-h-[100svh] bg-ckepi-space text-ckepi-salt"
    >
      <PaperCutBackground key={step.scene} scene={step.scene} className="min-h-[100svh]">
        <div className="mx-auto flex min-h-[100svh] max-w-3xl flex-col px-4 pb-16 pt-4 sm:px-6">
          {/* Progress + skip */}
          <div className="flex items-center justify-between gap-3">
            <ol className="flex gap-2" aria-label={t("story.progressLabel")}>
              {STEPS.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index ? "step" : undefined}
                    aria-label={t("story.goToStep", { n: i + 1, total: STEPS.length })}
                    className="flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ckepi-copper"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all ${
                        i === index ? "w-8 bg-ckepi-copper" : "w-2 bg-ckepi-salt/50"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={onEnter}
              className="min-h-11 whitespace-nowrap rounded-full border border-ckepi-salt/30 bg-ckepi-space/70 px-4 text-sm font-medium backdrop-blur-sm transition hover:bg-ckepi-space/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ckepi-copper"
            >
              {t("story.skip")}
            </button>
          </div>

          {/* One idea per screen */}
          <div className="flex flex-1 items-center">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.section
                key={step.key}
                custom={direction}
                initial={{ opacity: 0, x: direction * offset }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -offset }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
                className="ckepi-paper-copy w-full"
                aria-live="polite"
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-ckepi-copper">
                  {t("story.stepOf", { n: index + 1, total: STEPS.length })}
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-2 text-2xl font-bold leading-tight focus:outline-none sm:text-4xl"
                >
                  {t(`story.${step.key}.title`)}
                </h1>
                <p className="mt-4 text-lg leading-relaxed sm:text-xl">{t(`story.${step.key}.body`)}</p>
                {step.key === "finding" && (
                  <p className="mt-4 rounded-lg border border-ckepi-salt/25 px-3 py-2 text-sm text-ckepi-salt/90">
                    {t("story.finding.source")}
                  </p>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => go(index - 1)}
                    disabled={index === 0}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ckepi-salt/40 px-5 font-semibold transition hover:bg-ckepi-salt/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ckepi-copper disabled:opacity-40"
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    {t("story.back")}
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      onClick={onEnter}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ckepi-copper px-6 font-bold text-ckepi-ink shadow-ckepi-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ckepi-salt/70"
                    >
                      {t("story.enter")}
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => go(index + 1)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ckepi-copper px-6 font-bold text-ckepi-ink transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ckepi-salt/70"
                    >
                      {t("story.next")}
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                  {canSpeak && (
                    <button
                      type="button"
                      onClick={toggleSpeech}
                      aria-pressed={speaking}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-medium text-ckepi-salt/90 transition hover:bg-ckepi-salt/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ckepi-copper"
                    >
                      {speaking ? (
                        <VolumeX className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Volume2 className="h-5 w-5" aria-hidden="true" />
                      )}
                      {speaking ? t("story.stopListening") : t("story.listen")}
                    </button>
                  )}
                </div>
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </PaperCutBackground>
    </main>
  );
}
