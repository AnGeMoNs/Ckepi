import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CardboardButton } from "../ui/CardboardButton";
import { LearnCutout, type CutoutName } from "../ui/LearnCutout";
import { useSpeech } from "../../hooks/useSpeech";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";
import type { Level, PracticeId } from "./types";

const CUTOUT: Partial<Record<PracticeId, CutoutName>> = {
  measure: "learn-tilt-plank",
  compare: "learn-bean-piles",
  decide: "learn-rover",
};

interface PracticeShellProps {
  id: PracticeId;
  level: Level;
  pictogram: PictogramName;
  /** Interpolation values for the level text (real numbers from the snapshot). */
  params?: Record<string, string>;
  /** Technical source line(s), shown on demand. */
  source?: ReactNode;
  children: ReactNode;
}

/**
 * Common frame of a practice: what to do (one text per reading level), read-aloud,
 * the interactive piece, the job that does this step, and the source behind the numbers.
 */
export function PracticeShell({ id, level, pictogram, params, source, children }: PracticeShellProps) {
  const { t } = useTranslation();
  const { available, speaking, speak, stop } = useSpeech();
  const base = `expedition.steps.${id}`;
  const title = t(`${base}.title`);
  const text = t(`${base}.text.${level}`, params);

  // A new reading level means a new text: never keep reading the previous one aloud.
  useEffect(() => stop(), [level, stop]);

  return (
    <article className="flex flex-col gap-5" aria-labelledby={`practice-${id}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="ckepi-cardboard inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
            <Pictogram name={pictogram} className="h-7 w-7" />
          </span>
          <div>
            <p className="text-base font-semibold text-accent">{t(`${base}.name`)}</p>
            <h2 id={`practice-${id}`} className="text-2xl font-bold leading-tight sm:text-3xl">
              {title}
            </h2>
          </div>
        </div>
        {available ? (
          <CardboardButton
            tone={speaking ? "active" : "card"}
            onClick={() => (speaking ? stop() : speak(`${title}. ${text}`))}
            aria-pressed={speaking}
          >
            <Pictogram name="listen" className="h-5 w-5" />
            {speaking ? t("expedition.stopListening") : t("expedition.listen")}
          </CardboardButton>
        ) : (
          <p className="max-w-xs text-sm text-content-muted">{t("expedition.noVoice")}</p>
        )}
      </header>

      <div className="flex items-start gap-4">
        <p className="max-w-3xl flex-1 text-lg leading-relaxed sm:text-xl">{text}</p>
        {CUTOUT[id] && <LearnCutout name={CUTOUT[id]} className="hidden h-28 w-28 sm:inline-block" />}
      </div>

      <div>{children}</div>

      <footer className="flex flex-col gap-2 border-t border-border-subtle/40 pt-4 text-base">
        <p className="font-semibold text-content">{t(`${base}.job`)}</p>
        {source && (
          <details className="text-sm text-content-muted">
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-accent underline-offset-4 hover:underline">
              {t("expedition.sourceLabel")}
            </summary>
            <div className="mt-1 space-y-1">{source}</div>
          </details>
        )}
      </footer>
    </article>
  );
}
