import { useTranslation } from "react-i18next";

import { CardboardButton } from "../ui/CardboardButton";
import { useNumberFormat } from "./format";
import { TerrainSource } from "./TerrainSource";
import type { ExpeditionData } from "./types";

interface QuestionsPanelProps {
  data: ExpeditionData;
  onOpenScience: () => void;
  onRestart: () => void;
}

/** Close of the Investigate stage: the pitch's three questions, answered with the real numbers and their limits. */
export function QuestionsPanel({ data, onOpenScience, onRestart }: QuestionsPanelProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const slope = data.candidateTerrain.slope_distribution;
  const params = { w1: fmt(slope.wasserstein_distance), yungay: fmt(slope.control_yungay_w1) };

  return (
    <article className="flex flex-col gap-5" aria-labelledby="expedition-questions">
      <header>
        <p className="text-lg font-semibold text-accent">{t("expedition.done.title")}</p>
        <h2 id="expedition-questions" className="text-2xl font-bold leading-tight sm:text-3xl">
          {t("expedition.questions.title")}
        </h2>
      </header>
      <ol className="grid gap-3 md:grid-cols-3">
        {(["q1", "q2", "q3"] as const).map((q, i) => (
          <li key={q} className="ckepi-paper-card-salt flex flex-col gap-2 rounded-2xl p-5">
            <span aria-hidden="true" className="ckepi-cardboard inline-flex h-9 w-9 items-center justify-center rounded-full font-mono font-bold">
              {i + 1}
            </span>
            <p className="text-lg font-bold">{t(`expedition.questions.${q}.q`)}</p>
            <p className="text-base leading-relaxed">{t(`expedition.questions.${q}.a`, params)}</p>
          </li>
        ))}
      </ol>
      <p className="text-lg">{t("expedition.done.text")}</p>
      <p className="text-base font-semibold text-accent">{t("expedition.preselection")}</p>
      <details className="text-sm text-content-muted">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-accent underline-offset-4 hover:underline">
          {t("expedition.sourceLabel")}
        </summary>
        <div className="mt-1 space-y-1">
          <TerrainSource terrain={data.candidateTerrain} />
        </div>
      </details>
      <div className="flex flex-wrap gap-3">
        <CardboardButton tone="primary" size="lg" onClick={onOpenScience} className="font-bold">
          {t("expedition.done.science")}
        </CardboardButton>
        <CardboardButton size="lg" onClick={onRestart}>
          {t("expedition.done.restart")}
        </CardboardButton>
      </div>
    </article>
  );
}
