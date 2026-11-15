import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getJezeroComparison } from "../../api/localData";
import { CardboardButton } from "../ui/CardboardButton";
import type { PlanetarySite } from "../../types/analog";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";
import { ComparePractice } from "./ComparePractice";
import { DecidePractice } from "./DecidePractice";
import { DifferentPractice } from "./DifferentPractice";
import { MeasurePractice } from "./MeasurePractice";
import { ObservePractice } from "./ObservePractice";
import { QuestionsPanel } from "./QuestionsPanel";
import { MissionCertificate } from "../steam/MissionCertificate";
import { MissionRoute } from "../steam/MissionRoute";
import { PREDICT_POINTS, PredictChallenge, usePrediction } from "../steam/PredictChallenge";
import { CANDIDATE_CELL, NEGATIVE_CELL, type ExpeditionData, type Level, type PracticeId, type ScreenId, type Stage } from "./types";

/** Pitch structure: Look → Compare → Investigate. The five practices live inside these three stages. */
const SCREENS: { id: ScreenId; stage: Stage }[] = [
  { id: "observe", stage: "look" },
  { id: "measure", stage: "compare" },
  { id: "compare", stage: "compare" },
  { id: "different", stage: "compare" },
  { id: "decide", stage: "investigate" },
  { id: "questions", stage: "investigate" },
];


const LEVELS: Level[] = ["kid", "teen", "adult"];

/** Mission stations: each practice is a badge; the last stop is the certificate. */
const STATION_PICTO: Record<ScreenId, PictogramName> = {
  observe: "observe",
  measure: "measure",
  compare: "compare",
  different: "notSimilar",
  decide: "decide",
  questions: "research",
};
const PRACTICES: { id: PracticeId; pictogram: PictogramName }[] = [
  { id: "observe", pictogram: "observe" },
  { id: "measure", pictogram: "measure" },
  { id: "compare", pictogram: "compare" },
  { id: "different", pictogram: "notSimilar" },
  { id: "decide", pictogram: "decide" },
];
/** Points for each decision card judged right. */
const DECIDE_POINTS = 5;

type Snapshot = Omit<ExpeditionData, "sites">;
type Load = { state: "loading" } | { state: "error" } | { state: "ready"; snapshot: Snapshot };

interface ExpeditionProps {
  sites: PlanetarySite[];
  onOpenScience: () => void;
}

