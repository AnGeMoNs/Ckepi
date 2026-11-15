import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ScoreGauge } from "../explore/ScoreGauge";
import { Pictogram } from "../worlds/Pictograms";

import { formatNumber, formatPercent } from "../../i18n";
import type { AnalogMatchItem, PlanetarySite } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface UnexpectedDiscoverySpotlightProps {
  matches: AnalogMatchItem[];
  totalEvaluated: number;
  selectedH3: string | null;
  excludeBenchmarks: boolean;
  site?: PlanetarySite;
  onSelectCell: (h3Index: string) => void;
  onToggleExcludeBenchmarks: (next: boolean) => void;
}

function getTopDrivers(item: AnalogMatchItem): Array<[string, number]> {
  return [
    ...Object.entries(item.iv_similarity_breakdown),
    ...Object.entries(item.dv_similarity_breakdown),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

export function UnexpectedDiscoverySpotlight({
  matches,
  totalEvaluated,
  selectedH3,
  excludeBenchmarks,
  site,
  onSelectCell,
  onToggleExcludeBenchmarks,
}: UnexpectedDiscoverySpotlightProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const stats = useMemo(() => {
    const discoveries = matches.filter((m) => !m.is_benchmark);
    const benchmarks = matches.filter((m) => m.is_benchmark);
    const paretoDiscoveries = discoveries.filter((m) => m.is_pareto_optimal);
    return {
      discoveries,
      benchmarks,
      topDiscovery: discoveries[0] ?? null,
      topBenchmark: benchmarks[0] ?? null,
      otherDiscoveries: discoveries.slice(1, 4),
      paretoDiscoveryCount: paretoDiscoveries.length,
    };
  }, [matches]);

  if (matches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <img src="/img/science-accessories/ckepi-pin-location.webp" alt="" width={64} height={64} draggable={false} className="h-12 w-12 shrink-0 object-contain drop-shadow-ckepi-logo sm:h-14 sm:w-14" />
          <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{t("discoverySpotlight.title")}</CardTitle>
            <Badge variant="valid">
              {t("discoverySpotlight.candidatesBadge", {
                count: stats.discoveries.length,
                total: formatNumber(totalEvaluated, lang, 0),
              })}
            </Badge>
            {stats.paretoDiscoveryCount > 0 && (
              <Badge variant="accent">
                {t("discoverySpotlight.paretoBadge", {
                  count: stats.paretoDiscoveryCount,
                })}
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-content-muted">
            {t("discoverySpotlight.subtitle", {
              target: site ? t(site.name_key) : t("bodies.mars"),
            })}
          </p>
          </div>
        </div>

        <Button
          variant={excludeBenchmarks ? "primary" : "secondary"}
          onClick={() => onToggleExcludeBenchmarks(!excludeBenchmarks)}
        >
          <Pictogram name="research" className="h-5 w-5" />
          <span>
            {excludeBenchmarks
              ? t("discoverySpotlight.showBenchmarksAction")
              : t("discoverySpotlight.onlyDiscoveriesAction")}
          </span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Top Unexpected Discovery */}
          <div className="ckepi-liquid ckepi-liquid-glow flex flex-col justify-between space-y-4 rounded-3xl p-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-status-valid">
                  <img src="/img/science-accessories/ckepi-pin-location.webp" alt="" width={32} height={32} className="h-7 w-7 object-contain" />
                  {t("discoverySpotlight.topUnexpectedLabel")}
                </span>
                {stats.topDiscovery && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {stats.topDiscovery.is_pareto_optimal && (
                      <Badge variant="valid">{t("map.paretoBadge")}</Badge>
                    )}
                    <span className="font-mono text-3xl font-semibold tabular-nums text-content">
                      {formatPercent(stats.topDiscovery.combined_score, lang)}
                    </span>
                  </div>
                )}
              </div>

              {stats.topDiscovery ? (
                <>
                  <div>
                    <p className="text-lg font-bold text-content sm:text-xl">
                      {stats.topDiscovery.known_analog_name ?? t(stats.topDiscovery.region_key)}
                    </p>
                    <p className="text-xs text-content-muted">
                      {t(stats.topDiscovery.biome_key)} · {stats.topDiscovery.country_code} ·{" "}
                      <span className="font-mono">{stats.topDiscovery.earth_cell_h3}</span> (
                      {formatNumber(stats.topDiscovery.coordinates.lat, lang, 2)}°,{" "}
                      {formatNumber(stats.topDiscovery.coordinates.lon, lang, 2)}°)
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <ScoreGauge label="S_ind" value={stats.topDiscovery.s_ind} />
                    <ScoreGauge label="S_dep" value={stats.topDiscovery.s_dep} />
                    <ScoreGauge label="R_break" value={stats.topDiscovery.r_break_overall} tone="break" />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {getTopDrivers(stats.topDiscovery).map(([varKey, score]) => (
                      <Badge key={varKey} variant="default">
                        {t(`variables.${varKey}.label`)}: {formatPercent(score, lang)}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-content-muted">
                  {t("discoverySpotlight.noUnexpectedHint")}
                </p>
              )}
            </div>

            {stats.topDiscovery && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant={selectedH3 === stats.topDiscovery.earth_cell_h3 ? "primary" : "secondary"}
                  onClick={() => {
                    if (stats.topDiscovery) onSelectCell(stats.topDiscovery.earth_cell_h3);
                  }}
                >
                  <Pictogram name="observe" className="h-5 w-5" />
                  <span>
                    {selectedH3 === stats.topDiscovery.earth_cell_h3
                      ? t("discoverySpotlight.currentlyInspecting")
                      : t("discoverySpotlight.inspectCandidate")}
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* Canonical Benchmark Control Reference */}
          <div className="ckepi-liquid flex flex-col justify-between space-y-4 rounded-3xl p-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-content-muted">
                  <img src="/img/science-accessories/ckepi-icon-relief.webp" alt="" width={32} height={32} className="h-7 w-7 object-contain" />
                  {t("discoverySpotlight.canonicalControlLabel")}
                </span>
                {stats.topBenchmark && (
                  <span className="font-mono text-3xl font-semibold tabular-nums text-content-muted">
                    {formatPercent(stats.topBenchmark.combined_score, lang)}
                  </span>
                )}
              </div>

              {stats.topBenchmark ? (
                <>
                  <div>
                    <p className="text-lg font-bold text-content sm:text-xl">
                      {stats.topBenchmark.known_analog_name ?? t(stats.topBenchmark.region_key)}
                    </p>
                    <p className="text-xs text-content-muted">
                      {t(stats.topBenchmark.biome_key)} · {stats.topBenchmark.country_code} ·{" "}
                      <span className="font-mono">{stats.topBenchmark.earth_cell_h3}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <ScoreGauge label="S_ind" value={stats.topBenchmark.s_ind} />
                    <ScoreGauge label="S_dep" value={stats.topBenchmark.s_dep} />
                    <ScoreGauge label="R_break" value={stats.topBenchmark.r_break_overall} tone="break" />
                  </div>

                  <p className="text-xs leading-relaxed text-content-muted">
                    {stats.topDiscovery &&
                    stats.topDiscovery.combined_score >= stats.topBenchmark.combined_score - 0.03
                      ? t("discoverySpotlight.discoveryComparableNote")
                      : t("discoverySpotlight.benchmarkReferenceNote")}
                  </p>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-content-muted">
                  {t("discoverySpotlight.benchmarksExcludedNote")}
                </p>
              )}
            </div>

            {stats.topBenchmark ? (
              <div>
                <Button
                  variant={selectedH3 === stats.topBenchmark.earth_cell_h3 ? "primary" : "secondary"}
                  onClick={() => {
                    if (stats.topBenchmark) onSelectCell(stats.topBenchmark.earth_cell_h3);
                  }}
                >
                  <Pictogram name="compare" className="h-5 w-5" />
                  <span>{t("discoverySpotlight.compareBenchmark")}</span>
                </Button>
              </div>
            ) : (
              <div>
                <Button variant="secondary" onClick={() => onToggleExcludeBenchmarks(false)}>
                  <span>{t("discoverySpotlight.showBenchmarksAction")}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Unexpected Candidates */}
        {stats.otherDiscoveries.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-center text-base font-bold text-content">
              {t("discoverySpotlight.moreUnexpectedTitle")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {stats.otherDiscoveries.map((item) => {
                const active = selectedH3 === item.earth_cell_h3;
                return (
                  <button
                    key={item.earth_cell_h3}
                    type="button"
                    onClick={() => onSelectCell(item.earth_cell_h3)}
                    className={`ckepi-liquid flex min-h-[4.5rem] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none ${
                      active ? "ckepi-liquid-glow text-content" : "text-content-muted hover:text-content"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-content">
                        {item.known_analog_name ?? t(item.region_key)}
                      </p>
                      <p className="truncate font-mono text-xs text-content-muted">
                        {item.country_code} · S_ind {formatPercent(item.s_ind, lang)} · S_dep{" "}
                        {formatPercent(item.s_dep, lang)}
                      </p>
                    </div>
                    <span className="font-mono text-xl font-semibold tabular-nums text-content">{formatPercent(item.combined_score, lang)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
