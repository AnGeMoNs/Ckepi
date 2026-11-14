import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../i18n";
import type { PlanetaryBody, PlanetarySite, SiteComparisonResponse } from "../../types/analog";
import { computeRoverSlopeComparison } from "../../utils/planetaryPhysics";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

interface ContextualCuriosityStripProps {
  body: PlanetaryBody;
  activeSite?: PlanetarySite;
  comparison?: SiteComparisonResponse | null;
  onOpenLearn: () => void;
}

export function ContextualCuriosityStrip({
  body,
  activeSite,
  comparison,
  onOpenLearn,
}: ContextualCuriosityStripProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const earthSlope = comparison?.variable_deltas.find(
    (d) => d.variable === "slope_deg"
  )?.earth_value;
  const slope = earthSlope ?? activeSite?.variables.independent.slope_deg ?? 15;
  const rover = computeRoverSlopeComparison(100, slope, 0.55);
  const targetNormal = body === "moon" ? rover.moon.normalForceN : rover.mars.normalForceN;
  const earthNormal = rover.earth.normalForceN;

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div className="space-y-0.5 text-xs sm:text-sm">
            <p className="font-semibold text-content">{t("curiosity.title")}</p>
            <p className="text-content-muted">
              {t("curiosity.body", {
                body: t(`bodies.${body}`),
                slope: formatNumber(slope, lang, 1),
                targetNormal: formatNumber(targetNormal, lang, 0),
                earthNormal: formatNumber(earthNormal, lang, 0),
              })}
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={onOpenLearn}>
          <span>{t("curiosity.cta")}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
}