/** Scientific-literacy expedition with real 30 m data; works from the static snapshot, without a backend. */
export function Expedition({ sites, onOpenScience }: ExpeditionProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [level, setLevel] = useState<Level>("teen");
  const [index, setIndex] = useState(0);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Mission state lives only in memory: nothing about the learner is stored.
  const [earned, setEarned] = useState<Set<string>>(() => new Set());
  const [points, setPoints] = useState(0);
  const [choices, setChoices] = useState<Partial<Record<PracticeId, string>>>({});
  const [decisions, setDecisions] = useState<Record<number, boolean>>({});
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const controller = new AbortController();
    setLoad({ state: "loading" });
    Promise.all([
      getJezeroComparison(CANDIDATE_CELL, controller.signal),
      // The negative case is optional: the lesson still works without it.
      getJezeroComparison(NEGATIVE_CELL, controller.signal).catch(() => null),
    ])
      .then(([candidate, negative]) => {
        if (!candidate.statistical_distribution) throw new Error("missing terrain comparison");
        setLoad({
          state: "ready",
          snapshot: {
            candidate,
            candidateTerrain: candidate.statistical_distribution,
            negativeTerrain: negative?.statistical_distribution ?? null,
          },
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoad({ state: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  // The catalogue may arrive after the snapshot; merging here avoids reloading the lesson.
  const data = useMemo<ExpeditionData | null>(
    () => (load.state === "ready" ? { ...load.snapshot, sites } : null),
    [load, sites]
  );

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= SCREENS.length) return;
      // Moving forward from a practice stamps its badge.
      const leaving = SCREENS[index]?.id;
      if (next > index && leaving && leaving !== "questions" && choices[leaving] !== undefined) setEarned((prev) => new Set(prev).add(leaving));
      setDirection(next >= index ? 1 : -1);
      setIndex(next);
      // Move focus to the new practice so keyboard and screen-reader users follow the change.
      window.requestAnimationFrame(() => {
        stageRef.current?.focus({ preventScroll: true });
        stageRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    },
    [reduceMotion, index, choices]
  );

  /** Starts the route again, optionally one reading level up (the difficulty ladder). */
  const restart = (nextLevel?: Level) => {
    if (nextLevel) setLevel(nextLevel);
    setEarned(new Set());
    setPoints(0);
    setChoices({});
    setDecisions({});
    setDirection(-1);
    setIndex(0);
  };

  const choose = (id: PracticeId, option: string, right: boolean) => {
    setChoices((prev) => (prev[id] === undefined ? { ...prev, [id]: option } : prev));
    if (right && choices[id] === undefined) setPoints((p) => p + PREDICT_POINTS);
  };

  const recs = data?.candidate.match.engineering_recommendations;
  const decideCards = recs ? 1 + recs.valid_tests.length + recs.invalid_tests.length : 0;
  const maxPoints = 4 * PREDICT_POINTS + decideCards * DECIDE_POINTS;

  const screen = SCREENS[index];

  return (
    <section className="flex flex-col gap-6" aria-labelledby="expedition-title">
      <header className="flex flex-col gap-3">
        <h1 id="expedition-title" className="text-3xl font-bold leading-tight sm:text-5xl">
          {t("expedition.title")}
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-content-muted sm:text-xl">{t("expedition.lead")}</p>
      </header>

      {/* Reading depth, never identity: nobody is asked their age. */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("expedition.levelLabel")}>
        <span className="mr-1 text-base font-semibold">{t("expedition.levelLabel")}</span>
        {LEVELS.map((key) => (
          <CardboardButton key={key} tone={level === key ? "active" : "card"} aria-pressed={level === key} onClick={() => { if (key !== level) restart(key); }}>
            {t(`expedition.levels.${key}`)}
          </CardboardButton>
        ))}
      </div>

      {/* The mission route (Earth → Mars) and the score: badges and science points. */}
      <MissionRoute
        stations={SCREENS.map((sc) => ({ id: sc.id, label: sc.id === "questions" ? t("steam.route.finish") : t(`expedition.steps.${sc.id}.name`), pictogram: STATION_PICTO[sc.id] }))}
        current={index}
        earned={earned}
        onGo={go}
      />
      <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-sm sm:text-base" aria-live="polite">
        <span className="ckepi-liquid inline-flex min-h-11 items-center gap-2 rounded-full px-4">
          <Pictogram name="research" className="h-5 w-5 text-accent" />
          <motion.span key={points} initial={reduceMotion ? false : { scale: 1.4 }} animate={{ scale: 1 }} className="font-semibold tabular-nums">{points}</motion.span>
          {t("steam.score.points")}
        </span>
        <span className="ckepi-liquid inline-flex min-h-11 items-center gap-2 rounded-full px-4">
          <Pictogram name="hexCell" className="h-5 w-5 text-accent" />
          {t("steam.score.badges", { n: PRACTICES.filter((p) => earned.has(p.id)).length, total: PRACTICES.length })}
        </span>
      </div>

      <div ref={stageRef} tabIndex={-1} className="scroll-mt-4 rounded-[2rem] focus:outline-none">
        {load.state === "loading" && (
          <p className="ckepi-liquid rounded-3xl p-6 text-lg" role="status">
            {t("expedition.loading")}
          </p>
        )}
        {load.state === "error" && (
          <div className="ckepi-liquid flex flex-wrap items-center gap-4 rounded-3xl p-6" role="alert">
            <p className="text-lg">{t("expedition.error")}</p>
            <CardboardButton onClick={() => setAttempt((n) => n + 1)}>{t("expedition.retry")}</CardboardButton>
          </div>
        )}
        {/* Stations change like a 3D carousel: the card turns away to one side as the next turns in. */}
        {data && (
          <div className="[perspective:1600px]">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={screen.id}
              custom={direction}
              variants={{
                enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: `${dir * 40}%`, rotateY: dir * -28, scale: 0.86 }),
                center: { opacity: 1, x: "0%", rotateY: 0, scale: 1 },
                exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: `${dir * -40}%`, rotateY: dir * 28, scale: 0.86 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 220, damping: 26 }}
              className="ckepi-liquid rounded-[2rem] p-4 sm:p-8"
            >
              {screen.id === "observe" && <Predicted id="observe" data={data} choice={choices.observe} onChoose={choose}><ObservePractice data={data} level={level} /></Predicted>}
              {screen.id === "measure" && <Predicted id="measure" data={data} choice={choices.measure} onChoose={choose}><MeasurePractice data={data} level={level} /></Predicted>}
              {screen.id === "compare" && <Predicted id="compare" data={data} choice={choices.compare} onChoose={choose}><ComparePractice data={data} level={level} /></Predicted>}
              {screen.id === "different" && <Predicted id="different" data={data} choice={choices.different} onChoose={choose}><DifferentPractice data={data} level={level} /></Predicted>}
              {screen.id === "decide" && <DecidePractice data={data} level={level} answers={decisions} onAnswer={(card, value) => {
                if (decisions[card] !== undefined) return;
                const updated = { ...decisions, [card]: value };
                setDecisions(updated);
                const validCount = data.candidate.match.engineering_recommendations.valid_tests.length;
                if (value === (card <= validCount)) setPoints((p) => p + DECIDE_POINTS);
                if (Object.keys(updated).length === decideCards) setEarned((prev) => new Set(prev).add("decide"));
              }} />}
              {screen.id === "questions" && (
                <div className="flex flex-col gap-8">
                  <MissionCertificate
                    practices={PRACTICES}
                    earned={earned}
                    points={points}
                    maxPoints={maxPoints}
                    level={level}
                    nextLevel={LEVELS[LEVELS.indexOf(level) + 1]}
                    terrain={data.candidateTerrain}
                    onLevelUp={(next) => restart(next)}
                    onOpenScience={onOpenScience}
                    onRestart={() => restart()}
                  />
                  <QuestionsPanel data={data} onOpenScience={onOpenScience} onRestart={() => restart()} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        )}
      </div>

      {data && screen.id !== "questions" && (
        <div className="flex items-center justify-between gap-3">
          <CardboardButton size="lg" onClick={() => go(index - 1)} disabled={index === 0}>
            {t("expedition.prev")}
          </CardboardButton>
          <CardboardButton tone="primary" size="lg" onClick={() => go(index + 1)} className="font-bold">
            {index === SCREENS.length - 2 ? t("expedition.finish") : t("expedition.next")}
          </CardboardButton>
        </div>
      )}
    </section>
  );
}

/** A practice behind its "predict first" question (when the practice has one). */
function Predicted({ id, data, choice, onChoose, children }: { id: PracticeId; data: ExpeditionData; choice: string | undefined; onChoose: (id: PracticeId, option: string, right: boolean) => void; children: ReactNode }) {
  const prediction = usePrediction(id, data);
  if (!prediction) return <>{children}</>;
  return (
    <PredictChallenge id={id} prediction={prediction} choice={choice} onChoose={(option, right) => onChoose(id, option, right)}>
      {children}
    </PredictChallenge>
  );
}
