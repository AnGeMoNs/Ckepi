import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getJezeroComparison } from "../../api/localData";
import { formatNumber } from "../../i18n";
import type { DistributionHistogram, SiteComparisonResponse } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CopernicusNotice } from "../ui/CopernicusNotice";
import { MeasurementCard } from "../ui/MeasurementCard";
import { LearnDialog } from "../worlds/LearnDialog";
import { Pictogram } from "../worlds/Pictograms";
import { TerrainDistributionPanel } from "./TerrainDistributionPanel";

function SlopeGraphic({ histogram, control = false }: { histogram: DistributionHistogram; control?: boolean }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const earth = control ? histogram.control_yungay_density : histogram.earth_density;
  const max = Math.max(...earth, ...histogram.planetary_density, 1e-9);
  const slot = 300 / histogram.bin_centers.length;
  return <span className="flex h-40 flex-col justify-center p-3"><svg viewBox="0 0 320 115" className="w-full" role="img" aria-label={t("science.card.shapeLegend")}>
    {histogram.bin_centers.map((_, i) => <g key={i}><motion.rect x={10 + i * slot} width={slot / 2 - 1} className="fill-planet-mars" initial={reducedMotion ? false : { y: 100, height: 0 }} animate={{ y: 100 - histogram.planetary_density[i] / max * 85, height: histogram.planetary_density[i] / max * 85 }} transition={{ duration: reducedMotion ? 0 : 0.35 }} /><motion.rect x={10 + i * slot + slot / 2} width={slot / 2 - 1} className="fill-status-valid" initial={reducedMotion ? false : { y: 100, height: 0 }} animate={{ y: 100 - earth[i] / max * 85, height: earth[i] / max * 85 }} transition={{ duration: reducedMotion ? 0 : 0.35 }} /></g>)}
    <line x1="10" y1="100" x2="310" y2="100" className="stroke-content-muted" />
  </svg><span className="block text-xs leading-snug text-content-muted">{t("science.card.shapeLegend")}</span></span>;
}

