import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../i18n";
import type { ExpeditionData, PracticeId } from "../expedition/types";
import { Pictogram } from "../worlds/Pictograms";

/** Points for a right prediction. */
export const PREDICT_POINTS = 10;

interface Prediction {
  options: { id: string; label: string }[];
  answer: string;
  explanation: string;
}

/** Mars gravity in g (CLAUDE.md, rule 1); the catalogue value is preferred when present. */
const MARS_G_FALLBACK = 0.38;

/**
 * One "predict before you look" question per practice, answered from the same real snapshot
 * the practice uses — never a made-up number.
 */
export function usePrediction(id: PracticeId, data: ExpeditionData): Prediction | null {
  const { t, i18n } = useTranslation();
  const fmt = (v: number, d = 2) => formatNumber(v, i18n.language, d);
  const terrain = data.candidateTerrain;
  const base = `steam.predict.${id}`;
  if (id === "observe") {
    const range = (xs: number[]) => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0);
    const pampa = range(terrain.earth_profile_elev_m);
    const jezero = range(terrain.planetary_profile_elev_m);
    return {
      options: [
        { id: "pampa", label: t(`${base}.pampa`) },
        { id: "jezero", label: t(`${base}.jezero`) },
      ],
      answer: pampa >= jezero ? "pampa" : "jezero",
      explanation: t(`${base}.explain`, { pampa: fmt(pampa, 0), jezero: fmt(jezero, 0) }),
    };
  }
  if (id === "measure") {
    const scale = terrain.scale_sensitivity[0];
    if (!scale) return null;
    return {
      options: [
        { id: "pampa", label: t(`${base}.pampa`) },
        { id: "jezero", label: t(`${base}.jezero`) },
      ],
      answer: scale.earth_slope_median_deg > scale.planetary_slope_median_deg ? "pampa" : "jezero",
      explanation: t(`${base}.explain`, { pampa: fmt(scale.earth_slope_median_deg), jezero: fmt(scale.planetary_slope_median_deg) }),
    };
  }
  if (id === "compare") {
    const slope = terrain.slope_distribution;
    return {
      options: [
        { id: "pampa", label: t(`${base}.pampa`) },
        { id: "yungay", label: t(`${base}.yungay`) },
      ],
      answer: slope.wasserstein_distance <= slope.control_yungay_w1 ? "pampa" : "yungay",
      explanation: t(`${base}.explain`, { pampa: fmt(slope.wasserstein_distance), yungay: fmt(slope.control_yungay_w1) }),
    };
  }
  if (id === "different") {
    const g = data.sites.find((s) => s.site_id === "mars_jezero_crater")?.variables.breakage.gravity_g ?? MARS_G_FALLBACK;
    const felt = 10 * g;
    return {
      options: [
        { id: "low", label: t(`${base}.low`, { v: fmt(felt, 0) }) },
        { id: "same", label: t(`${base}.same`) },
        { id: "high", label: t(`${base}.high`, { v: fmt(10 / g, 0) }) },
      ],
      answer: "low",
      explanation: t(`${base}.explain`, { g: fmt(g), v: fmt(felt, 1) }),
    };
  }
  return null;
}

interface PredictChallengeProps {
  id: PracticeId;
  prediction: Prediction;
  choice: string | undefined;
  onChoose: (optionId: string, right: boolean) => void;
  children: ReactNode;
}

/**
 * Predict → observe → explain: the learner bets first, then the practice (the evidence) opens.
 * A wrong bet is welcomed — it is how science learns.
 */
export function PredictChallenge({ id, prediction, choice, onChoose, children }: PredictChallengeProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const answered = choice !== undefined;
  const right = answered && choice === prediction.answer;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby={`predict-${id}`} className={`ckepi-liquid rounded-3xl p-5 sm:p-6 ${answered ? "" : "ckepi-liquid-glow"}`}>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent">
          <Pictogram name="observe" className="h-5 w-5" />
          {t("steam.predict.kicker")}
        </p>
        <h3 id={`predict-${id}`} className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{t(`steam.predict.${id}.q`)}</h3>
        {!answered && <p className="mt-1 text-base text-content-muted">{t("steam.predict.hint")}</p>}

        <div role="group" aria-label={t(`steam.predict.${id}.q`)} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prediction.options.map((option) => {
            const picked = choice === option.id;
            const isAnswer = option.id === prediction.answer;
            const tone = !answered ? "salt" : isAnswer ? "copper" : picked ? "ink" : "salt";
            return (
              <motion.button
                key={option.id}
                type="button"
                disabled={answered}
                aria-pressed={picked}
                onClick={() => onChoose(option.id, option.id === prediction.answer)}
                whileTap={reduceMotion || answered ? undefined : { scale: 0.97 }}
                className={`ckepi-push ckepi-push-${tone} min-h-16 w-full text-lg disabled:cursor-default disabled:opacity-100 ${answered && !isAnswer && !picked ? "opacity-50" : ""}`}
              >
                {answered && isAnswer && <Pictogram name="check" className="h-6 w-6" />}
                {option.label}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {answered && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-1"
              aria-live="polite"
            >
              {choice !== "skip" && (
                <p className={`text-lg font-bold ${right ? "text-status-valid" : "text-status-warn"}`}>
                  {right ? t("steam.predict.right", { n: PREDICT_POINTS }) : t("steam.predict.wrong")}
                </p>
              )}
              <p className="text-base leading-relaxed text-content">{prediction.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!answered && (
          <button
            type="button"
            onClick={() => onChoose("skip", false)}
            className="mt-4 min-h-11 text-sm font-semibold text-content-muted underline-offset-4 hover:text-content hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("steam.predict.skip")}
          </button>
        )}
      </section>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
