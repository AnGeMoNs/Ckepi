import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pictogram } from "../worlds/Pictograms";

import { formatNumber } from "../../i18n";
import type { PlanetaryBody, PlanetarySite, SiteComparisonResponse } from "../../types/analog";
import { computeRoverSlopeComparison, computeWeightComparison } from "../../utils/planetaryPhysics";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

interface ContextualCuriosityStripProps {
  body: PlanetaryBody;
  activeSite?: PlanetarySite;
  comparison?: SiteComparisonResponse | null;
  onOpenLearn: () => void;
}

export const ContextualCuriosityStrip = memo(function ContextualCuriosityStrip({
  body,
  activeSite,
  comparison,
  onOpenLearn,
}: ContextualCuriosityStripProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [factIdx, setFactIdx] = useState(0);

  const facts = useMemo(() => {
    const siteLabel = activeSite ? t(activeSite.name_key) : t(`bodies.${body}`);
    const deltas = comparison?.variable_deltas ?? [];
    const slopeDelta = deltas.find((d) => d.variable === "slope_deg");
    const thermalDelta = deltas.find((d) => d.variable === "diurnal_temp_amplitude_k");
    const roughDelta = deltas.find((d) => d.variable === "topographic_roughness");

    const slope = slopeDelta?.earth_value ?? activeSite?.variables.independent.slope_deg ?? 15;
    const rover = computeRoverSlopeComparison(100, slope, 0.55);
    const targetNormal = body === "moon" ? rover.moon.normalForceN : rover.mars.normalForceN;
    const weight80 = computeWeightComparison(80);

    const list = [
      {
        title: t("curiosity.title"),
        body: t("curiosity.body", {
          body: t(`bodies.${body}`),
          slope: formatNumber(slope, lang, 1),
          targetNormal: formatNumber(targetNormal, lang, 0),
          earthNormal: formatNumber(rover.earth.normalForceN, lang, 0),
        }),
      },
      {
        title: t("curiosity.gravityTitle"),
        body: t("curiosity.gravityBody", {
          body: t(`bodies.${body}`),
          marsN: formatNumber(weight80.mars.weightN, lang, 1),
          moonN: formatNumber(weight80.moon.weightN, lang, 1),
        }),
      },
    ];

    if (thermalDelta) {
      list.push({
        title: t("curiosity.thermalTitle"),
        body: t("curiosity.thermalBody", {
          site: siteLabel,
          planetVal: formatNumber(thermalDelta.planetary_value, lang, 1),
          earthVal: formatNumber(thermalDelta.earth_value, lang, 1),
        }),
      });
    }

    if (roughDelta) {
      list.push({
        title: t("curiosity.roughnessTitle"),
        body: t("curiosity.roughnessBody", {
          site: siteLabel,
          planetVal: formatNumber(roughDelta.planetary_value, lang, 2),
          earthVal: formatNumber(roughDelta.earth_value, lang, 2),
        }),
      });
    }

    return list;
  }, [activeSite, body, comparison, lang, t]);

  const currentFact = facts[factIdx % facts.length];

  // Quick mini-challenge (mass vs weight) grounded in the selected body
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const roverMassKg = 100;
  const roverWeights = computeWeightComparison(roverMassKg);
  const bodyWeight = roverWeights[body];
  const gravityPct = Math.round((bodyWeight.gravityMs2 / roverWeights.earth.gravityMs2) * 100);
  const quizOptions = [
    { id: "a", label: t("quickQuiz.optA") },
    { id: "b", label: t("quickQuiz.optB") },
    { id: "c", label: t("quickQuiz.optC") },
  ];

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="space-y-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5" aria-live="polite">
          <Pictogram name="research" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="space-y-0.5 text-xs sm:text-sm">
            <p className="font-semibold text-content">{currentFact.title}</p>
            <p className="text-content-muted">{currentFact.body}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {facts.length > 1 && (
            <Button
              variant="secondary"
              onClick={() => setFactIdx((prev) => (prev + 1) % facts.length)}
            >
              <Pictogram name="replay" className="h-3.5 w-3.5" />
              <span>{t("curiosity.nextFact")}</span>
            </Button>
          )}
          <Button
            variant="secondary"
            aria-expanded={quizOpen}
            aria-controls="quick-quiz"
            onClick={() => setQuizOpen((prev) => !prev)}
          >
            <Pictogram name="decide" className="h-5 w-5" />
            <span>{t("quickQuiz.cta")}</span>
          </Button>
          <Button variant="primary" onClick={onOpenLearn}>
            <span>{t("curiosity.cta")}</span>
            <Pictogram name="chevronDown" className="h-4 w-4 -rotate-90" />
          </Button>
        </div>
      </div>

      {quizOpen && (
        <fieldset
          id="quick-quiz"
          className="space-y-2 rounded-xl border border-border-subtle bg-surface p-3"
        >
          <legend className="px-1 text-sm font-semibold text-content">
            {t("quickQuiz.question", { body: t(`bodies.${body}`) })}
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {quizOptions.map((opt) => {
              const selected = quizAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setQuizAnswer(opt.id)}
                  className={`min-h-11 rounded-lg border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    selected
                      ? "border-accent bg-accent/10 font-semibold text-content"
                      : "border-border-subtle bg-surface-elevated text-content-muted hover:bg-surface-muted hover:text-content"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div aria-live="polite">
            {quizAnswer && (
              <p
                className={`rounded-lg border p-2.5 text-xs ${
                  quizAnswer === "b"
                    ? "border-status-valid/40 bg-status-valid/10 text-content"
                    : "border-status-warn/40 bg-status-warn/10 text-content"
                }`}
              >
                <strong>
                  {quizAnswer === "b" ? t("learn.correctLabel") : t("quickQuiz.tryAgain")}
                </strong>{" "}
                {quizAnswer === "b" &&
                  t("quickQuiz.explanation", {
                    body: t(`bodies.${body}`),
                    pct: gravityPct,
                    mass: roverMassKg,
                    earthN: formatNumber(roverWeights.earth.weightN, lang, 0),
                    bodyN: formatNumber(bodyWeight.weightN, lang, 0),
                  })}
              </p>
            )}
          </div>
        </fieldset>
      )}
      </CardContent>
    </Card>
  );
});