/** Measured DEM comparisons and separate planetary reference values. */
export function VerifiedTerrainDemo() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<SiteComparisonResponse[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [details, setDetails] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [showSteamModal, setShowSteamModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    Promise.all([
      getJezeroComparison("83b224fffffffff", controller.signal),
      getJezeroComparison("83b221fffffffff", controller.signal),
    ]).then((results) => {
      if (results.some((item) => !item.statistical_distribution)) throw new Error("Missing measured comparison");
      if (!controller.signal.aborted) setData(results);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);

  const distribution = data?.[0]?.statistical_distribution;
  const negative = data?.[1]?.statistical_distribution;
  const number = (value: number) => formatNumber(value, i18n.language, 2);
  const select = (key: string) => setActiveCard((current) => current === key ? null : key);
  const focusNegative = activeCard === "negative";

  return (
    <section className="ckepi-liquid space-y-6 rounded-[2rem] p-5 sm:p-8" aria-labelledby="verified-comparison-title">
      <header className="flex flex-col items-center gap-4 text-center">
        <img src="/img/science-accessories/ckepi-icon-slope.webp" alt="" width={80} height={80} draggable={false} className="h-16 w-16 object-contain drop-shadow-ckepi-logo" />
        <div className="space-y-2">
          <h2 id="verified-comparison-title" className="text-2xl font-bold tracking-tight sm:text-3xl">{t("product.demoTitle")}</h2>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-content-muted sm:text-base">{t("product.demoNote")}</p>
          <div className="flex flex-wrap items-center justify-center gap-2"><Badge variant="accent">30 m · MRO CTX / GLO-30</Badge><span className="text-sm text-content-muted">{t("product.measurementHint")}</span></div>
        </div>
        <Button variant="secondary" onClick={() => setShowSteamModal(true)}><Pictogram name="learn" className="h-5 w-5" />{t("product.steamWorkshop")}</Button>
      </header>
      <div className="space-y-5">
        {failed ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-break/40 bg-status-break/10 p-3 text-sm text-status-break"><p>{t("product.demoError")}</p><Button onClick={() => setAttempt((n) => n + 1)}>{t("controls.retry")}</Button></div>
        ) : !distribution || !negative ? (
          <p className="py-4 text-sm text-content-muted" role="status">{t("product.loading")}</p>
        ) : (
          <LayoutGroup id="verified-terrain-measurements">
            <div className="space-y-3">
              <h3 className="text-center text-lg font-bold">{t("product.slopeDimension")}</h3>
              <p className="text-center text-sm text-content-muted">{t("product.lowerIsCloser")}</p>
              <div className="grid items-start gap-3 md:grid-cols-3">
                <MeasurementCard icon="slope" tone="candidate" label={t("product.demo.pampa")} value={number(distribution.slope_distribution.wasserstein_distance)} unit="°" active={activeCard === "candidate"} onSelect={() => select("candidate")}
                  artwork="/img/terrain-art/ckepi-map-atacama.webp" chart={<SlopeGraphic histogram={distribution.slope_distribution} />}
                  context={`${t("product.confidence95")}: [${number(distribution.slope_distribution.w1_ci_95[0])}°, ${number(distribution.slope_distribution.w1_ci_95[1])}°] · H3 83b224`}
                  detail={t("product.candidateDetail", { ratio: number(distribution.slope_distribution.control_yungay_w1 / distribution.slope_distribution.wasserstein_distance) })} />
                <MeasurementCard icon="slope" label={t("product.demo.yungay")} value={number(distribution.slope_distribution.control_yungay_w1)} unit="°" active={activeCard === "control"} onSelect={() => select("control")} artwork="/img/planets/ckepi-planet-earth.webp" chart={<SlopeGraphic histogram={distribution.slope_distribution} control />} context={t("product.classicControl")} detail={t("product.controlExplanation")} />
                <MeasurementCard icon="slope" tone="limit" label={t("product.demo.negative")} value={number(negative.slope_distribution.wasserstein_distance)} unit="°" active={activeCard === "negative"} onSelect={() => select("negative")} artwork="/img/science-accessories/ckepi-icon-relief.webp" chart={<SlopeGraphic histogram={negative.slope_distribution} />} context={`${t("product.negativeCase")} · H3 83b221`} detail={t("product.negativeExplanation")} />
              </div>
            </div>
            <details className="space-y-3">
              <summary className="ckepi-liquid flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 text-base font-bold [&::-webkit-details-marker]:hidden"><img src="/img/science-accessories/ckepi-icon-gravity.webp" alt="" width={40} height={40} className="h-9 w-9 object-contain" />{t("product.breakageDimension")}</summary>
              <div className="grid grid-cols-2 items-start gap-3 xl:grid-cols-4">
                <MeasurementCard icon="gravity" label={t("variables.gravity_g.label")} value={number(0.38)} unit="g" active={activeCard === "gravity"} onSelect={() => select("gravity")} context={t("product.versusEarth", { value: `${number(1)} g` })} detail={t("product.gravityDetail")} />
                <MeasurementCard icon="atmosphere" label={t("variables.atm_pressure_mbar.label")} value={`~${number(0.6)}`} unit="kPa CO₂" active={activeCard === "atmosphere"} onSelect={() => select("atmosphere")} context={t("product.versusEarth", { value: `${number(101.3)} kPa` })} detail={t("product.atmosphereDetail")} />
                <MeasurementCard icon="radiation" label={t("variables.radiation_msv_yr.label")} value="~230" unit={t("product.radiationUnit")} active={activeCard === "radiation"} onSelect={() => select("radiation")} context="Curiosity / RAD" detail={t("product.radiationDetail")} />
                <MeasurementCard icon="temperature" label={t("variables.diurnal_temp_amplitude_k.label")} value="~80–100" unit="K" active={activeCard === "temperature"} onSelect={() => select("temperature")} context={t("product.thermalReference")} detail={t("product.temperatureDetail")} />
              </div>
              <p className="text-sm leading-relaxed text-content-muted">{t("product.physicalLimit")}</p>
            </details>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button variant="secondary" onClick={() => setDetails((open) => !open)} aria-expanded={details}>
                <Pictogram name="chevronDown" className={`h-5 w-5 transition-transform ${details ? "rotate-180" : ""}`} />{t(details ? "product.hideEvidence" : "product.showEvidence")}
              </Button>
              <Button variant="secondary" onClick={() => setShowSteamModal(true)}><Pictogram name="info" className="h-5 w-5" />{t("product.explainAnalysis")}</Button>
            </div>
            {details && <div className="pt-2"><TerrainDistributionPanel distribution={focusNegative ? negative : distribution} body="mars" targetName={t("sites.mars_jezero_crater.name")} earthName={t(focusNegative ? "product.demo.negative" : "product.demo.pampa")} /></div>}
            <CopernicusNotice className="text-center" />
          </LayoutGroup>
        )}
      </div>
      {showSteamModal && <LearnDialog world="mars" sites={[]} onClose={() => setShowSteamModal(false)} />}
    </section>
  );
}
