import { useTranslation } from "react-i18next";

import { CardboardButton } from "../ui/CardboardButton";
import { PracticeShell } from "./PracticeShell";
import type { ExpeditionData, Level } from "./types";

interface TestCard {
  /** i18n key of the test name. */
  labelKey: string;
  /** Reason key under expedition.steps.decide.reasons. */
  reason: string;
  /** What the evidence says: can it be rehearsed outdoors in the pampa? */
  canTest: boolean;
}

/** Engine keys look like "tests.valid.baseline_instrument_calibration"; the reason id is the last part. */
function reasonOf(testKey: string) {
  return testKey.split(".").pop() ?? "fallback";
}

interface DecidePracticeProps {
  data: ExpeditionData;
  level: Level;
  /** Report the learner's first answer; the mission retains it across stations. */
  onAnswer?: (card: number, value: boolean) => void;
  answers: Readonly<Record<number, boolean>>;
}

/** Decide: yes/no cards built from the engine's own protocol for the candidate cell. */
export function DecidePractice({ data, level, answers, onAnswer }: DecidePracticeProps) {
  const { t, i18n } = useTranslation();
  const base = "expedition.steps.decide";
  const recs = data.candidate.match.engineering_recommendations;

  const cards: TestCard[] = [
    { labelKey: `${base}.routes`, reason: "routes", canTest: true },
    ...recs.valid_tests.map((key) => ({ labelKey: key, reason: reasonOf(key), canTest: true })),
    ...recs.invalid_tests.map((key) => ({ labelKey: key, reason: reasonOf(key), canTest: false })),
  ];

  const reasonText = (reason: string) =>
    i18n.exists(`${base}.reasons.${reason}`) ? t(`${base}.reasons.${reason}`) : t(`${base}.reasons.fallback`);

  return (
    <PracticeShell id="decide" level={level} pictogram="decide" source={<p>{t(`${base}.source`)}</p>}>
      <p className="mb-3 text-lg font-semibold">{t(`${base}.ask`)}</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {cards.map((card, i) => {
          const answer = answers[i];
          const answered = answer !== undefined;
          const right = answered && answer === card.canTest;
          return (
            <li key={card.labelKey} className={`ckepi-liquid flex flex-col gap-3 rounded-3xl p-5 ${answered && right ? "ckepi-liquid-glow" : ""}`}>
              <p className="text-base font-semibold">{t(card.labelKey)}</p>
              <div className="flex gap-2" role="group" aria-label={t(`${base}.ask`)}>
                {([true, false] as const).map((value) => (
                  <CardboardButton
                    key={String(value)}
                    tone={answer === value ? "active" : "card"}
                    aria-pressed={answer === value}
                    onClick={() => {
                      if (answers[i] === undefined) onAnswer?.(i, value);
                    }}
                    className="min-w-16 font-bold"
                  >
                    {value ? t(`${base}.yes`) : t(`${base}.no`)}
                  </CardboardButton>
                ))}
              </div>
              {answered && (
                <div aria-live="polite" className={`text-base ${right ? "text-status-valid" : "text-status-warn"}`}>
                  <p className="font-bold">
                    {right ? t(`${base}.right`) : t(`${base}.wrong`)} {card.canTest ? t(`${base}.verdictYes`) : t(`${base}.verdictNo`)}
                  </p>
                  <p>{reasonText(card.reason)}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PracticeShell>
  );
}
