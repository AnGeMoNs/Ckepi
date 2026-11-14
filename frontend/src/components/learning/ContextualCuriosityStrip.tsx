import { memo, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5" aria-live="polite">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
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
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("curiosity.nextFact")}</span>
            </Button>
          )}
          <Button variant="primary" onClick={onOpenLearn}>
            <span>{t("curiosity.cta")}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
